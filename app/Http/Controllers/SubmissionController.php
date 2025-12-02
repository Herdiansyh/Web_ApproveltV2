<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\SubdivisionPermission;
use App\Models\DocumentNameSeries;
use App\Services\PermissionCacheService;
use App\Services\SubmissionQueryService;
use App\Services\SubmissionListService;
use App\Services\DashboardStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;
use App\Jobs\StampPdfOnDecision;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private PermissionCacheService $permissionService,
        private SubmissionQueryService $queryService,
        private SubmissionListService $listService,
        private DashboardStatsService $dashboardService
    ) {}

    /** ------------------------
     *  LIST PENGAJUAN OLEH USER
     *  ------------------------ */
    public function index()
    {
        $user = Auth::user();
        // Subquery waktu aksi terakhir pada setiap submission (siapa pun yang bertindak)
        $lastActionSub = SubmissionWorkflowStep::selectRaw('submission_id, MAX(COALESCE(approved_at, updated_at)) as last_action_at')
            ->groupBy('submission_id');

        // Untuk Direktur: tampilkan hanya pengajuan yang sudah dia approve/reject
        if (strtolower((string) $user->role) === 'direktur') {
            $submissions = $this->queryService->baseQuery()
                ->select('submissions.*')
                ->leftJoinSub($lastActionSub, 'swslast', function ($join) {
                    $join->on('swslast.submission_id', '=', 'submissions.id');
                })
                ->completed()
                ->whereHas('workflowSteps', function ($q) use ($user) {
                    $q->where('approver_id', $user->id)
                      ->whereIn('status', ['approved', 'rejected']);
                })
                ->with([
                    'user:id,name,email,division_id',
                    'division:id,name',
                    'workflow:id,name,document_id',
                    'workflow.document:id,name',
                    'workflow.steps:id,workflow_id,step_order,division_id,role',
                    'workflow.steps.division:id,name'
                ])
                ->orderByDesc(DB::raw('swslast.last_action_at'))
                ->orderByDesc('submissions.updated_at')
                ->paginate(10);
        } else {
            // OPTIMIZED: Get submissions untuk user (history/completed)
            // Service handle permission checking dengan cache
            $submissions = $this->queryService->baseQuery()
                ->select('submissions.*')
                ->leftJoinSub($lastActionSub, 'swslast', function ($join) {
                    $join->on('swslast.submission_id', '=', 'submissions.id');
                })
                ->completed()  // Filter only approved/rejected
                ->where(function ($q) use ($user) {
                    // User sendiri atau admin
                    $q->where('user_id', $user->id)
                      ->orWhere(function ($or) use ($user) {
                          if ($user->role === 'admin') {
                              $or->whereRaw('1=1');
                          } else if ($user->subdivision_id) {
                              // Check if user has can_view permission
                              $canView = $this->permissionService->hasPermission($user->subdivision_id, 'can_view');
                              if ($canView) {
                                  $or->where('division_id', $user->division_id)->whereNotNull('workflow_id');
                              } else {
                                  $or->whereRaw('1=0');  // No access
                              }
                          }
                      });
                })
                ->with([
                    'user:id,name,email,division_id',
                    'division:id,name',
                    'workflow:id,name,document_id',
                    'workflow.document:id,name',
                    'workflow.steps:id,workflow_id,step_order,division_id,role',
                    'workflow.steps.division:id,name'
                ])
                ->orderByDesc(DB::raw('swslast.last_action_at'))
                ->orderByDesc('submissions.updated_at')
                ->paginate(10);
        }

        // Attach permission info (cached) and current_workflow_step
        if ($user->subdivision_id) {
            $permissions = $this->permissionService->getPermissionForSubdivision($user->subdivision_id);
            foreach ($submissions as $s) {
                $s->permission_for_me = $permissions;
                if ($s->workflow) {
                    $s->current_workflow_step = $s->workflow->steps
                        ->where('step_order', $s->current_step)
                        ->first();
                }
            }
        }

        return Inertia::render('Submissions/Index', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
        ]);
    }

    /** ------------------------
     *  LIST PENGAJUAN UNTUK DIVISI USER
     *  ------------------------ */
    public function forDivision(Request $request)
    {
        $user = Auth::user();
        $divisionId = $user->division_id;
        $subdivisionId = $user->subdivision_id;
        $statusFilter = $request->get('status', 'all');

        // OPTIMIZED: Get active submissions untuk division user
        // Service & cache handle permission checks
        $canViewGlobal = $subdivisionId
            ? $this->permissionService->hasPermission($subdivisionId, 'can_view')
            : false;

        $submissions = $this->queryService->baseQuery()
            ->active()  // Only non-approved/non-rejected
            ->where(function ($outer) use ($user, $divisionId, $canViewGlobal) {
                // Case 1: User sendiri
                $outer->where('user_id', $user->id)
                // Case 2: Current workflow step di divisi user (jika admin atau punya can_view)
                ->orWhere(function ($or) use ($divisionId, $canViewGlobal, $user) {
                    if ($user->role === 'admin' || $canViewGlobal) {
                        $or->whereNotNull('workflow_id')
                           ->whereHas('workflow.steps', function ($q) use ($divisionId) {
                               $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                                 ->where('workflow_steps.division_id', $divisionId);
                           });
                    }
                })
                // Case 3: Division sama dengan punya can_view
                ->orWhere(function ($or) use ($divisionId, $canViewGlobal) {
                    if ($canViewGlobal) {
                        $or->where('division_id', $divisionId)
                           ->whereNotNull('workflow_id');
                    }
                });
            })
            ->when($statusFilter === 'pending', fn($q) => $q->where('status', 'pending'))
            ->with([
                'user:id,name,email,division_id',
                'division:id,name',
                'workflow:id,name,document_id',
                'workflow.document:id,name',
                'workflow.steps:id,workflow_id,step_order,division_id,role',
                'workflow.steps.division:id,name',
                'workflowSteps:id,submission_id,step_order,approver_id,status'
            ])
            ->latest()
            ->paginate(10);

        // Attach permission info (cached)
        if ($subdivisionId) {
            $permissions = $this->permissionService->getPermissionForSubdivision($subdivisionId);
            foreach ($submissions as $s) {
                if ($s->workflow) {
                    $s->current_workflow_step = $s->workflow->steps
                        ->where('step_order', $s->current_step)
                        ->first();
                }
                $s->permission_for_me = $permissions;
            }
        }

        return Inertia::render('Submissions/ForDivision', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'statusFilter' => $statusFilter,
        ]);
    }

    /** ------------------------
     *  FORM BUAT PENGAJUAN
     *  ------------------------ */
    public function create()
    {
        $user = Auth::user();
        $division = $user->division;

        $workflows = Workflow::where('is_active', true)
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->with(['steps', 'steps.division', 'document.fields', 'document' => function($query) {
                $query->select('id', 'name', 'description', 'is_active', 'default_columns');
            }])
            ->get();

        return Inertia::render('Submissions/Create', [
            'userDivision' => $division,
            'workflows' => $workflows,
        ]);
    }

    /**
     * Generate series_code untuk submission berdasarkan konfigurasi DocumentNameSeries.
     * Hanya akan mengupdate jika series_code masih null.
     */
    protected function generateSeriesCode(Submission $submission): void
    {
        if ($submission->series_code) {
            return; // sudah ada, jangan generate ulang
        }

        $workflow = $submission->workflow;
        $document = $workflow?->document;
        if (!$document) {
            return;
        }

        $now = now();
        $series = DocumentNameSeries::firstOrCreate(
            ['document_id' => $document->id],
            [
                'series_pattern' => 'yyyy-mm-####',
                'prefix' => null,
                'current_number' => 0,
                'reset_type' => 'none',
                'last_reset_at' => null,
            ]
        );

        // Handle reset bulanan/tahunan jika diperlukan
        if ($series->reset_type === 'monthly' && $series->last_reset_at) {
            if ($series->last_reset_at->format('Y-m') !== $now->format('Y-m')) {
                $series->current_number = 0;
            }
        } elseif ($series->reset_type === 'yearly' && $series->last_reset_at) {
            if ($series->last_reset_at->format('Y') !== $now->format('Y')) {
                $series->current_number = 0;
            }
        }

        // Increment counter dan update last_reset_at
        $series->current_number = (int) $series->current_number + 1;
        $series->last_reset_at = $now;
        $series->save();

        $pattern = $series->series_pattern ?: 'yyyy-mm-####';
        $number = (int) $series->current_number;

        // Ganti token tanggal
        $formatted = str_replace(
            ['yyyy', 'yy', 'mm', 'dd'],
            [
                $now->format('Y'),
                $now->format('y'),
                $now->format('m'),
                $now->format('d'),
            ],
            $pattern
        );

        // Ganti blok # dengan nomor ber-padding
        $formatted = preg_replace_callback('/(#+)/', function ($m) use ($number) {
            $len = strlen($m[1]);
            return str_pad((string) $number, $len, '0', STR_PAD_LEFT);
        }, $formatted);

        $submission->series_code = ($series->prefix ?? '') . $formatted;
        $submission->save();
    }

    /**
     * Pastikan submission memiliki token verifikasi unik yang tidak dapat ditebak.
     */
    protected function ensureVerificationToken(Submission $submission): void
    {
        if ($submission->verification_token) {
            return;
        }

        do {
            $token = Str::random(48);
        } while (Submission::where('verification_token', $token)->exists());

        $submission->verification_token = $token;
        $submission->save();
    }

    /**
     * Generate file QR untuk URL verifikasi dan simpan ke storage publik.
     */
    protected function ensureQrCode(Submission $submission): void
    {
        // Pastikan token ada
        $this->ensureVerificationToken($submission);

        $verifyUrl = route('verification.show', $submission->verification_token);
        $dir = 'qrcodes/submissions';
        $filename = $submission->id . '.svg';
        $relativePath = $dir . '/' . $filename;

        // Buat direktori jika belum ada
        if (!Storage::disk('public')->exists($dir)) {
            Storage::disk('public')->makeDirectory($dir);
        }

        // Generate QR (SVG - tidak membutuhkan ekstensi imagick)
        $svg = QrCode::format('svg')
            ->size(200)
            ->margin(1)
            ->errorCorrection('M')
            ->generate($verifyUrl);

        Storage::disk('public')->put($relativePath, $svg);

        // Simpan path relatif ke kolom
        $submission->qr_code_path = $relativePath;
        $submission->save();
    }

    /** ------------------------
     *  SIMPAN PENGAJUAN DOKUMEN GENERIK (tanpa template)
     *  ------------------------ */

    /** ------------------------
     *  DOWNLOAD DOKUMEN (PILIH STAMPED/GENERATED/ORIGINAL)
     *  ------------------------ */
    public function download(Submission $submission)
    {
        $this->authorize('view', $submission);

        $path = null;

        // Prefer stamped if exists and status final (approved/rejected)
        $status = strtolower((string) $submission->status);
        if (str_contains($status, 'approved') || str_contains($status, 'rejected') || $status === 'rejected') {
            $stamped = $submission->stamped; // relation
            if ($stamped && $stamped->stamped_pdf_path && Storage::disk('private')->exists($stamped->stamped_pdf_path)) {
                $path = $stamped->stamped_pdf_path;
            }
        }

        // Fallback to generated
        if (!$path && $submission->generated_pdf_path && Storage::disk('private')->exists($submission->generated_pdf_path)) {
            $path = $submission->generated_pdf_path;
        }

        // Fallback to original uploaded file
        if (!$path && $submission->file_path && Storage::disk('private')->exists($submission->file_path)) {
            $path = $submission->file_path;
        }

        if (!$path) {
            abort(404, 'File tidak ditemukan.');
        }

        $abs = Storage::disk('private')->path($path);
        $type = mime_content_type($abs);
        return response()->download($abs, basename($path), [
            'Content-Type' => $type,
        ]);
    }

    /** ------------------------
     *  SIMPAN PENGAJUAN BARU
     *  ------------------------ */
    public function store(Request $request)
    {
        // Check if this is FormData request (has file or content-type is multipart)
        $isFormData = $request->hasFile('file') || $request->header('Content-Type') && str_contains($request->header('Content-Type'), 'multipart/form-data');
        
        if ($isFormData) {
            $validated = $request->validate([
                'workflow_id' => 'required|exists:workflows,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|max:10240',
                'data' => 'nullable|string', // Allow string for FormData JSON
            ]);
            
            // Convert JSON string to array for FormData requests
            $dataPayload = [];
            if (!empty($validated['data'])) {
                $dataPayload = json_decode($validated['data'], true) ?? [];
            }
        } else {
            $validated = $request->validate([
                'workflow_id' => 'required|exists:workflows,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|max:10240',
                'data' => 'nullable|array',
            ]);
            
            $dataPayload = $validated['data'] ?? [];
        }


        $user = Auth::user();

        $workflow = Workflow::with(['steps', 'steps.division', 'document.fields'])
            ->where('id', $validated['workflow_id'])
            ->where('is_active', true)
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->firstOrFail();

        $steps = $workflow->steps->sortBy('step_order')->values();

        // Validate required dynamic fields from Document Type
        $docFields = $workflow->document?->fields ?? collect();
        
        // Skip validation if no fields are defined for this document type
        if ($docFields->isNotEmpty()) {
            // Process table data from direct request fields (Inertia sends them separately)
            $tableData = $request->input('tableData');
            $tableColumns = $request->input('tableColumns');
            
            // For FormData requests, table data comes as JSON strings
            if ($isFormData) {
                $tableData = $request->input('tableData');
                $tableColumns = $request->input('tableColumns');
                
                // Decode JSON strings from FormData
                if (!empty($tableData)) {
                    $decodedTableData = json_decode($tableData, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedTableData)) {
                        $dataPayload['tableData'] = $decodedTableData;
                    }
                }
                
                if (!empty($tableColumns)) {
                    $decodedTableColumns = json_decode($tableColumns, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedTableColumns)) {
                        $dataPayload['tableColumns'] = $decodedTableColumns;
                    }
                }
            } else {
                // Normal form requests (Inertia)
                if (!empty($tableData) && is_array($tableData)) {
                    $dataPayload['tableData'] = $tableData;
                }
                
                if (!empty($tableColumns) && is_array($tableColumns)) {
                    $dataPayload['tableColumns'] = $tableColumns;
                }
            }
            
            // Also try to process JSON strings within data object (fallback)
            if (!empty($dataPayload['tableDataJson'])) {
                try {
                    $tableDataFromJson = json_decode($dataPayload['tableDataJson'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($tableDataFromJson)) {
                        $dataPayload['tableData'] = $tableDataFromJson;
                    }
                } catch (\Exception $e) {
                    // Error decoding tableDataJson
                }
            }
            
            if (!empty($dataPayload['tableColumnsJson'])) {
                try {
                    $tableColumnsFromJson = json_decode($dataPayload['tableColumnsJson'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($tableColumnsFromJson)) {
                        $dataPayload['tableColumns'] = $tableColumnsFromJson;
                    }
                } catch (\Exception $e) {
                    // Error decoding tableColumnsJson
                }
            }
            
            // Remove the JSON strings after processing
            unset($dataPayload['tableDataJson']);
            unset($dataPayload['tableColumnsJson']);
            
            foreach ($docFields as $df) {
                if ($df->required && (!array_key_exists($df->name, $dataPayload) || $dataPayload[$df->name] === null || $dataPayload[$df->name] === '')) {
                    // Check if this is an API request
                    if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                        return response()->json([
                            'success' => false,
                            'message' => $df->label . ' wajib diisi',
                            'errors' => ["data.{$df->name}" => $df->label . ' wajib diisi']
                        ], 422);
                    }
                    
                    return back()->withErrors(["data.{$df->name}" => $df->label . ' wajib diisi'])->withInput();
                }
            }
        } else {
            // For documents without fields, still process table data if provided
            $tableData = $request->input('tableData');
            $tableColumns = $request->input('tableColumns');
            
            // For FormData requests, table data comes as JSON strings
            if ($isFormData) {
                if (!empty($tableData)) {
                    $decodedTableData = json_decode($tableData, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedTableData)) {
                        $dataPayload['tableData'] = $decodedTableData;
                    }
                }
                
                if (!empty($tableColumns)) {
                    $decodedTableColumns = json_decode($tableColumns, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedTableColumns)) {
                        $dataPayload['tableColumns'] = $decodedTableColumns;
                    }
                }
            } else {
                // Normal form requests (Inertia)
                if (!empty($tableData) && is_array($tableData)) {
                    $dataPayload['tableData'] = $tableData;
                }
                
                if (!empty($tableColumns) && is_array($tableColumns)) {
                    $dataPayload['tableColumns'] = $tableColumns;
                }
            }
            
            // Also try to process JSON strings within data object (fallback)
            if (!empty($dataPayload['tableDataJson'])) {
                try {
                    $tableDataFromJson = json_decode($dataPayload['tableDataJson'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($tableDataFromJson)) {
                        $dataPayload['tableData'] = $tableDataFromJson;
                    }
                } catch (\Exception $e) {
                    // Error decoding tableDataJson
                }
            }
            
            if (!empty($dataPayload['tableColumnsJson'])) {
                try {
                    $tableColumnsFromJson = json_decode($dataPayload['tableColumnsJson'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($tableColumnsFromJson)) {
                        $dataPayload['tableColumns'] = $tableColumnsFromJson;
                    }
                } catch (\Exception $e) {
                    // Error decoding tableColumnsJson
                }
            }
            
            // Remove the JSON strings after processing
            unset($dataPayload['tableDataJson']);
            unset($dataPayload['tableColumnsJson']);
        }

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('submissions', 'private');
        }

        $submission = Submission::create([
            'user_id' => $user->id,
            'division_id' => $user->division_id,
            'workflow_id' => $workflow->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_path' => $filePath,
            'status' => 'pending',
            'current_step' => 1,
            'data_json' => !empty($dataPayload) ? $dataPayload : null,
        ]);


        // Generate series_code saat dibuat agar nomor dokumen tersedia sejak awal
        $this->generateSeriesCode($submission);
        // Generate token verifikasi & QR code
        $this->ensureVerificationToken($submission);
        $this->ensureQrCode($submission);

        foreach ($steps as $step) {
            SubmissionWorkflowStep::create([
                'submission_id' => $submission->id,
                'division_id' => $step->division_id,
                'step_order' => $step->step_order,
                'status' => 'pending',
            ]);
        }

        // Check if this is an API request (from fetch)
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => 'Pengajuan berhasil dibuat.',
                'submission_id' => $submission->id,
                'redirect_url' => route('submissions.forDivision')
            ]);
        }

        return redirect()->route('submissions.forDivision')->with('success', 'Pengajuan berhasil dibuat.');
    }

    /** ------------------------
     *  DETAIL PENGAJUAN
     *  ------------------------ */
    public function show(Submission $submission)
    {
        $this->authorize('view', $submission);

        $submission->load([
            'user.division',
            'workflow.document',
            'workflow.document.nameSeries',
            'workflowSteps.division',
            'workflow.steps.division',
            'stamped',
        ]);

        $user = Auth::user();

        // Ambil WorkflowStep saat ini jika ada workflow; untuk template-only bisa null
        $currentWorkflowStep = $submission->workflow
            ? $submission->workflow->steps
                ->where('step_order', $submission->current_step)
                ->first()
            : null;

        // Ambil submission workflow step untuk tracking status
        $currentSubmissionStep = $submission->workflow
            ? $submission->workflowSteps
                ->where('step_order', $submission->current_step)
                ->first()
            : null;

        $canApprove = false;
        $filteredActions = [];

        // 🔥 Hanya izinkan aksi bila step saat ini masih pending
        $isCurrentStepPending = $currentSubmissionStep && $currentSubmissionStep->status === 'pending';

        // 🔥 Cek permission global; admin bypass
        if ($currentWorkflowStep && $isCurrentStepPending && ($user->role === 'admin' || $user->division_id === $currentWorkflowStep->division_id)) {
            $permission = $user->subdivision_id
                ? SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->first()
                : null;

            if ($permission || $user->role === 'admin') {
                // User bisa approve jika punya permission global
                $canApprove = $user->role === 'admin' ? true : ($permission->can_approve || $permission->can_reject || $permission->can_request_next);

                // Pastikan actions berbentuk array sebelum difilter
                $actionsRaw = $currentWorkflowStep->actions;
                if (is_string($actionsRaw)) {
                    $decoded = json_decode($actionsRaw, true);
                    $actionsArray = is_array($decoded) ? $decoded : [];
                } elseif (is_array($actionsRaw)) {
                    $actionsArray = $actionsRaw;
                } else {
                    $actionsArray = [];
                }

                // Filter actions sesuai permission
                $filteredActions = array_values(array_filter($actionsArray, function ($action) use ($permission, $user) {
                    $a = strtolower((string) $action);
                    if ($user->role === 'admin') return true;
                    if (str_contains($a, 'approve')) return (bool) $permission->can_approve;
                    if (str_contains($a, 'reject')) return (bool) $permission->can_reject;
                    if (str_contains($a, 'request')) return (bool) $permission->can_request_next;
                    return true; // actions lain dibiarkan
                }));
            }
        }

        // 🔥 PENTING: Parse actions jika masih string (untuk Inertia)
        if ($currentWorkflowStep) {
            // Pastikan array dan terapkan filter jika ada
            $actionsRaw = $currentWorkflowStep->actions;
            if (is_string($actionsRaw)) {
                $decoded = json_decode($actionsRaw, true);
                $actionsArray = is_array($decoded) ? $decoded : [];
            } elseif (is_array($actionsRaw)) {
                $actionsArray = $actionsRaw;
            } else {
                $actionsArray = [];
            }
            $currentWorkflowStep->actions = !empty($filteredActions) ? $filteredActions : $actionsArray;
        }

        $fileUrl = route('submissions.file', $submission->id);
        $fileExists = $submission->file_path && Storage::disk('private')->exists($submission->file_path);

        // 🔥 Debug log
        Log::info('Show Submission Debug:', [
            'submission_id' => $submission->id,
            'current_step' => $submission->current_step,
            'workflow_step_id' => $currentWorkflowStep?->id,
            'actions' => $currentWorkflowStep?->actions,
            'actions_type' => gettype($currentWorkflowStep?->actions),
            'user_subdivision_id' => $user->subdivision_id,
            'can_approve' => $canApprove,
        ]);

        $hasStamped = false;
        if ($submission->stamped && $submission->stamped->stamped_pdf_path && Storage::disk('private')->exists($submission->stamped->stamped_pdf_path)) {
            $hasStamped = true;
        }

        return Inertia::render('Submissions/Show', [
            'submission' => $submission,
            'workflowSteps' => $submission->workflowSteps()->orderBy('step_order')->get(),
            'currentStep' => $currentWorkflowStep, // 🔥 Kirim WorkflowStep (ada field actions)
            'currentSubmissionStep' => $currentSubmissionStep, // Status tracking
            'canApprove' => $canApprove,
            'fileUrl' => $fileUrl,
            'fileExists' => $fileExists,
            'documentFields' => $submission->workflow?->document?->fields ?? [],
            'permissionForMe' => $user->subdivision_id ? SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->first() : null,
            'userDivisionId' => $user->division_id,
            'hasStamped' => $hasStamped,
        ]);
    }

    /** ------------------------
     *  PRINT PREVIEW (Generic by Document Fields)
     *  ------------------------ */
    public function printDocument(Submission $submission)
    {
        $this->authorize('view', $submission);
        $submission->load(['user.division', 'workflow.document.fields', 'workflowSteps.approver', 'workflowSteps.division']);

        // Pastikan series_code sudah ada ketika dokumen dicetak
        $this->generateSeriesCode($submission);
        // Pastikan QR tersedia sebelum render
        if (!$submission->qr_code_path) {
            $this->ensureQrCode($submission);
        }
        // Pastikan token tersedia untuk generate QR inline
        $this->ensureVerificationToken($submission);
        $verifyUrl = route('verification.show', $submission->verification_token);
        $qrSvg = QrCode::format('svg')
            ->size(180)
            ->margin(0)
            ->errorCorrection('M')
            ->color(17, 24, 39) // #111827
            ->backgroundColor(255, 255, 255)
            ->generate($verifyUrl);
        $fields = $submission->workflow?->document?->fields ?? collect();

        // Kumpulkan semua approver yang sudah approve
        $approvers = [];
        if ($submission->workflow && $submission->workflow->steps && $submission->workflowSteps) {
            $approvedSteps = $submission->workflowSteps
                ->where('status', 'approved')
                ->sortBy('step_order');
                
            foreach ($approvedSteps as $step) {
                if ($step->approver && $step->approved_at) {
                    $approvers[] = [
                        'name' => $step->approver->name,
                        'role' => $step->division->name ?? $step->role ?? 'Unknown',
                        'approved_at' => (string) $step->approved_at
                    ];
                }
            }
        }

        $html = view('documents.print-generic', [
            'submission' => $submission,
            'fields' => $fields,
            'data' => $submission->data_json ?? [],
            'approvers' => $approvers,
            'qrSvg' => $qrSvg,
            'verifyUrl' => $verifyUrl,
        ])->render();

        return response($html);
    }

    /** ------------------------
     *  HISTORY (Riwayat Pengajuan) - berdasarkan aksi user
     *  ------------------------ */
    public function history(Request $request)
    {
        $user = Auth::user();

        // Subquery: waktu aksi terakhir user pada setiap submission
        $lastActionSub = SubmissionWorkflowStep::selectRaw('submission_id, MAX(COALESCE(approved_at, updated_at)) as last_action_at')
            ->where('approver_id', $user->id)
            ->groupBy('submission_id');

        $query = Submission::query()
            ->select('submissions.*')
            ->leftJoinSub($lastActionSub, 'swslast', function ($join) {
                $join->on('swslast.submission_id', '=', 'submissions.id');
            })
            ->with([
                'user',
                'workflow.document',
                'workflow.steps',
                'workflowSteps.division',
                'workflowSteps.approver',
            ])
            ->whereHas('workflowSteps', function ($q) use ($user) {
                $q->where('approver_id', $user->id);
            })
            ->orderByDesc(DB::raw('swslast.last_action_at'))
            ->orderByDesc('submissions.updated_at');

        $submissions = $query->paginate(10);

        foreach ($submissions as $s) {
            $myStep = $s->workflowSteps
                ->where('approver_id', $user->id)
                ->sortByDesc(function ($ws) {
                    return $ws->approved_at ?: $ws->updated_at;
                })
                ->first();
            $s->my_history_step = $myStep;
        }

        return Inertia::render('Submissions/History', [
            'submissions' => $submissions,
        ]);
    }

    /** ------------------------
     *  VIEW FILE
     *  ------------------------ */
    public function file(Submission $submission)
    {
        $this->authorize('view', $submission);
        if (!$submission->file_path || !Storage::disk('private')->exists($submission->file_path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $path = Storage::disk('private')->path($submission->file_path);
        $type = mime_content_type($path);

        return response()->file($path, [
            'Content-Type' => $type,
            'Content-Disposition' => 'inline; filename="' . basename($submission->file_path) . '"',
        ]);
    }

    /** ------------------------
     *  APPROVE PENGAJUAN
     *  ------------------------ */
    public function approve(Request $request, Submission $submission)
    {
        $this->authorize('approve', $submission);
        $user = Auth::user();

        $submission->load(['workflow.steps.division', 'workflowSteps.division']);
        if (!$submission->workflow) {
            abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
        }

        $currentStep = $submission->workflowSteps->where('step_order', $submission->current_step)->first();
        $workflowStep = $submission->workflow->steps->where('step_order', $submission->current_step)->first();

        if (!$workflowStep || ($user->role !== 'admin' && $user->division_id !== $workflowStep->division_id)) {
            abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
        }

        $permission = $user->subdivision_id
            ? SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->where('can_approve', true)->first()
            : null;
        if (!$currentStep || !$permission) {
            abort(403, 'Anda tidak memiliki izin untuk menyetujui pengajuan ini.');
        }

        if ($currentStep->status !== 'pending') {
            return back()->with('info', 'Pengajuan ini sudah ' . $currentStep->status . ' pada langkah ini.');
        }

        $currentStep->status = 'approved';
        $currentStep->approver_id = $user->id;
        $currentStep->approved_at = now();
        $currentStep->save();

        $maxStepOrder = $submission->workflowSteps->max('step_order');
        $isFinal = $submission->current_step >= $maxStepOrder;
        if ($isFinal) {
            $currentDiv = $currentStep->division;
            $currentDivName = $currentDiv ? $currentDiv->name : 'Final Division';
            $submission->status = 'Approved by ' . $currentDivName;
            $this->generateSeriesCode($submission);
        } else {
            $nextStepOrder = $submission->current_step + 1;
            $nextSubmissionStep = $submission->workflowSteps->where('step_order', $nextStepOrder)->first();
            $nextDiv = $nextSubmissionStep ? $nextSubmissionStep->division : null;
            $nextDivName = $nextDiv ? $nextDiv->name : 'Next Division';
            $submission->current_step = $nextStepOrder;
            $submission->status = 'Waiting to ' . $nextDivName . ' Division';
        }
        $submission->save();

        if ($isFinal) {
            // Kumpulkan semua approver yang sudah approve untuk stamping
            $approvers = [];
            $approvedSteps = $submission->workflowSteps
                ->where('status', 'approved')
                ->sortBy('step_order');
                
            foreach ($approvedSteps as $step) {
                if ($step->approver && $step->approved_at) {
                    $approvers[] = [
                        'name' => $step->approver->name,
                        'role' => $step->division->name ?? $step->role ?? 'Unknown',
                        'approved_at' => (string) $step->approved_at
                    ];
                }
            }
            
            // Proses stamping secara sinkron agar file stamped tersedia segera setelah approve
            StampPdfOnDecision::dispatchSync($submission->id, 'approved', $approvers);
        }

        if (!Auth::user()->can('view', $submission)) {
            // Check if this is an API request
            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json([
                    'success' => true,
                    'message' => 'Dokumen berhasil disetujui.',
                    'redirect_url' => route('submissions.forDivision')
                ]);
            }
            return redirect()->route('submissions.forDivision')->with('success', 'Dokumen berhasil disetujui.');
        }
        
        // Check if this is an API request
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil disetujui.',
                'redirect_url' => route('submissions.show', $submission->id)
            ]);
        }
        
        return back()->with('success', 'Dokumen berhasil disetujui.');
    }

