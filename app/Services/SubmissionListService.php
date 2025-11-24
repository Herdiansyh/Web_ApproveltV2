<?php

namespace App\Services;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Service untuk melayani submission list queries dengan optimasi
 * Menghindari N+1 queries dan eager loading yang berlebihan
 */
class SubmissionListService
{
    private SubmissionQueryService $queryService;
    private PermissionCacheService $permissionService;

    public function __construct(
        SubmissionQueryService $queryService,
        PermissionCacheService $permissionService
    ) {
        $this->queryService = $queryService;
        $this->permissionService = $permissionService;
    }

    /**
     * Ambil daftar submission yang sudah selesai (completed) untuk user
     * 
     * Untuk: Submissions/Index (history/completed submissions)
     */
    public function getCompletedSubmissionsForUser(User $user, int $perPage = 10): LengthAwarePaginator
    {
        $canViewGlobal = $user->subdivision_id
            ? $this->permissionService->hasPermission($user->subdivision_id, 'can_view')
            : false;

        $query = $this->queryService->listQuery()
            ->completed(); // scope dari model

        // Filter: hanya punya sendiri atau dari divisi yang sama dengan can_view
        if ($user->role === 'admin') {
            // Admin lihat semua completed
        } else {
            $query->where(function ($q) use ($user, $canViewGlobal) {
                $q->where('user_id', $user->id);

                if ($canViewGlobal) {
                    $q->orWhere('division_id', $user->division_id);
                }
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Ambil daftar submission untuk approval/review oleh divisi user
     * 
     * Untuk: Submissions/ForDivision (active submissions yang butuh approval)
     */
    public function getActiveSubmissionsForDivision(
        User $user,
        string $statusFilter = 'all',
        int $perPage = 10
    ): LengthAwarePaginator {
        $canViewGlobal = $user->subdivision_id
            ? $this->permissionService->hasPermission($user->subdivision_id, 'can_view')
            : false;

        $query = $this->queryService->listQuery()
            ->active(); // scope dari model: bukan approved/rejected

        // Filter: punya sendiri, atau step aktif di divisi user, atau divisi sama dengan can_view
        if ($user->role !== 'admin') {
            $query->where(function ($q) use ($user, $canViewGlobal) {
                // 1) Punya sendiri
                $q->where('user_id', $user->id)
                  // 2) Step aktif di divisi user dengan workflow
                  ->orWhere(function ($subQ) use ($user) {
                      $subQ->whereNotNull('workflow_id')
                           ->whereHas('workflow.steps', function ($stepQ) use ($user) {
                               $stepQ->where('workflow_steps.division_id', $user->division_id)
                                     ->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                           });
                  })
                  // 3) Divisi sama dengan can_view
                  ->when($canViewGlobal, function ($whenQ) use ($user) {
                      $whenQ->orWhere(function ($divisionQ) use ($user) {
                          $divisionQ->where('division_id', $user->division_id)
                                    ->whereNotNull('workflow_id');
                      });
                  });
            });
        }

        // Status filter
        if ($statusFilter === 'pending') {
            $query->where('status', 'pending');
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Ambil submission detail dengan semua relasi yang diperlukan
     */
    public function getSubmissionDetail(int $submissionId): ?Submission
    {
        return $this->queryService->detailQuery()
            ->find($submissionId);
    }

    /**
     * Ambil submission untuk edit
     */
    public function getSubmissionForEdit(int $submissionId): ?Submission
    {
        return $this->queryService->baseQuery()
            ->with([
                'workflow' => function ($q) {
                    $q->select(['id', 'name', 'document_id', 'total_steps', 'flow_definition']);
                },
                'workflow.steps' => function ($q) {
                    $q->select(['id', 'workflow_id', 'step_order', 'name', 'division_id'])
                      ->orderBy('step_order');
                },
                'workflow.document' => function ($q) {
                    $q->select(['id', 'name', 'type']);
                },
                'files' => function ($q) {
                    $q->select(['id', 'submission_id', 'file_name', 'file_path']);
                },
            ])
            ->find($submissionId);
    }

    /**
     * Format submission untuk response Inertia (jangan kirim data yang tidak perlu)
     * 
     * Ini mengurangi payload yang dikirim ke frontend
     */
    public function formatForInertia(Submission $submission, bool $includeDetails = false): array
    {
        $data = [
            'id' => $submission->id,
            'title' => $submission->title,
            'status' => $submission->status,
            'created_at' => $submission->created_at,
            'user' => [
                'id' => $submission->user->id,
                'name' => $submission->user->name,
            ],
        ];

        if ($includeDetails) {
            $data['description'] = $submission->description;
            $data['current_step'] = $submission->current_step;
            $data['workflow'] = $submission->workflow ? [
                'id' => $submission->workflow->id,
                'name' => $submission->workflow->name,
                'total_steps' => $submission->workflow->total_steps,
            ] : null;
            $data['approved_at'] = $submission->approved_at;
        }

        return $data;
    }
}
