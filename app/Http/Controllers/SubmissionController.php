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
    public function index(Request $request)
    {
        $user = Auth::user();
        $search = $request->get('search');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $prefixFilter = $request->get('prefix');
        $doctypeFilter = $request->get('doctype');
        $divisionFilter = $request->get('division');
        $statusFilter = $request->get('status');
        
        // Subquery waktu aksi terakhir pada setiap submission (siapa pun yang bertindak)
        $lastActionSub = SubmissionWorkflowStep::selectRaw('submission_id, MAX(COALESCE(approved_at, updated_at)) as last_action_at')
            ->groupBy('submission_id');

        // Untuk Direktur: tampilkan hanya pengajuan yang sudah dia approve/reject
        if (strtolower((string) $user->role) === 'direktur') {
            $query = $this->queryService->baseQuery()
                ->select('submissions.*')
                ->leftJoinSub($lastActionSub, 'swslast', function ($join) {
                    $join->on('swslast.submission_id', '=', 'submissions.id');
                })
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%'])
                      ->orWhere('status', 'cancelled');
                })
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
                ]);
        } else {
            // OPTIMIZED: Get submissions untuk user (history/completed)
            // Service handle permission checking dengan cache
            $query = $this->queryService->baseQuery()
                ->select('submissions.*')
                ->leftJoinSub($lastActionSub, 'swslast', function ($join) {
                    $join->on('swslast.submission_id', '=', 'submissions.id');
                })
                ->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
                      ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%'])
                      ->orWhere('status', 'cancelled');
                })
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
                ]);
        }

        // Apply filters
        if ($search) {
            $query->where('submissions.title', 'like', '%' . $search . '%');
        }
        
        if ($startDate) {
            $query->whereDate('submissions.created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('submissions.created_at', '<=', $endDate);
        }

        // Apply prefix filter if selected
        if ($prefixFilter) {
            $query->where('submissions.series_code', 'like', $prefixFilter . '%');
        }

        // Apply doctype filter if selected
        if ($doctypeFilter) {
            $query->whereHas('workflow.document', function ($q) use ($doctypeFilter) {
                $q->where('documents.id', $doctypeFilter);
            });
        }

        // Apply division filter if selected
        if ($divisionFilter) {
            $query->where('submissions.division_id', $divisionFilter);
        }

        // Apply status filter if selected
        if ($statusFilter) {
            if ($statusFilter === 'approved') {
                $query->where(function ($q) {
                    $q->whereRaw('LOWER(status) LIKE ?', ['%approved%']);
                });
            } elseif ($statusFilter === 'rejected') {
                $query->where(function($q) {
                    $q->where('submissions.status', 'like', '%rejected%')
                      ->orWhere('submissions.status', 'like', '%reject%');
                });
            } elseif ($statusFilter === 'cancelled') {
                $query->where('submissions.status', 'cancelled');
            }
        }

        $submissions = $query->orderByDesc(DB::raw('swslast.last_action_at'))
            ->orderByDesc('submissions.updated_at')
            ->paginate(10);

        // Get all registered prefixes from DocumentNameSeries
        $availablePrefixes = DocumentNameSeries::whereNotNull('prefix')
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->with('document:id,name')
            ->get()
            ->map(function ($series) {
                return [
                    'prefix' => $series->prefix,
                    'document_name' => $series->document->name,
                ];
            })
            ->sortBy('prefix')
            ->values();

        // Attach permission info (cached) and current_workflow_step
        if ($user->subdivision_id) {
            $permissions = $this->permissionService->getPermissionForSubdivision($user->subdivision_id);
            
            // Optimized: Load all workflow steps in single query to avoid N+1
            $workflowStepIds = $submissions->pluck('workflow_id')->filter();
            $workflowStepsMap = [];
            
            if ($workflowStepIds->isNotEmpty()) {
                $workflowSteps = \App\Models\WorkflowStep::whereIn('workflow_id', $workflowStepIds)
                    ->whereIn('step_order', $submissions->pluck('current_step'))
                    ->with(['workflow'])
                    ->get()
                    ->groupBy(function ($step) {
                        return $step->workflow_id . '_' . $step->step_order;
                    });
                
                foreach ($workflowSteps as $key => $steps) {
                    $workflowStepsMap[$key] = $steps->first();
                }
            }
            
            foreach ($submissions as $s) {
                $s->permission_for_me = $permissions;
                if ($s->workflow_id && $s->current_step) {
                    $key = $s->workflow_id . '_' . $s->current_step;
                    $s->current_workflow_step = $workflowStepsMap[$key] ?? null;
                }
            }
        }

        return Inertia::render('Submissions/Index', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'availablePrefixes' => $availablePrefixes,
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
        $search = $request->get('search');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $prefixFilter = $request->get('prefix');
        $doctypeFilter = $request->get('doctype');
        $divisionFilter = $request->get('division');

        // ========================================================
        // PENGAJUAN MASUK: Submission yang membutuhkan aksi user
        // ========================================================
        // Kriteria:
        // 1. Status: active/waiting
        // 2. User punya permission action (approve/reject/request_next)
        // 3. Step saat ini adalah milik divisi user
        // ========================================================
        
        // Check if user has any action permission (approve, reject, or request_next)
        // For admin/direktur, they have implicit action permission on their division
        $hasActionPermission = false;
        if ($user->role === 'admin') {
            $hasActionPermission = true;
        } elseif ($user->role === 'direktur') {
            // Direktur selalu bisa melakukan aksi di divisi mereka
            $hasActionPermission = true;
        } elseif ($subdivisionId) {
            // Check explicit permission dari subdivision
            $actionPerms = $this->permissionService->getMultiplePermissions(
                $subdivisionId, 
                ['can_approve', 'can_reject', 'can_request_next']
            );
            $hasActionPermission = in_array(true, $actionPerms);
        }

        $query = $this->queryService->baseQuery()
            ->active()  // Only non-approved/non-rejected
            ->where(function ($q) use ($user, $divisionId, $hasActionPermission) {
                // Jika user punya action permission, tampilkan submission yang:
                // 1. Step saat ini adalah milik divisi user (bisa dibuat oleh siapa saja)
                if ($user->role === 'admin' || $hasActionPermission) {
                    $q->whereNotNull('workflow_id')
                      ->whereHas('workflow.steps', function ($subQ) use ($divisionId) {
                          $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                               ->where('workflow_steps.division_id', $divisionId);
                      });
                } else {
                    // User tidak punya permission, tampilkan hasil kosong
                    $q->whereRaw('1=0');
                }
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
            ]);

        // Apply filters
        if ($search) {
            $query->where('submissions.title', 'like', '%' . $search . '%');
        }
        
        if ($startDate) {
            $query->whereDate('submissions.created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('submissions.created_at', '<=', $endDate);
        }

        // Apply prefix filter if selected
        if ($prefixFilter) {
            $query->where('submissions.series_code', 'like', $prefixFilter . '%');
        }

        // Apply doctype filter if selected
        if ($doctypeFilter) {
            $query->whereHas('workflow.document', function ($q) use ($doctypeFilter) {
                $q->where('documents.id', $doctypeFilter);
            });
        }

        // Apply division filter if selected
        if ($divisionFilter) {
            $query->where('submissions.division_id', $divisionFilter);
        }

        $submissions = $query->latest()->paginate(10);

        // Get all registered prefixes from DocumentNameSeries
        $availablePrefixes = DocumentNameSeries::whereNotNull('prefix')
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->with('document:id,name')
            ->get()
            ->map(function ($series) {
                return [
                    'prefix' => $series->prefix,
                    'document_name' => $series->document->name,
                ];
            })
            ->sortBy('prefix')
            ->values();

        // Attach permission info (cached)
        if ($subdivisionId) {
            $permissions = $this->permissionService->getPermissionForSubdivision($subdivisionId);
            
            // Optimized: Load all workflow steps in single query to avoid N+1
            $workflowStepIds = $submissions->pluck('workflow_id')->filter();
            $workflowStepsMap = [];
            
            if ($workflowStepIds->isNotEmpty()) {
                $workflowSteps = \App\Models\WorkflowStep::whereIn('workflow_id', $workflowStepIds)
                    ->whereIn('step_order', $submissions->pluck('current_step'))
                    ->with(['workflow'])
                    ->get()
                    ->groupBy(function ($step) {
                        return $step->workflow_id . '_' . $step->step_order;
                    });
                
                foreach ($workflowSteps as $key => $steps) {
                    $workflowStepsMap[$key] = $steps->first();
                }
            }
            
            foreach ($submissions as $s) {
                if ($s->workflow_id && $s->current_step) {
                    $key = $s->workflow_id . '_' . $s->current_step;
                    $s->current_workflow_step = $workflowStepsMap[$key] ?? null;
                }
                $s->permission_for_me = $permissions;
            }
        }

        return Inertia::render('Submissions/ForDivision', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'statusFilter' => $statusFilter,
            'availablePrefixes' => $availablePrefixes,
        ]);
    }

    /** ================================
     *  PENGAJUAN KELUAR (Outgoing)
     *  ================================
     *  Pengajuan yang dibuat oleh user atau
     *  Pengajuan dari divisi yang sama dengan can_view permission
     *  ================================ */
    public function outgoing(Request $request)
    {
        $user = Auth::user();
        $divisionId = $user->division_id;
        $subdivisionId = $user->subdivision_id;
        $statusFilter = $request->get('status', 'all');
        $search = $request->get('search');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $prefixFilter = $request->get('prefix');
        $doctypeFilter = $request->get('doctype');
        $divisionFilter = $request->get('division');

        // ========================================================
        // PENGAJUAN KELUAR: Submission dibuat user atau divisi yang sama
        // ========================================================
        // Kriteria:
        // 1. Status: active/waiting
        // 2. Dibuat oleh user sendiri (user_id = auth user) ATAU
        // 3. Dibuat oleh user divisi yang sama + user punya can_view permission
        // 
        // CATATAN: Jika pembuat submission memiliki action permission di step saat ini,
        // submission akan tampil di KEDUA tempat (Pengajuan Masuk & Pengajuan Keluar)
        // ========================================================

        // Check if user has can_view permission
        $canView = $subdivisionId
            ? $this->permissionService->hasPermission($subdivisionId, 'can_view')
            : false;

        $query = $this->queryService->baseQuery()
            ->active()  // Only non-approved/non-rejected (waiting status)
            ->where(function ($q) use ($user, $divisionId, $canView) {
                // Pengajuan dibuat oleh user sendiri - SELALU tampilkan
                $q->where('user_id', $user->id);
                
                // ATAU pengajuan dari divisi yang sama dengan can_view permission
                if ($canView) {
                    $q->orWhere(function ($or) use ($divisionId, $user) {
                        $or->where('division_id', $divisionId)
                           ->where('user_id', '!=', $user->id)  // Bukan pembuat
                           ->whereNotNull('workflow_id');
                    });
                }
            })
            // EXCLUDE jika: bukan pembuat AND terlibat di step saat ini
            ->where(function ($q) use ($user, $divisionId) {
                $q->where('user_id', $user->id)  // Pembuat SELALU muncul di outgoing
                  ->orWhereDoesntHave('workflow.steps', function ($subQ) use ($divisionId) {
                      // Bukan pembuat: exclude jika terlibat di step saat ini
                      $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                           ->where('workflow_steps.division_id', $divisionId);
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
            ]);

        // Apply filters
        if ($search) {
            $query->where('submissions.title', 'like', '%' . $search . '%');
        }
        
        if ($startDate) {
            $query->whereDate('submissions.created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('submissions.created_at', '<=', $endDate);
        }

        // Apply prefix filter if selected
        if ($prefixFilter) {
            $query->where('submissions.series_code', 'like', $prefixFilter . '%');
        }

        // Apply doctype filter if selected
        if ($doctypeFilter) {
            $query->whereHas('workflow.document', function ($q) use ($doctypeFilter) {
                $q->where('documents.id', $doctypeFilter);
            });
        }

        // Apply division filter if selected
        if ($divisionFilter) {
            $query->where('submissions.division_id', $divisionFilter);
        }

        $submissions = $query->latest()->paginate(10);

        // Get all registered prefixes from DocumentNameSeries
        $availablePrefixes = DocumentNameSeries::whereNotNull('prefix')
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->with('document:id,name')
            ->get()
            ->map(function ($series) {
                return [
                    'prefix' => $series->prefix,
                    'document_name' => $series->document->name,
                ];
            })
            ->sortBy('prefix')
            ->values();

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

        return Inertia::render('Submissions/Outgoing', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'statusFilter' => $statusFilter,
            'availablePrefixes' => $availablePrefixes,
        ]);
    }

    /** ------------------------
     *  FORM BUAT PENGAJUAN
     *  ------------------------ */
    public function create()
    {
        try {
            $user = Auth::user();
            
            $division = $user->division;

            $workflows = Workflow::where('is_active', true)
                ->whereHas('document', function ($q) {
                    $q->where('is_active', true);
                })
                ->where(function($query) use ($user) {
                    // Include workflows with all_division=true (global workflows)
                    $query->where('all_division', true);
                    
                    // OR filter berdasarkan divisi user WAJIB
                    $query->orWhere(function($subQuery) use ($user) {
                        $subQuery->whereHas('divisions', function($q) use ($user) {
                            $q->where('division_id', $user->division_id);
                        });
                        
                        // Jika user memiliki subdivision, maka workflow juga harus memiliki subdivision yang cocok
                        if ($user->subdivision_id) {
                            $subQuery->whereHas('subdivisions', function($q) use ($user) {
                                $q->where('subdivision_id', $user->subdivision_id);
                            });
                        } else {
                            // Jika user tidak memiliki subdivision, pastikan workflow tidak memiliki subdivision restriction
                            // atau workflow memiliki subdivision yang null/empty (berlaku untuk semua subdivisi di divisi tersebut)
                            $subQuery->whereDoesntHave('subdivisions')
                                      ->orWhereHas('subdivisions', function($q) {
                                          $q->whereNull('subdivision_id'); // Workflow yang berlaku untuk semua subdivisi
                                      });
                        }
                    });
                })
                ->with(['steps', 'steps.division', 'document.fields', 'document' => function($query) {
                    $query->select('id', 'name', 'description', 'is_active', 'default_columns', 'enable_data_tables');
                }])
                ->get();

            return Inertia::render('Submissions/Create', [
                'userDivision' => $division,
                'workflows' => $workflows,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in SubmissionController::create', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace()
            ]);
            throw $e;
        }
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
     * Pastikan submission memiliki short code untuk URL verifikasi yang aman.
     */
    protected function ensureShortCode(Submission $submission): void
    {
        $submission->ensureShortCode();
    }

    /**
     * Generate file QR untuk URL verifikasi dan simpan ke storage publik.
     */
    protected function ensureQrCode(Submission $submission): void
    {
        // Pastikan short code ada (untuk URL yang aman)
        $this->ensureShortCode($submission);

        $verifyUrl = route('verification.show', $submission->short_code);
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
        
        // Handle useTableData from FormData (checkbox not sent = false)
        if ($isFormData) {
            $useTableData = $request->input('useTableData') === 'true';
        } else {
            $useTableData = $request->boolean('useTableData', false);
        }
        
        if ($isFormData) {
            $validated = $request->validate([
                'workflow_id' => 'required|exists:workflows,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|max:10240',
                'data' => 'nullable|string', // Allow string for FormData JSON
                'useTableData' => 'sometimes|string', // Accept string from FormData
                'tableData' => 'nullable|string', // Allow string for FormData JSON
                'tableColumns' => 'nullable|string', // Allow string for FormData JSON
            ]);
            
            // Convert JSON string to array for FormData requests
            $dataPayload = [];
            if (!empty($validated['data'])) {
                $dataPayload = json_decode($validated['data'], true) ?? [];
            }
            
            // Add tableData to dataPayload if exists
            if (!empty($validated['tableData'])) {
                $dataPayload['tableData'] = json_decode($validated['tableData'], true) ?? [];
            }
            
            // Add tableColumns to dataPayload if exists
            if (!empty($validated['tableColumns'])) {
                $dataPayload['tableColumns'] = json_decode($validated['tableColumns'], true) ?? [];
            }
        } else {
            $validated = $request->validate([
                'workflow_id' => 'required|exists:workflows,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'nullable|file|max:10240',
                'data' => 'nullable|array',
                'useTableData' => 'sometimes|boolean',
            ]);
            
            $dataPayload = $validated['data'] ?? [];
        }


        $user = Auth::user();

        $workflow = Workflow::with(['steps', 'steps.division', 'document.fields', 'document' => function($query) {
                    $query->select('id', 'name', 'description', 'is_active', 'default_columns', 'enable_data_tables');
                }])
            ->where('id', $validated['workflow_id'])
            ->where('is_active', true)
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->firstOrFail();

        $steps = $workflow->steps->sortBy('step_order')->values();

        // Validate required dynamic fields from Document Type
        $docFields = $workflow->document?->fields ?? collect();
        
        // Check if data tables is mandatory for this document type
        if ($workflow->document && $workflow->document->enable_data_tables) {
            $tableData = $dataPayload['tableData'] ?? [];
            
            // Check if useTableData is checked
            if (!$useTableData) {
                // For Inertia requests, use proper validation error
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'useTableData' => 'Document Type ini wajib menggunakan Data Tables. Centang "Gunakan Data Table" dan isi data yang diperlukan.'
                ]);
            }
            
            // Check if table data is provided and not empty
            if (empty($tableData) || !is_array($tableData)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'tableData' => 'Data Tables wajib diisi. Tambahkan minimal satu baris data.'
                ]);
            }
            
            // Validate required columns in table data
            $tableColumns = $dataPayload['tableColumns'] ?? [];
            $requiredColumns = collect($tableColumns)->filter(function ($col) {
                return isset($col['required']) && $col['required'] === true;
            });
            
            foreach ($requiredColumns as $column) {
                $columnKey = $column['key'] ?? $column['name'];
                $columnName = $column['name'] ?? $columnKey;
                
                $hasValidData = false;
                foreach ($tableData as $rowIndex => $row) {
                    $value = $row[$columnKey] ?? null;
                    if ($value !== null && $value !== '') {
                        $hasValidData = true;
                        break;
                    }
                }
                
                if (!$hasValidData) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "tableData.{$columnKey}" => "Kolom wajib '{$columnName}' harus diisi pada minimal satu baris data."
                    ]);
                }
            }
        }
        
        // Skip validation if no fields are defined for this document type
        if ($docFields->isNotEmpty()) {
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
        }

        // Create submission
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
                'redirect_url' => route('submissions.outgoing')
            ]);
        }

        return redirect()->route('submissions.outgoing.jsx')->with('success', 'Pengajuan berhasil dibuat.');
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
            'workflowSteps.approver',
            'stamped',
        ]);

        $user = Auth::user();

        // Check if submission has been stamped
        $hasStamped = $submission->stamped !== null;

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

            // User bisa approve jika admin atau punya permission
            $hasPermission = $user->role === 'admin' || ($permission && ($permission->can_approve || $permission->can_reject || $permission->can_request_next));
            
            // Jika user tidak punya subdivision_id, berikan permission default
            if (!$user->subdivision_id && $user->role !== 'admin') {
                $hasPermission = true; // User tanpa subdivision diizinkan untuk aksi basic
            }

            if ($hasPermission) {
                // User bisa approve jika punya permission global
                $canApprove = $user->role === 'admin' ? true : ($permission ? ($permission->can_approve || $permission->can_reject || $permission->can_request_next) : true);

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
                    
                    // Jika user tidak punya subdivision_id, izinkan semua actions
                    if (!$user->subdivision_id) return true;
                    
                    if (str_contains($a, 'approve')) return (bool) $permission->can_approve;
                    if (str_contains($a, 'reject')) return (bool) $permission->can_reject;
                    if (str_contains($a, 'reviewed')) return (bool) $permission->can_request_next;
                    return true; // actions lain dibiarkan
                }));
            }
        }

        return Inertia::render('Submissions/Show', [
            'submission' => $submission,
            'fileUrl' => $submission->file_path ? request()->getSchemeAndHttpHost() . route('submissions.file', $submission, false) : null,
            'canApprove' => $canApprove,
            'currentSubmissionStep' => $currentSubmissionStep,
            'workflow' => $submission->workflow,
            'steps' => $submission->workflow->steps->sortBy('step_order')->values(),
            'currentStep' => $currentWorkflowStep,
            'actions' => $filteredActions ?? [],
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
        
        // Update print timestamp
        $submission->printed_at = now();
        $submission->save();
        
        $submission->load(['user.division', 'workflow.document.fields', 'workflowSteps.approver', 'workflowSteps.division']);

        // Pastikan series_code sudah ada ketika dokumen dicetak
        $this->generateSeriesCode($submission);
        // Pastikan QR tersedia sebelum render
        if (!$submission->qr_code_path) {
            $this->ensureQrCode($submission);
        }
        // Pastikan short code tersedia untuk generate QR inline
        $this->ensureShortCode($submission);
        $verifyUrl = route('verification.show', $submission->short_code);
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
                        'approved_at' => (string) $step->approved_at,
                        'action_type' => $step->action_type ?? 'approve'
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
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

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

        // Apply date filters
        if ($startDate) {
            $query->whereDate('submissions.created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('submissions.created_at', '<=', $endDate);
        }

        $submissions = $query->paginate(10);

        foreach ($submissions as $s) {
            $myStep = $s->workflowSteps
                ->where('approver_id', $user->id)
                ->sortByDesc(function ($ws) {
                    return $ws->approved_at ?: $ws->updated_at;
                })
                ->first();
            
            // Tambahkan action_description berdasarkan action_type
            if ($myStep) {
                $actionType = $myStep->action_type ?? 'approve';
                
                // Map action_type ke deskripsi yang user-friendly
                $actionDescriptions = [
                    'approve' => 'approve',
                    'reviewed' => 'reviewed',
                    'request_next' => 'reviewed',  // request_next adalah reviewed
                    'reject' => 'reject',
                ];
                
                $myStep->action_description = $actionDescriptions[$actionType] ?? $actionType;
            }
            
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
        $filename = basename($submission->file_path);
        
        // Determine MIME type secara lebih reliable
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $path);
        finfo_close($finfo);
        
        // Fallback ke extension-based detection jika finfo gagal
        if (!$mimeType) {
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            switch ($ext) {
                case 'jpg':
                case 'jpeg':
                    $mimeType = 'image/jpeg';
                    break;
                case 'png':
                    $mimeType = 'image/png';
                    break;
                case 'gif':
                    $mimeType = 'image/gif';
                    break;
                case 'bmp':
                    $mimeType = 'image/bmp';
                    break;
                case 'webp':
                    $mimeType = 'image/webp';
                    break;
                case 'pdf':
                    $mimeType = 'application/pdf';
                    break;
                default:
                    $mimeType = 'application/octet-stream';
                    break;
            }
        }

        // Dynamic headers based on file type
        $isImage = strpos($mimeType, 'image/') === 0;
        $isPdf = $mimeType === 'application/pdf';
        
        if ($isImage) {
            // Image headers - allow inline viewing for iOS Safari compatibility
            $headers = [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
                'Content-Length' => filesize($path),
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'public, must-revalidate, max-age=0',
                'Pragma' => 'public',
                'Expires' => '0',
                // Add CORS headers for iOS Safari
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type',
            ];
        } elseif ($isPdf) {
            // PDF headers - view in browser
            $headers = [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
                'Content-Length' => filesize($path),
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'public, must-revalidate, max-age=0',
                'Pragma' => 'public',
                'Expires' => '0',
            ];
        } else {
            // Binary files - force download
            $headers = [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Content-Length' => filesize($path),
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'public, must-revalidate, max-age=0',
                'Pragma' => 'public',
                'Expires' => '0',
            ];
        }

        return response()->file($path, $headers);
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
        $currentStep->action_type = 'approve';
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
                        'approved_at' => (string) $step->approved_at,
                        'action_type' => $step->action_type ?? 'approve'
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
    $currentSubmissionStep->action_type = 'request_next';
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
    $currentStep->action_type = 'reject';
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
        'approved_at' => now()->toDateTimeString(),
        'action_type' => 'reject'
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
    
    // If useTableData is false, remove table data from payload
    if (isset($dataPayload['useTableData']) && !$dataPayload['useTableData']) {
        unset($dataPayload['tableData']);
        unset($dataPayload['tableColumns']);
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
            'redirect_url' => route('submissions.show', $submission->id)
        ]);
    }

    return redirect()->route('submissions.show', $submission->id)->with('success', 'Pengajuan berhasil diperbarui.');
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

/** ------------------------
 *  CANCEL PENGAJUAN
 *  ------------------------ */
public function cancel(Request $request, Submission $submission)
{
    // Check if user can cancel this submission
    if (!$submission->canBeCancelledBy(Auth::user())) {
        $message = 'Anda tidak dapat membatalkan pengajuan ini.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => false,
                'message' => $message
            ], 403);
        }
        
        return back()->with('error', $message);
    }

    $validated = $request->validate([
        'cancel_reason' => 'required|string|max:1000'
    ], [
        'cancel_reason.required' => 'Alasan pembatalan wajib diisi.'
    ]);

    try {
        DB::beginTransaction();
        
        $submission->cancel($validated['cancel_reason'], Auth::user());
        
        DB::commit();

        $message = 'Pengajuan berhasil dibatalkan.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => $message,
                'redirect_url' => route('submissions.show', $submission->id)
            ]);
        }

        return redirect()->route('submissions.show', $submission->id)->with('success', $message);
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error cancelling submission: ' . $e->getMessage());
        
        $message = 'Terjadi kesalahan saat membatalkan pengajuan.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => false,
                'message' => $message
            ], 500);
        }

        return back()->with('error', $message);
    }
}