/** ------------------------
 *  REQUEST TO NEXT (tanpa approve)
 *  ------------------------ */
public function requestNext(Request $request, Submission $submission)
{
    $user = Auth::user();

    $submission->load(['workflow.steps.division', 'workflowSteps.division']);
    if (!$submission->workflow) {
        abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
    }

    $currentWorkflowStep = $submission->workflow->steps->where('step_order', $submission->current_step)->first();
    $currentSubmissionStep = $submission->workflowSteps->where('step_order', $submission->current_step)->first();
    if (!$currentWorkflowStep || !$currentSubmissionStep) {
        abort(404, 'Langkah tidak ditemukan.');
    }

    if ($user->role !== 'admin' && $user->division_id !== $currentWorkflowStep->division_id) {
        abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
    }

    if ($currentSubmissionStep->status !== 'pending') {
        return back()->with('info', 'Pengajuan ini sudah ' . $currentSubmissionStep->status . ' pada langkah ini.');
    }

    $permission = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->where('can_request_next', true)->first();
    if (!$permission) {
        abort(403, 'Anda tidak memiliki izin untuk meneruskan pengajuan ini.');
    }

    $currentSubmissionStep->status = 'approved';
    $currentSubmissionStep->approver_id = $user->id;
    $currentSubmissionStep->approved_at = now();
    $currentSubmissionStep->save();

    $maxStepOrder = $submission->workflowSteps->max('step_order');
    $isFinal = $submission->current_step >= $maxStepOrder;
    if ($isFinal) {
        $currDiv = $currentSubmissionStep->division;
        $currDivName = $currDiv ? $currDiv->name : 'Final Division';
        $submission->status = 'Approved by ' . $currDivName;
    } else {
        $nextStepOrder = $submission->current_step + 1;
        $nextSubmissionStep = $submission->workflowSteps->where('step_order', $nextStepOrder)->first();
        $nextDiv = $nextSubmissionStep ? $nextSubmissionStep->division : null;
        $nextDivName = $nextDiv ? $nextDiv->name : 'Next Division';
        $submission->current_step = $nextStepOrder;
        $submission->status = 'Waiting to ' . $nextDivName . ' Division';
    }
    $submission->save();

    if (!Auth::user()->can('view', $submission)) {
            // Check if this is an API request
            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json([
                    'success' => true,
                    'message' => 'Permintaan ke langkah berikutnya berhasil.',
                    'redirect_url' => route('submissions.forDivision')
                ]);
            }
            return redirect()->route('submissions.forDivision')->with('success', 'Permintaan ke langkah berikutnya berhasil.');
        }
        
        // Check if this is an API request
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => 'Permintaan ke langkah berikutnya berhasil.',
                'redirect_url' => route('submissions.show', $submission->id)
            ]);
        }
        
        return back()->with('success', 'Permintaan ke langkah berikutnya berhasil.');
}

