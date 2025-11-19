<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Submission;
use App\Models\SubdivisionPermission;

class SubmissionPolicy
{
    /**
     * Cek apakah user boleh melihat submission
     */
    public function view(User $user, Submission $submission): bool
    {
        // Pemilik selalu boleh
        if ($user->id === $submission->user_id) return true;
        // Admin bypass (tetap dipertahankan)
        if ($user->role === 'admin') return true;

        // Guard: butuh subdivision
        if (!$user->subdivision_id) return false;

        // Global can_view: boleh melihat semua pengajuan milik divisi yang sama
        if ($user->division_id !== $submission->division_id) return false;

        $perm = SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_view', true)
            ->exists();

        return $perm;
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
        // Admin bypass
        if ($user->role === 'admin') return true;
        if (!$user->subdivision_id || !$submission->workflow) return false;
        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();
        if (!$workflowStep) return false;
        // Harus divisi pemilik step aktif
        if ($user->division_id !== $workflowStep->division_id) return false;
        return SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_approve', true)
            ->exists();
    }

    /**
     * Cek apakah user boleh reject submission
     */
    public function reject(User $user, Submission $submission): bool
    {
        // Admin bypass
        if ($user->role === 'admin') return true;
        if (!$user->subdivision_id || !$submission->workflow) return false;
        $workflowStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();
        if (!$workflowStep) return false;
        if ($user->division_id !== $workflowStep->division_id) return false;
        return SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_reject', true)
            ->exists();
    }

    /**
     * Update allowed only for creator with can_edit on current step
     */
    public function update(User $user, Submission $submission): bool
    {
        // Owner can always edit
        if ($user->id === $submission->user_id) return true;
        // Admin bypass
        if ($user->role === 'admin') return true;

        // Require subdivision
        if (!$user->subdivision_id) return false;

        // Only users in the same division as the owner may edit
        if ($user->division_id !== $submission->division_id) return false;

        // Global can_edit
        return SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_edit', true)
            ->exists();
    }

    /**
     * Delete allowed only for creator with can_delete on current step
     */
    public function delete(User $user, Submission $submission): bool
    {
        // Owner can always delete
        if ($user->id === $submission->user_id) return true;
        // Admin bypass
        if ($user->role === 'admin') return true;

        // Require subdivision
        if (!$user->subdivision_id) return false;

        // Only users in the same division as the owner may delete
        if ($user->division_id !== $submission->division_id) return false;

        // Global can_delete
        return SubdivisionPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_delete', true)
            ->exists();
    }
}
