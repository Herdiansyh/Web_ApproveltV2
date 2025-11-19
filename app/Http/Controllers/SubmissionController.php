<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\WorkflowStepPermission;
use App\Models\DocumentNameSeries;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;
use App\Jobs\StampPdfOnDecision;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    /** ------------------------
     *  LIST PENGAJUAN OLEH USER
     *  ------------------------ */
    public function index()
    {
        $user = Auth::user();
        $divisionId = $user->division_id;
        $subdivisionId = $user->subdivision_id;

        // Lihat Pengajuan (Index):
        // - Hanya pengajuan milik user sendiri
        // - ATAU pengajuan milik divisi yang sama, jika subdivision user memiliki can_view pada salah satu step workflow
        // - Tetap dibatasi pada status selesai (approved*/rejected*)
        $submissionsQuery = Submission::with([
                'user.division',
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps.division'
            ])
            ->where(function ($outer) use ($user, $divisionId, $subdivisionId) {
                $outer->where('user_id', $user->id)
                    ->orWhere(function ($or) use ($divisionId, $subdivisionId) {
                        $or->where('division_id', $divisionId)
                           ->whereNotNull('workflow_id')
                           ->when($subdivisionId, function ($qp) use ($subdivisionId) {
                               $qp->whereHas('workflow.steps.permissions', function ($qq) use ($subdivisionId) {
                                   $qq->where('subdivision_id', $subdivisionId)
                                      ->where('can_view', true);
                               });
                           });
                    })
                    // Tambahkan: tampilkan pengajuan yang step terakhirnya pernah di-approve/reject oleh user ini
                    ->orWhereExists(function ($exists) use ($user) {
                        $exists->selectRaw('1')
                            ->from('submission_workflow_steps as s1')
                            ->whereColumn('s1.submission_id', 'submissions.id')
                            ->where('s1.approver_id', $user->id)
                            ->whereIn('s1.status', ['approved', 'rejected'])
                            ->whereRaw('s1.step_order = (select max(step_order) from submission_workflow_steps s2 where s2.submission_id = submissions.id)');
                    });
            })
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) = ?', ['approved'])
                  ->orWhereRaw('LOWER(status) = ?', ['rejected'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%approved%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%']);
            })
            ->latest();

        $submissions = $submissionsQuery->paginate(10);

        // Attach permission info for the current user's subdivision (for showing edit/delete buttons)
        if ($user->subdivision_id) {
            foreach ($submissions as $s) {
                $wfStep = $s->workflow
                    ? $s->workflow->steps->where('step_order', $s->current_step)->first()
                    : null;

                // Only expose permission when same division as the submission owner
                $perm = ($wfStep && $user->division_id === $s->division_id)
                    ? WorkflowStepPermission::where('workflow_step_id', $wfStep->id)
                        ->where('subdivision_id', $user->subdivision_id)
                        ->first()
                    : null;

                $s->permission_for_me = $perm;
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

        // Lihat List Persetujuan:
        // - Pengajuan milik user
        // - Pengajuan yang diajukan kepada user (current step ada di divisi user + subdivision punya can_view)
        // - Pengajuan yang dibuat oleh siapa pun di divisi yang sama dengan user, jika subdivision user memiliki can_view pada workflow (visibility lintas pemilik dokumen)
        $submissionsQuery = Submission::with([
                'user.division',
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps'
            ])
            ->where(function ($outer) use ($user, $divisionId, $subdivisionId) {
                // (1) Pengajuan yang dibuat oleh user saat ini (termasuk template-only)
                $outer->where('user_id', $user->id)
                // (2) ATAU pengajuan yang ditujukan ke user (step saat ini milik divisi user & subdivision punya can_view)
                  ->orWhere(function ($or) use ($divisionId, $subdivisionId) {
                      $or->whereNotNull('workflow_id')
                         ->whereHas('workflow.steps', function ($q) use ($divisionId, $subdivisionId) {
                             $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                               ->where('workflow_steps.division_id', $divisionId)
                               ->when($subdivisionId, function ($qp) use ($subdivisionId) {
                                   $qp->whereHas('permissions', function ($qq) use ($subdivisionId) {
                                       $qq->where('subdivision_id', $subdivisionId)
                                          ->where('can_view', true);
                                   });
                               });
                         });
                  })
                // (3) ATAU pengajuan milik divisi yang sama dgn user, jika subdivision user memiliki can_view di salah satu step workflow
                ->orWhere(function ($or) use ($divisionId, $subdivisionId) {
                    $or->where('division_id', $divisionId)
                       ->whereNotNull('workflow_id')
                       ->when($subdivisionId, function ($qp) use ($subdivisionId) {
                           $qp->whereHas('workflow.steps.permissions', function ($qq) use ($subdivisionId) {
                               $qq->where('subdivision_id', $subdivisionId)
                                  ->where('can_view', true);
                           });
                       });
                });
            })
            // Kecualikan yang sudah selesai (approved*/rejected*) dari daftar persetujuan
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) NOT LIKE ?', ['%approved%'])
                  ->whereRaw('LOWER(status) NOT LIKE ?', ['%rejected%']);
            })
            ->when($statusFilter === 'pending', function ($query) {
                $query->where('status', 'pending');
            })
            ->latest();

        // Catatan: filter permission kini diterapkan spesifik pada step saat ini melalui whereHas di atas

        $submissions = $submissionsQuery->paginate(10);

        // Attach permission info per submission for current user's subdivision (berdasarkan step saat ini)
        if ($subdivisionId) {
            foreach ($submissions as $s) {
                $wfStep = $s->workflow
                    ? $s->workflow->steps
                        ->where('step_order', $s->current_step)
                        ->first()
                    : null;

                // Expose permission for the current step regardless of submission owner's division
                $perm = $wfStep
                    ? WorkflowStepPermission::where('workflow_step_id', $wfStep->id)
                        ->where('subdivision_id', $subdivisionId)
                        ->first()
                    : null;

                $s->current_workflow_step = $wfStep;
                $s->permission_for_me = $perm;
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
            ->with(['steps', 'document.fields'])
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
        $validated = $request->validate([
            'workflow_id' => 'required|exists:workflows,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
            'data' => 'nullable|array',
        ]);

        $user = Auth::user();

        $workflow = Workflow::with('steps', 'document.fields')
            ->where('id', $validated['workflow_id'])
            ->where('is_active', true)
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            })
            ->firstOrFail();

        $steps = $workflow->steps->sortBy('step_order')->values();

        // Validate required dynamic fields from Document Type
        $docFields = $workflow->document?->fields ?? collect();
        $dataPayload = $validated['data'] ?? [];
        foreach ($docFields as $df) {
            if ($df->required && (!array_key_exists($df->name, $dataPayload) || $dataPayload[$df->name] === null || $dataPayload[$df->name] === '')) {
                return back()->withErrors(["data.{$df->name}" => $df->label . ' wajib diisi'])->withInput();
            }
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
            'data_json' => $dataPayload ?: null,
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

        return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil dibuat.');
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
            'workflow.steps.permissions.subdivision',
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

        // 🔥 Cek permission berdasarkan subdivision user dan pembatasan divisi pemilik step
        if ($currentWorkflowStep && $isCurrentStepPending && ($user->division_id === $currentWorkflowStep->division_id)) {
            $permission = WorkflowStepPermission::where('workflow_step_id', $currentWorkflowStep->id)
                ->where('subdivision_id', $user->subdivision_id)
                ->first();

            if ($permission) {
                // User bisa approve jika punya permission can_approve, can_reject, atau can_request_next
                $canApprove = $permission->can_approve || $permission->can_reject || $permission->can_request_next;

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
                $filteredActions = array_values(array_filter($actionsArray, function ($action) use ($permission) {
                    $a = strtolower((string) $action);
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

        return Inertia::render('Submissions/Show', [
            'submission' => $submission,
            'workflowSteps' => $submission->workflowSteps()->orderBy('step_order')->get(),
            'currentStep' => $currentWorkflowStep, // 🔥 Kirim WorkflowStep (ada field actions)
            'currentSubmissionStep' => $currentSubmissionStep, // Status tracking
            'canApprove' => $canApprove,
            'fileUrl' => $fileUrl,
            'fileExists' => $fileExists,
            'documentFields' => $submission->workflow?->document?->fields ?? [],
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

        // Derive approval info (same as template preview)
        $lastApproved = $submission->workflowSteps
            ? $submission->workflowSteps->where('status', 'approved')->sortByDesc('approved_at')->first()
            : null;
        $approvedBy = $lastApproved?->approver?->name;
        $approvedAt = $lastApproved?->approved_at ? (string) $lastApproved->approved_at : null;

        $html = view('documents.print-generic', [
            'submission' => $submission,
            'fields' => $fields,
            'data' => $submission->data_json ?? [],
            'approvedBy' => $approvedBy,
            'approvedAt' => $approvedAt,
            'qrSvg' => $qrSvg,
            'verifyUrl' => $verifyUrl,
        ])->render();

        return response($html);
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

        // Load necessary relationships
        $submission->load([
            'workflow.steps.division',
            'workflowSteps.division'
        ]);

        // Guard: workflow sudah dihapus
        if (!$submission->workflow) {
            abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
        }

        $currentStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        // Batasi aksi hanya untuk divisi pemilik step saat ini
        if (!$workflowStep || $user->division_id !== $workflowStep->division_id) {
            abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
        }

        $permission = $workflowStep && $user->subdivision_id
            ? WorkflowStepPermission::where('workflow_step_id', $workflowStep->id)
                ->where('subdivision_id', $user->subdivision_id)
                ->where('can_approve', true)
                ->first()
            : null;

        if (!$currentStep || !$permission) {
            abort(403, 'Anda tidak memiliki izin untuk menyetujui pengajuan ini.');
        }

        // Prevent duplicate action
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
            // Final step approved - get current division name
            $currentDiv = $currentStep->division;
            $currentDivName = $currentDiv ? $currentDiv->name : 'Final Division';
            $submission->status = 'Approved by ' . $currentDivName;

            // Generate final series code hanya ketika dokumen sudah final approved
            $this->generateSeriesCode($submission);
        } else {
            // Move to next step and set waiting status
            $nextStepOrder = $submission->current_step + 1;
            $nextSubmissionStep = $submission->workflowSteps->where('step_order', $nextStepOrder)->first();
            $nextDiv = $nextSubmissionStep ? $nextSubmissionStep->division : null;
            $nextDivName = $nextDiv ? $nextDiv->name : 'Next Division';
            $submission->current_step = $nextStepOrder;
            $submission->status = 'Waiting to ' . $nextDivName . ' Division';
        }

        $submission->save();

        // If this approval finalizes the submission or you want to stamp on every approve, dispatch stamping
        if ($isFinal) {
            dispatch(new StampPdfOnDecision(
                $submission->id,
                'approved',
                $user->name,
                now()->toDateTimeString()
            ));
        }

        return back()->with('success', 'Dokumen berhasil disetujui.');
    }

    /** ------------------------
     *  REJECT PENGAJUAN
     *  ------------------------ */
    public function reject(Request $request, Submission $submission)
    {
        $this->authorize('reject', $submission);
        $user = Auth::user();

        // Load necessary relationships
        $submission->load([
            'workflow.steps.division',
            'workflowSteps.division'
        ]);

        // Guard: workflow sudah dihapus
        if (!$submission->workflow) {
            abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
        }

        $currentStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        $permission = $workflowStep && $user->subdivision_id
            ? WorkflowStepPermission::where('workflow_step_id', $workflowStep->id)
                ->where('subdivision_id', $user->subdivision_id)
                ->where('can_reject', true)
                ->first()
            : null;

        if (!$currentStep || !$permission) {
            abort(403, 'Anda tidak memiliki izin untuk menolak pengajuan ini.');
        }

        // Prevent duplicate action
        if ($currentStep->status !== 'pending') {
            return back()->with('info', 'Pengajuan ini sudah ' . $currentStep->status . ' pada langkah ini.');
        }

        $currentStep->status = 'rejected';
        $currentStep->approver_id = $user->id;
        $currentStep->approved_at = now();
        $currentStep->save();

        $submission->status = 'rejected';
        $submission->save();

        // Dispatch stamping for rejected status
        dispatch(new StampPdfOnDecision(
            $submission->id,
            'rejected',
            $user->name,
            now()->toDateTimeString()
        ));

        return back()->with('success', 'Dokumen telah ditolak.');
    }

    /** ------------------------
     *  REQUEST TO NEXT (tanpa approve)
     *  ------------------------ */
    public function requestNext(Request $request, Submission $submission)
    {
        $user = Auth::user();

        // Load necessary relationships
        $submission->load([
            'workflow.steps.division',
            'workflowSteps.division'
        ]);

        // Guard: workflow sudah dihapus
        if (!$submission->workflow) {
            abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
        }

        $currentWorkflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        $currentSubmissionStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$currentWorkflowStep || !$currentSubmissionStep) {
            abort(404, 'Langkah tidak ditemukan.');
        }

        // Batasi aksi hanya untuk divisi pemilik step saat ini
        if (!$currentWorkflowStep || $user->division_id !== $currentWorkflowStep->division_id) {
            abort(403, 'Aksi hanya dapat dilakukan oleh divisi pemilik langkah ini.');
        }

        // Must still be pending on this step
        if ($currentSubmissionStep->status !== 'pending') {
            return back()->with('info', 'Pengajuan ini sudah ' . $currentSubmissionStep->status . ' pada langkah ini.');
        }

        // Check permission can_request_next
        $permission = WorkflowStepPermission::where('workflow_step_id', $currentWorkflowStep->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_request_next', true)
            ->first();

        if (!$permission) {
            abort(403, 'Anda tidak memiliki izin untuk meneruskan pengajuan ini.');
        }

        // Mark this step as approved/requested
        $currentSubmissionStep->status = 'approved';
        $currentSubmissionStep->approver_id = $user->id;
        $currentSubmissionStep->approved_at = now();
        $currentSubmissionStep->save();

        // Advance or finalize
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

        return back()->with('success', 'Pengajuan diteruskan ke langkah berikutnya.');
    }

    /** ------------------------
     *  EDIT PENGAJUAN (FORM)
     *  ------------------------ */
    public function edit(Submission $submission)
{
    $this->authorize('update', $submission);

    $submission->load(['workflow.document.fields']);
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
    $this->authorize('update', $submission);

    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'file' => 'nullable|file|max:10240',
        'data' => 'nullable|array',
    ]);

    $submission->load(['workflow.document.fields']);

    $docFields = $submission->workflow?->document?->fields ?? collect();
    $dataPayload = $validated['data'] ?? ($submission->data_json ?? []);
    foreach ($docFields as $df) {
        if ($df->required && (!array_key_exists($df->name, $dataPayload) || $dataPayload[$df->name] === null || $dataPayload[$df->name] === '')) {
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

    return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil diperbarui.');
}

/** ------------------------
 *  HAPUS PENGAJUAN
 *  ------------------------ */
public function destroy(Submission $submission)
{
    $this->authorize('delete', $submission);

    // delete file
    if ($submission->file_path && Storage::disk('private')->exists($submission->file_path)) {
        Storage::disk('private')->delete($submission->file_path);
    }

    $submission->delete();

    return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil dihapus.');
}
}