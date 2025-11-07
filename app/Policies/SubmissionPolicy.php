<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Submission;
use App\Models\WorkflowStepPermission;

class SubmissionPolicy
{
    /**
     * Cek apakah user boleh melihat submission
     */
    public function view(User $user, Submission $submission): bool
    {
        // pemilik, manager, admin selalu boleh
        if ($user->id === $submission->user_id) return true;
        if (in_array($user->role, ['manager', 'admin'])) return true;

        // Guard: butuh subdivision dan workflow
        if (!$user->subdivision_id || !$submission->workflow) return false;

        // Izinkan lintas divisi jika subdivision user memang diberi can_view di workflow step terkait

        // Boleh melihat jika subdivision user punya can_view pada SALAH SATU step di workflow pengajuan
        return $submission->workflow
            ->steps()
            ->whereHas('permissions', function ($q) use ($user) {
                $q->where('subdivision_id', $user->subdivision_id)
                  ->where('can_view', true);
            })
            ->exists();
    }

    /**
     * Cek apakah user boleh membuat submission baru
     */
    public function create(User $user): bool
    {
        // minimal role employee atau admin boleh buat
        return in_array($user->role, ['employee', 'admin']);
    }

    /**
     * Cek apakah user boleh approve submission
     */
    public function approve(User $user, Submission $submission): bool
    {
        if (!$user->subdivision_id) return false;

        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$workflowStep) return false;

        return WorkflowStepPermission::where('workflow_step_id', $workflowStep->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_approve', true)
            ->exists();
    }

    /**
     * Cek apakah user boleh reject submission
     */
    public function reject(User $user, Submission $submission): bool
    {
        if (!$user->subdivision_id) return false;

        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$workflowStep) return false;

        return WorkflowStepPermission::where('workflow_step_id', $workflowStep->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_reject', true)
            ->exists();
    }
}
