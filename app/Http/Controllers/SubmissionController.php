<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\WorkflowStepPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;
use App\Jobs\StampPdfOnDecision;
use App\Jobs\GeneratePdfFromTemplate;
use App\Models\Template;

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    /** ------------------------
     *  LIST PENGAJUAN OLEH USER
     *  ------------------------ */
    public function index()
    {
        $user = Auth::user();

        $submissionsQuery = Submission::with([
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps.division'
            ])
            ->whereNotNull('workflow_id')
            ->where('user_id', $user->id)
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

        // Active templates for employees to start template-based submission
        $templates = [];
        if (method_exists($user, 'getAttribute') ? $user->getAttribute('role') === 'employee' : ($user->role ?? null) === 'employee') {
            $templates = Template::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']);
        }

        return Inertia::render('Submissions/Index', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'templates' => $templates,
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

        $submissionsQuery = Submission::with([
                'user.division',
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps'
            ])
            ->whereNotNull('workflow_id')
            // Kriteria akses:
            // (A) Step saat ini dimiliki divisi user & subdivision punya can_view pada step tersebut
            // (B) ATAU pengajuan dibuat oleh divisi user & subdivision punya can_view pada salah satu step di workflow
            ->where(function ($outer) use ($divisionId, $subdivisionId) {
                // (A)
                $outer->whereHas('workflow.steps', function ($q) use ($divisionId, $subdivisionId) {
                    $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                      ->where('workflow_steps.division_id', $divisionId)
                      ->when($subdivisionId, function ($qp) use ($subdivisionId) {
                          $qp->whereHas('permissions', function ($qq) use ($subdivisionId) {
                              $qq->where('subdivision_id', $subdivisionId)
                                 ->where('can_view', true);
                          });
                      });
                })
                // (B)
                ->orWhere(function ($or) use ($divisionId, $subdivisionId) {
                    $or->where('division_id', $divisionId)
                       ->when($subdivisionId, function ($qp) use ($subdivisionId) {
                           $qp->whereHas('workflow.steps.permissions', function ($qq) use ($subdivisionId) {
                               $qq->where('subdivision_id', $subdivisionId)
                                  ->where('can_view', true);
                           });
                       });
                });
            })
            ->when($statusFilter === 'pending', function ($query) {
                $query->where('status', 'pending');
            })
            ->latest();

        // Catatan: filter permission kini diterapkan spesifik pada step saat ini melalui whereHas di atas

        $submissions = $submissionsQuery->paginate(10);

        // Attach permission info per submission for current user's subdivision
        if ($subdivisionId) {
            foreach ($submissions as $s) {
                $wfStep = $s->workflow
                    ? $s->workflow->steps
                        ->where('step_order', $s->current_step)
                        ->first()
                    : null;

                // Only expose permission when same division as the submission owner
                $perm = ($wfStep && $user->division_id === $s->division_id)
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
            ->with('document')
            ->get();

        // Active templates (with fields) so user can create from template within the same page
        $templates = \App\Models\Template::query()
            ->where('is_active', true)
            ->with(['fields' => function ($q) {
                $q->orderBy('order');
            }])
            ->orderBy('name')
            ->get();

        return Inertia::render('Submissions/Create', [
            'userDivision' => $division,
            'workflows' => $workflows,
            'templates' => $templates,
        ]);
    }

    /** ------------------------
     *  FORM DARI TEMPLATE (USER PILIH TEMPLATE)
     *  ------------------------ */
    public function createFromTemplate(Template $template)
    {
        $this->authorize('create', Submission::class);
        $template->load('fields');
        return Inertia::render('Submissions/CreateFromTemplate', [
            'template' => $template,
        ]);
    }

    /** ------------------------
     *  PREVIEW TEMPLATE (render HTML untuk print tanpa menyimpan)
     *  ------------------------ */
    public function previewTemplate(Request $request)
    {
        $this->authorize('create', Submission::class);

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'data' => 'nullable|array',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $template = Template::findOrFail($validated['template_id']);
        if (!$template->html_view_path) {
            abort(404, 'Template view tidak ditemukan.');
        }

        // Bangun objek Submission semu untuk kebutuhan view
        $fake = new Submission();
        $fake->id = 0;
        $fake->title = $validated['title'] ?? ($template->name . ' Preview');
        $fake->description = $validated['description'] ?? null;
        $fake->created_at = now();
        $fake->setRelation('template', $template);
        $fake->setRelation('user', Auth::user());

        $html = view($template->html_view_path, [
            'submission' => $fake,
            'data' => $validated['data'] ?? [],
            'preview' => true,
        ])->render();

        return response($html);
    }

    /** ------------------------
     *  PREVIEW TEMPLATE UNTUK SUBMISSION YANG SUDAH ADA
     *  ------------------------ */
    public function previewTemplateSubmission(Submission $submission)
    {
        $this->authorize('view', $submission);

        if (!$submission->template_id) {
            abort(404, 'Submission ini tidak menggunakan template.');
        }

        $submission->load(['template', 'user', 'approvals.actor', 'workflowSteps.approver']);
        $template = $submission->template;
        if (!$template || !$template->html_view_path) {
            abort(404, 'Template view tidak ditemukan.');
        }

        // Try from approvals table (if used)
        $latestApproved = method_exists($submission, 'approvals')
            ? $submission->approvals
                ->where('action', 'approved')
                ->sortByDesc('created_at')
                ->first()
            : null;

        $approvedBy = $latestApproved?->actor?->name;
        $approvedAt = null;
        if ($latestApproved && $latestApproved->created_at) {
            try {
                $approvedAt = $latestApproved->created_at instanceof \Illuminate\Support\Carbon
                    ? $latestApproved->created_at->format('d M Y H:i')
                    : \Illuminate\Support\Carbon::parse($latestApproved->created_at)->format('d M Y H:i');
            } catch (\Throwable $e) {
                $approvedAt = (string) $latestApproved->created_at;
            }
        }

        // Fallback: derive from workflow steps (what your app actually uses)
        if (empty($approvedBy)) {
            $lastApprovedStep = $submission->workflowSteps
                ? $submission->workflowSteps
                    ->where('status', 'approved')
                    ->sortByDesc('approved_at')
                    ->first()
                : null;
            if ($lastApprovedStep) {
                $approvedBy = $lastApprovedStep->approver?->name;
                try {
                    $approvedAt = $lastApprovedStep->approved_at instanceof \Illuminate\Support\Carbon
                        ? $lastApprovedStep->approved_at->format('d M Y H:i')
                        : \Illuminate\Support\Carbon::parse($lastApprovedStep->approved_at)->format('d M Y H:i');
                } catch (\Throwable $e) {
                    $approvedAt = (string) $lastApprovedStep->approved_at;
                }
            }
        }

        $html = view($template->html_view_path, [
            'submission' => $submission,
            'data' => $submission->data_json ?? [],
            'preview' => true,
            'approvedBy' => $approvedBy,
            'approvedAt' => $approvedAt,
        ])->render();

        return response($html);
    }

    /** ------------------------
     *  SIMPAN PENGAJUAN DARI TEMPLATE
     *  ------------------------ */
    public function storeFromTemplate(Request $request)
    {
        $this->authorize('create', Submission::class);

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'data' => 'required|array',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = Auth::user();
        $template = Template::with('fields')->findOrFail($validated['template_id']);

        $title = $validated['title'] ?? ($template->name . ' - ' . (data_get($validated['data'], 'project_name') ?? now()->format('Y-m-d H:i')));

        $submission = Submission::create([
            'user_id' => $user->id,
            'division_id' => $user->division_id,
            'workflow_id' => null,
            'title' => $title,
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
            'current_step' => 0,
            'template_id' => $template->id,
            'data_json' => $validated['data'],
        ]);

        // Generate PDF asynchronously
        dispatch(new GeneratePdfFromTemplate($submission->id));

        return redirect()->route('submissions.show', $submission->id)->with('success', 'Pengajuan dari template berhasil dibuat. PDF sedang diproses.');
    }

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
            'file' => 'required|file|max:10240',
            // Template (opsional, jika user memilih template)
            'template_id' => 'nullable|exists:templates,id',
            'data' => 'nullable|array',
        ]);

        $user = Auth::user();

        $workflow = Workflow::with('steps', 'document')
            ->where('id', $validated['workflow_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $steps = $workflow->steps->sortBy('step_order')->values();

        $filePath = $request->file('file')->store('submissions', 'private');

        $submission = Submission::create([
            'user_id' => $user->id,
            'division_id' => $user->division_id,
            'workflow_id' => $workflow->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_path' => $filePath,
            'status' => 'pending',
            'current_step' => 1,
            // Template data jika ada
            'template_id' => $validated['template_id'] ?? null,
            'data_json' => $validated['data'] ?? null,
        ]);

        foreach ($steps as $step) {
            SubmissionWorkflowStep::create([
                'submission_id' => $submission->id,
                'division_id' => $step->division_id,
                'step_order' => $step->step_order,
                'status' => 'pending',
            ]);
        }

        // Jika user memilih template, jalankan pembuatan PDF async
        if (!empty($validated['template_id'])) {
            dispatch(new GeneratePdfFromTemplate($submission->id));
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
            'workflowSteps.division',
            'workflow.steps.division',
            'workflow.steps.permissions.subdivision',
        ]);

        // Jika bukan submission berbasis template dan workflow hilang → error
        if (!$submission->template_id && !$submission->workflow) {
            abort(404, 'Workflow untuk pengajuan ini sudah tidak tersedia.');
        }

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
        ]);
    }

    /** ------------------------
     *  VIEW FILE
     *  ------------------------ */
    public function file(Submission $submission)
    {
        $this->authorize('view', $submission);

        if (!Storage::disk('private')->exists($submission->file_path)) {
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

    return Inertia::render('Submissions/Edit', [
        'submission' => $submission,
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
    ]);

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