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

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    /** ------------------------
     *  LIST PENGAJUAN OLEH USER
     *  ------------------------ */
    public function index()
    {
        $user = Auth::user();

        $submissions = Submission::with([
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps.division'
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(10);

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

        $submissions = Submission::with([
                'user.division',
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps'
            ])
            ->whereHas('workflowSteps', function ($query) use ($divisionId) {
                $query->where('division_id', $divisionId);
            })
            ->when($statusFilter === 'pending', function ($query) {
                $query->where('status', 'pending');
            })
            ->latest()
            ->paginate(10);

        // Attach permission info per submission for current user's subdivision
        if ($subdivisionId) {
            foreach ($submissions as $s) {
                $wfStep = $s->workflow->steps
                    ->where('step_order', $s->current_step)
                    ->first();

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
            ->with('document')
            ->get();

        return Inertia::render('Submissions/Create', [
            'userDivision' => $division,
            'workflows' => $workflows,
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
        ]);

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
            'workflowSteps.division',
            'workflow.steps.division',
            'workflow.steps.permissions.subdivision', // 🔥 Load permissions juga
        ]);

        $user = Auth::user();

        // 🔥 PERBAIKAN: Ambil WorkflowStep asli (bukan SubmissionWorkflowStep)
        $currentWorkflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        // Ambil submission workflow step untuk tracking status
        $currentSubmissionStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        $canApprove = false;
        $filteredActions = [];

        // 🔥 Hanya izinkan aksi bila step saat ini masih pending
        $isCurrentStepPending = $currentSubmissionStep && $currentSubmissionStep->status === 'pending';

        // 🔥 Cek permission berdasarkan subdivision user
        if ($currentWorkflowStep && $isCurrentStepPending) {
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
        $fileExists = Storage::disk('private')->exists($submission->file_path);

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

        $currentStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

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

        $currentWorkflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        $currentSubmissionStep = $submission->workflowSteps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$currentWorkflowStep || !$currentSubmissionStep) {
            abort(404, 'Langkah tidak ditemukan.');
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
}