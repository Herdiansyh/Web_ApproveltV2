<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\Workflow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\SubmissionStatusUpdated;

class SubmissionController extends Controller
{
    use AuthorizesRequests;

    /** ------------------------
     *  PENGAJUAN DOKUMEN (DIBUAT OLEH DIVISI INI)
     *  ------------------------ */
  public function index()
{
    $user = Auth::user();

    $submissions = Submission::with(['workflow.steps.division', 'workflowSteps.division'])
        ->where('user_id', $user->id) // ubah dari division_id menjadi user_id
        ->latest()
        ->paginate(10);

    return Inertia::render('Submissions/Index', [
        'submissions' => $submissions,
        'userDivision' => $user->division,
    ]);
}


    /** ------------------------
     *  LIST PERSUTUJUAN (DOKUMEN MASUK UNTUK DIVISI INI)
     *  ------------------------ */
    public function forDivision()
    {
        $user = Auth::user();
        $divisionId = $user->division_id;

        // Ambil semua submission yang sedang berada di step di mana divisi ini sebagai penilai
        $submissions = Submission::with(['user.division', 'workflow.steps.division'])
            ->whereHas('workflowSteps', function ($query) use ($divisionId) {
                $query->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
                      ->where('submission_workflow_steps.division_id', $divisionId);
            })
            ->where('status', 'pending')
            ->latest()
            ->paginate(10);

        return Inertia::render('Submissions/ForDivision', [
            'submissions' => $submissions,
            'userDivision' => $user->division,
        ]);
    }

    /** ------------------------
     *  FORM BUAT PENGAJUAN
     *  ------------------------ */
    public function create()
    {
        $user = Auth::user();
        $division = $user->division;

        return Inertia::render('Submissions/Create', [
            'userDivision' => $division,
        ]);
    }

    /** ------------------------
     *  SIMPAN PENGAJUAN BARU
     *  ------------------------ */
    public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'file' => 'required|file|max:10240', // 10MB
    ]);

    $user = Auth::user();
    $userDivisionId = $user->division_id;

    // Cari workflow aktif untuk divisi ini
    $workflow = Workflow::where('division_from_id', $userDivisionId)
        ->where('is_active', true)
        ->with('steps')
        ->first();

    if (!$workflow) {
        return back()->withErrors([
            'workflow' => 'Belum ada workflow yang dibuat untuk divisi Anda.',
        ]);
    }

    $steps = $workflow->steps->sortBy('step_order')->values();

    // Upload file
    $filePath = $request->file('file')->store('submissions', 'private');

    // Tentukan langkah berikutnya
    $nextStepOrder = $steps->count() > 1 ? 2 : 1;

    // Buat pengajuan
    $submission = Submission::create([
        'user_id' => $user->id,
        'division_id' => $userDivisionId,
        'workflow_id' => $workflow->id,
        'title' => $validated['title'],
        'description' => $validated['description'] ?? null,
        'file_path' => $filePath,
        'status' => 'pending',
        'current_step' => $nextStepOrder,
    ]);

    // Simpan semua step workflow
    foreach ($steps as $step) {
        SubmissionWorkflowStep::create([
            'submission_id' => $submission->id,
            'division_id' => $step->division_id,
            'step_order' => $step->step_order,
            'status' => $step->step_order === 1 ? 'approved' : 'pending',
        ]);
    }

    return redirect()->route('submissions.index')->with('success', 'Pengajuan berhasil dibuat.');
}


    /** ------------------------
     *  DETAIL PENGAJUAN
     *  ------------------------ */
    /** ------------------------
 *  DETAIL PENGAJUAN
 *  ------------------------ */
public function show(Submission $submission)
{
    $this->authorize('view', $submission);

    // Pastikan semua relasi penting dimuat
    $submission->load([
        'user.division',
        'workflowSteps.division',
        'workflow.steps.division',
    ]);

    // Ambil urutan langkah-langkah
    $steps = $submission->workflowSteps()->orderBy('step_order')->get();

    $currentStep = $steps->firstWhere('step_order', $submission->current_step);
    $nextStep = $steps->firstWhere('step_order', $submission->current_step + 1);

    $user = Auth::user();

    $canApprove = $currentStep &&
        $currentStep->division_id === $user->division_id &&
        $submission->status === 'pending';

    // Pastikan format data yang dikirim ke Inertia jelas dan aman
    return Inertia::render('Submissions/Show', [
        'submission' => [
            'id' => $submission->id,
            'title' => $submission->title,
            'description' => $submission->description,
            'status' => $submission->status,
            'approval_note' => $submission->approval_note,
            'approved_by' => $submission->approved_by,
            'user' => [
                'id' => $submission->user->id,
                'name' => $submission->user->name,
                'division' => [
                    'id' => $submission->user->division->id ?? null,
                    'name' => $submission->user->division->name ?? '-',
                ],
            ],
            'approver' => $submission->approver
                ? [
                    'id' => $submission->approver->id,
                    'name' => $submission->approver->name,
                ]
                : null,
        ],
        'workflowSteps' => $steps->map(function ($step) {
            return [
                'id' => $step->id,
                'step_order' => $step->step_order,
                'division' => [
                    'id' => $step->division->id ?? null,
                    'name' => $step->division->name ?? '-',
                ],
                'status' => $step->status,
            ];
        }),
        'currentStep' => $currentStep
            ? [
                'id' => $currentStep->id,
                'step_order' => $currentStep->step_order,
                'division' => [
                    'id' => $currentStep->division->id ?? null,
                    'name' => $currentStep->division->name ?? '-',
                ],
                'status' => $currentStep->status,
            ]
            : null,
        'nextStep' => $nextStep
            ? [
                'id' => $nextStep->id,
                'step_order' => $nextStep->step_order,
                'division' => [
                    'id' => $nextStep->division->id ?? null,
                    'name' => $nextStep->division->name ?? '-',
                ],
                'status' => $nextStep->status,
            ]
            : null,
        'canApprove' => $canApprove,
        'fileUrl' => route('submissions.file', $submission->id),
        'signedFileExists' => $submission->status === 'approved' &&
            Storage::disk('private')->exists($submission->file_path),
    ]);
}



    /** ------------------------
     *  FILE VIEW
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
    }/** ------------------------
  /** ------------------------
 *  APPROVE PENGAJUAN
 *  ------------------------ */