/** ------------------------
 *  REJECT PENGAJUAN
 *  ------------------------ */
public function reject(Request $request, Submission $submission)
{
    $this->authorize('reject', $submission);
    $user = Auth::user();

    $submission->load(['workflow.steps.division', 'workflowSteps.division']);
    if (!$submission->workflow) {
        abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
    }

    $currentStep = $submission->workflowSteps->where('step_order', $submission->current_step)->first();
    $workflowStep = $submission->workflow->steps->where('step_order', $submission->current_step)->first();

    if (!$workflowStep || ($user->role !== 'admin' && $user->division_id !== $workflowStep->division_id)) {
        abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
    }

    $permission = $user->subdivision_id
        ? SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->where('can_reject', true)->first()
        : null;
    if (!$currentStep || !$permission) {
        abort(403, 'Anda tidak memiliki izin untuk menolak pengajuan ini.');
    }

    if ($currentStep->status !== 'pending') {
        return back()->with('info', 'Pengajuan ini sudah ' . $currentStep->status . ' pada langkah ini.');
    }

    $currentStep->status = 'rejected';
    $currentStep->approver_id = $user->id;
    $currentStep->approved_at = now();
    // Save rejection note if provided
    if ($request->filled('approval_note')) {
        $currentStep->note = $request->input('approval_note');
    }
    $currentStep->save();

    $submission->status = 'rejected';
    $submission->save();

    // Untuk reject, hanya kirimkan rejector sebagai approver
    $rejectApprovers = [[
        'name' => $user->name,
        'role' => $currentStep->division->name ?? $user->role ?? 'Unknown',
        'approved_at' => now()->toDateTimeString()
    ]];
    
    dispatch(new StampPdfOnDecision($submission->id, 'rejected', $rejectApprovers));

    if (!Auth::user()->can('view', $submission)) {
            // Check if this is an API request
            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json([
                    'success' => true,
                    'message' => 'Dokumen telah ditolak.',
                    'redirect_url' => route('submissions.forDivision')
                ]);
            }
            return redirect()->route('submissions.forDivision')->with('success', 'Dokumen telah ditolak.');
        }
        
        // Check if this is an API request
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => 'Dokumen telah ditolak.',
                'redirect_url' => route('submissions.show', $submission->id)
            ]);
        }
        
        return back()->with('success', 'Dokumen telah ditolak.');
}