/** ------------------------
 *  AMMEND PENGAJUAN
 *  ------------------------ */
public function amend(Request $request, Submission $submission)
{
    // Check if user can amend this submission
    if (!$submission->canBeAmendedBy(Auth::user())) {
        $message = 'Anda tidak dapat merevisi pengajuan ini.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => false,
                'message' => $message
            ], 403);
        }
        
        return back()->with('error', $message);
    }

    $validated = $request->validate([
        'amend_reason' => 'required|string|max:1000'
    ], [
        'amend_reason.required' => 'Alasan revisi wajib diisi.'
    ]);

    try {
        DB::beginTransaction();
        
        $amendedSubmission = $submission->createAmendedSubmission($validated['amend_reason'], Auth::user());
        
        DB::commit();

        $message = 'Pengajuan revisi berhasil dibuat.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => true,
                'message' => $message,
                'redirect_url' => route('submissions.edit', $amendedSubmission->id)
            ]);
        }

        return redirect()->route('submissions.edit', $amendedSubmission->id)->with('success', $message);
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error amending submission: ' . $e->getMessage());
        
        $message = 'Terjadi kesalahan saat membuat pengajuan revisi.';
        
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            return response()->json([
                'success' => false,
                'message' => $message
            ], 500);
        }

        return back()->with('error', $message);
    }
}
}