/** ------------------------
 *  APPROVE PENGAJUAN
 *  ------------------------ */
public function approve(Request $request, Submission $submission)
{
    $this->authorize('view', $submission);
    $user = Auth::user();

    // Ambil step saat ini
    $currentStep = $submission->workflowSteps()
        ->where('step_order', $submission->current_step)
        ->first();

    if (!$currentStep || $currentStep->division_id !== $user->division_id) {
        abort(403, 'Anda tidak berhak melakukan approve pada dokumen ini.');
    }

    // Tandai step saat ini disetujui
    $currentStep->update([
        'status' => 'approved',
        'approved_by' => $user->id,
        'approved_at' => now(),
        'approval_note' => $request->input('approval_note'),
    ]);

    $maxStepOrder = $submission->workflowSteps()->max('step_order');

    if ($submission->current_step >= $maxStepOrder) {
        // Step terakhir → dokumen selesai disetujui
        $submission->update([
            'status' => 'approved',
            'waiting_for' => null,
        ]);
    } else {
        // Masih ada step berikutnya → lanjutkan ke step berikutnya
        $nextStep = $submission->workflowSteps()
            ->where('step_order', $submission->current_step + 1)
            ->first();

        $submission->update([
            'current_step' => $submission->current_step + 1,
            'division_id' => $nextStep->division_id,
            'status' => 'waiting to ' . $nextStep->division->name,
            'waiting_for' => $nextStep->division->name,
            // jangan update approved_by & approved_at di sini
        ]);
    }

    return redirect()->back()->with('success', 'Dokumen berhasil disetujui.');
}

/** ------------------------
 *  REQUEST TO NEXT STEP
 *  ------------------------ */
public function requestToNextStep(Request $request, Submission $submission)
{
    $this->authorize('view', $submission);
    $user = Auth::user();

    $currentStep = $submission->workflowSteps()
        ->where('step_order', $submission->current_step)
        ->first();

    if (!$currentStep || $currentStep->division_id !== $user->division_id) {
        abort(403, 'Anda tidak berhak melakukan request ke langkah berikutnya.');
    }

    $nextStep = $submission->workflowSteps()
        ->where('step_order', $submission->current_step + 1)
        ->first();

    if (!$nextStep) {
        return redirect()->back()->with('error', 'Tidak ada langkah berikutnya.');
    }

    // Tandai step saat ini sudah diteruskan
    $currentStep->update([
        'status' => 'forwarded',
        'approved_by' => null,
        'approved_at' => null,
    ]);

    // Update submission agar pindah ke step berikutnya
    $submission->update([
        'current_step' => $submission->current_step + 1,
        'division_id' => $nextStep->division_id,
        'status' => 'waiting to ' . $nextStep->division->name,
        'waiting_for' => $nextStep->division->name,
        // jangan update approved_by & approved_at
    ]);

    return redirect()->back()->with('success', 'Dokumen berhasil diteruskan ke ' . $nextStep->division->name . '.');
}



/** ------------------------
 *  REJECT PENGAJUAN
 *  ------------------------ */
public function reject(Request $request, Submission $submission)
{
    $this->authorize('view', $submission);
    $user = Auth::user();

    $currentStep = $submission->workflowSteps()
        ->where('step_order', $submission->current_step)
        ->first();

    if (!$currentStep || $currentStep->division_id !== $user->division_id) {
        abort(403, 'Anda tidak berhak melakukan reject pada dokumen ini.');
    }

    $currentStep->status = 'rejected';
    $currentStep->save();

    $submission->status = 'rejected';
    $submission->waiting_for = null;
    $submission->save();

    return redirect()->back()->with('success', 'Dokumen telah ditolak.');
}


}
