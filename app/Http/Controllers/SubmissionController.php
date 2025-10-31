<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\Workflow;
use App\Models\WorkflowStepPermission;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    /** ------------------------
     *  LIST PENGAJUAN USER SENDIRI
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
            'userSubdivision' => $user->subdivision ?? null,
        ]);
    }

    /** ------------------------
     *  LIST PENGAJUAN UNTUK DIVISI LOGIN
     *  ------------------------ */
    public function forDivision(Request $request)
    {
        $user = Auth::user();
        $divisionId = $user->division_id;
        $subdivisionId = $user->subdivision_id ?? null;
        $statusFilter = $request->get('status', 'all');

        $submissions = Submission::with([
                'user.division',
                'workflow.document',
                'workflow.steps.division',
                'workflowSteps.division'
            ])
            ->whereHas('workflowSteps', function ($query) use ($divisionId, $subdivisionId) {
                $query->where('division_id', $divisionId);

                if ($subdivisionId) {
                    $query->where('subdivision_id', $subdivisionId);
                }
            })
            ->when($statusFilter !== 'all', function ($query) use ($statusFilter) {
                $query->where('status', $statusFilter);
            })
            ->latest()
            ->paginate(10);

        return Inertia::render('Submissions/ForDivision', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
            'userSubdivision' => $user->subdivision ?? null,
            'statusFilter' => $statusFilter,
        ]);
    }

    /** ------------------------
     *  FORM BUAT PENGAJUAN
     *  ------------------------ */
    public function create()
    {
        $user = Auth::user();

        $documents = Document::whereHas('workflows', fn($q) => $q->where('is_active', true))
            ->get()
            ->filter(fn($doc) => $user->can('create', $doc));

        return Inertia::render('Submissions/Create', [
            'userDivision' => $user->division,
            'userSubdivision' => $user->subdivision ?? null,
            'documents' => $documents,
        ]);
    }

    /** ------------------------
     *  SIMPAN PENGAJUAN BARU
     *  ------------------------ */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10240',
        ]);

        $user = Auth::user();
        $document = Document::findOrFail($validated['document_id']);
        $this->authorize('create', $document);

        $workflow = Workflow::where('document_id', $document->id)
            ->where('is_active', true)
            ->with('steps')
            ->first();

        if (!$workflow) {
            return back()->withErrors(['workflow' => 'Belum ada workflow yang diatur untuk jenis dokumen ini.']);
        }

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
                'subdivision_id' => $user->subdivision_id ?? null,
                'step_order' => $step->step_order,
                'status' => 'pending', // tidak langsung approved
                'actions' => $step->actions,
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
        ]);

        $steps = $submission->workflowSteps()->orderBy('step_order')->get();
        $currentStep = $steps->firstWhere('step_order', $submission->current_step);

        if ($currentStep) {
            $workflowStep = $submission->workflow->steps->firstWhere('step_order', $submission->current_step);
            $currentStep->actions = json_decode($workflowStep->actions ?? '[]', true);
        }

        return Inertia::render('Submissions/Show', [
            'submission' => $submission,
            'workflowSteps' => $steps,
            'currentStep' => $currentStep,
            'canApprove' => Auth::user()->can('approve', $submission),
            'canReject' => Auth::user()->can('reject', $submission),
            'fileUrl' => route('submissions.file', $submission->id),
            'fileExists' => Storage::disk('private')->exists($submission->file_path),
        ]);
    }

    /** ------------------------
     *  APPROVE PENGAJUAN
     *  ------------------------ */
    public function approve(Submission $submission)
    {
        $this->authorize('approve', $submission);

        $currentStep = $submission->workflowSteps()->firstWhere('step_order', $submission->current_step);

        // Cek permission subdivisi
        $canApprove = WorkflowStepPermission::where('workflow_step_id', $currentStep->id)
            ->where('division_id', Auth::user()->division_id)
            ->when(Auth::user()->subdivision_id, function ($q) {
                $q->where('subdivision_id', Auth::user()->subdivision_id);
            })
            ->where('can_approve', true)
            ->exists();

        if (!$canApprove) {
            abort(403, 'Anda tidak memiliki izin untuk menyetujui langkah ini.');
        }

        $currentStep->update(['status' => 'approved']);

        $maxStepOrder = $submission->workflowSteps()->max('step_order');
        $submission->current_step = $submission->current_step >= $maxStepOrder
            ? $submission->current_step
            : $submission->current_step + 1;

        $submission->status = $submission->current_step > $maxStepOrder ? 'approved' : 'pending';
        $submission->save();

        return redirect()->back()->with('success', 'Dokumen berhasil disetujui.');
    }

    /** ------------------------
     *  REJECT PENGAJUAN
     *  ------------------------ */
    public function reject(Submission $submission)
    {
        $this->authorize('reject', $submission);

        $currentStep = $submission->workflowSteps()->firstWhere('step_order', $submission->current_step);

        $canReject = WorkflowStepPermission::where('workflow_step_id', $currentStep->id)
            ->where('division_id', Auth::user()->division_id)
            ->when(Auth::user()->subdivision_id, function ($q) {
                $q->where('subdivision_id', Auth::user()->subdivision_id);
            })
            ->where('can_reject', true)
            ->exists();

        if (!$canReject) {
            abort(403, 'Anda tidak memiliki izin untuk menolak langkah ini.');
        }

        $currentStep->update(['status' => 'rejected']);
        $submission->update(['status' => 'rejected']);

        return redirect()->back()->with('success', 'Dokumen telah ditolak.');
    }

    /** ------------------------
     *  VIEW FILE SUBMISSION
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
}
