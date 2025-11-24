<?php

namespace App\Services;

use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Service untuk dashboard statistics dengan optimasi
 * Menghindari multiple queries untuk stats calculation
 */
class DashboardStatsService
{
    private PermissionCacheService $permissionService;

    public function __construct(PermissionCacheService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Hitung semua stats untuk dashboard dalam satu atau minimal query
     */
    public function getStats(User $user): array
    {
        // 1) Total pengajuan user
        $totalSubmission = Submission::selectRaw('COUNT(*) as count')
            ->where('user_id', $user->id)
            ->value('count');

        // 2) Check permission untuk approval
        $canApproveGlobal = $user->role === 'admin' ? true : ($user->subdivision_id
            ? $this->permissionService->hasPermission($user->subdivision_id, 'can_approve')
            : false);

        // 3) Waiting approval (jika bisa approve)
        $waitingApproval = 0;
        if ($canApproveGlobal) {
            $waitingApproval = Submission::where('status', 'pending')
                ->whereNotNull('workflow_id')
                ->whereHas('workflow.steps', function ($q) use ($user) {
                    $q->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                    if ($user->role !== 'admin') {
                        $q->where('workflow_steps.division_id', $user->division_id);
                    }
                })
                ->count();
        }

        // 4) Approved & Rejected by user (combined query)
        $approvalStats = SubmissionWorkflowStep::selectRaw(
                'status, COUNT(*) as count'
            )
            ->where('approver_id', $user->id)
            ->whereIn('status', ['approved', 'rejected'])
            ->groupBy('status')
            ->pluck('count', 'status');

        $approvedSubmissions = $approvalStats->get('approved', 0);
        $rejectedSubmissions = $approvalStats->get('rejected', 0);

        return [
            'total' => (int) $totalSubmission,
            'waiting' => (int) $waitingApproval,
            'approved' => (int) $approvedSubmissions,
            'rejected' => (int) $rejectedSubmissions,
        ];
    }

    /**
     * Ambil pending items untuk notification/alert
     * Minimal query dengan select yang tepat
     */
    public function getPendingItems(User $user, int $limit = 5): Collection
    {
        $canApproveGlobal = $user->role === 'admin' ? true : ($user->subdivision_id
            ? $this->permissionService->hasPermission($user->subdivision_id, 'can_approve')
            : false);

        if (!$canApproveGlobal) {
            return collect();
        }

        return Submission::select(['id', 'title', 'current_step', 'status', 'created_at', 'workflow_id'])
            ->where('status', 'pending')
            ->whereNotNull('workflow_id')
            ->whereHas('workflow.steps', function ($q) use ($user) {
                $q->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                if ($user->role !== 'admin') {
                    $q->where('workflow_steps.division_id', $user->division_id);
                }
            })
            ->latest()
            ->take($limit)
            ->get()
            ->map(function ($submission) {
                return [
                    'id' => $submission->id,
                    'title' => $submission->title,
                    'step' => $submission->current_step,
                    'created_at' => $submission->created_at,
                ];
            });
    }
}