/** ------------------------
 *  EDIT PENGAJUAN
 *  ------------------------ */
public function edit(Submission $submission)
{
    $this->authorize('update', $submission);

    $submission->load([
        'user.division',
        'workflow.document.fields',
        'workflow.steps.division',
        'workflowSteps.division'
    ]);

    $documentFields = $submission->workflow?->document?->fields ?? [];

    return Inertia::render('Submissions/Edit', [
        'submission' => $submission,
        'documentFields' => $documentFields,
    ]);
}

/** ------------------------
 *  UPDATE PENGAJUAN
 *  ------------------------ */
public function update(Request $request, Submission $submission)
{
    // Check if this is an API request and handle authorization errors
    if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
        try {
            $this->authorize('update', $submission);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk mengubah pengajuan ini.',
                'errors' => ['authorization' => 'Unauthorized']
            ], 403);
        }
    } else {
        $this->authorize('update', $submission);
    }

    // Check if this is an API request and handle validation errors
    if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|max:10240',
                'data' => 'nullable|string', // Allow string for FormData JSON
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    } else {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
            'data' => 'nullable|array', // Array for normal form requests
        ]);
    }

    $submission->load(['workflow.document.fields']);

    $docFields = $submission->workflow?->document?->fields ?? collect();
    
    // Handle data from FormData (JSON string)
    $dataPayload = $validated['data'] ?? ($submission->data_json ?? []);
    if (is_string($dataPayload)) {
        $dataPayload = json_decode($dataPayload, true) ?? [];
    }
    
    foreach ($docFields as $df) {
        if ($df->required && (!array_key_exists($df->name, $dataPayload) || $dataPayload[$df->name] === null || $dataPayload[$df->name] === '')) {
            // Check if this is an API request
            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json([
                    'success' => false,
                    'message' => $df->label . ' wajib diisi',
                    'errors' => ["data.{$df->name}" => $df->label . ' wajib diisi']
                ], 422);
            }
            
            return back()->withErrors(["data.{$df->name}" => $df->label . ' wajib diisi'])->withInput();
        }
    }

    if ($request->hasFile('file')) {
        // delete old file
        if ($submission->file_path && Storage::disk('private')->exists($submission->file_path)) {
            Storage::disk('private')->delete($submission->file_path);
        }
        $filePath = $request->file('file')->store('submissions', 'private');
        $submission->file_path = $filePath;
    }

    $submission->title = $validated['title'];
    $submission->description = $validated['description'] ?? $submission->description;
    $submission->data_json = $dataPayload ?: null;
    $submission->save();

    // Check if this is an API request
    if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
        return response()->json([
            'success' => true,
            'message' => 'Pengajuan berhasil diperbarui.',
            'redirect_url' => route('submissions.index')
        ]);
    }

    return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil diperbarui.');
}

/** ------------------------
 *  HAPUS PENGAJUAN
 *  ------------------------ */
public function destroy(Request $request, Submission $submission)
{
    $this->authorize('delete', $submission);

    // delete file
    if ($submission->file_path && Storage::disk('private')->exists($submission->file_path)) {
        Storage::disk('private')->delete($submission->file_path);
    }

    $submission->delete();

    // Check if this is an API request
    if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
        return response()->json([
            'success' => true,
            'message' => 'Pengajuan berhasil dihapus.',
            'redirect_url' => route('submissions.index')
        ]);
    }

    return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil dihapus.');
}
}