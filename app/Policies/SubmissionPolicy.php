<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;
use App\Models\SubmissionWorkflowStep;

class SubmissionPolicy
{
    public function view(User $user, Submission $submission): bool
    {
        // Pemilik, admin, atau divisi yang terlibat boleh melihat
        return
            $user->id === $submission->user_id ||
            in_array($user->role, ['manager', 'admin']) ||
            SubmissionWorkflowStep::where('submission_id', $submission->id)
                ->where('division_id', $user->division_id)
                ->exists();
    }

    public function create(User $user): bool
    {
        // Semua employee dan admin boleh membuat pengajuan
        return in_array($user->role, ['employee', 'admin']);
    }

    public function approve(User $user, Submission $submission): bool
    {
        // Cek apakah user berasal dari divisi pada step aktif
        $currentStep = SubmissionWorkflowStep::where('submission_id', $submission->id)
            ->where('step_order', $submission->current_step)
            ->first();

        return $currentStep && $currentStep->division_id === $user->division_id;
    }

    public function reject(User $user, Submission $submission): bool
    {
        // Sama dengan approve
        return $this->approve($user, $submission);
    }

    public function requestToNextStep(User $user, Submission $submission): bool
    {
        // Izin untuk "request to next step"
        $currentStep = SubmissionWorkflowStep::where('submission_id', $submission->id)
            ->where('step_order', $submission->current_step)
            ->first();

        return $currentStep && $currentStep->division_id === $user->division_id;
    }
}
