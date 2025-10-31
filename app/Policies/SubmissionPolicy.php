<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\DocumentPermission;

class SubmissionPolicy
{
    /**
     * Mengecek apakah subdivisi user punya permission tertentu terhadap dokumen
     */
    protected function hasSubdivisionPermission(User $user, Submission $submission, string $permissionField): bool
    {
        if (!$user->subdivision_id) {
            return false;
        }

        $permission = DocumentPermission::where('document_id', $submission->document_id)
            ->where('subdivision_id', $user->subdivision_id)
            ->first();

        return $permission && $permission->{$permissionField};
    }

    /**
     * Cek apakah user boleh melihat submission
     */
    public function view(User $user, Submission $submission): bool
    {
        // 1️⃣ Tetap izinkan pemilik, manager, admin, atau divisi terkait step
        $basicAccess =
            $user->id === $submission->user_id ||
            in_array($user->role, ['manager', 'admin']) ||
            SubmissionWorkflowStep::where('submission_id', $submission->id)
                ->where('division_id', $user->division_id)
                ->exists();

        // 2️⃣ Tambahkan pengecekan subdivisi
        $hasPermission = $this->hasSubdivisionPermission($user, $submission, 'can_view');

        return $basicAccess && $hasPermission;
    }

    /**
     * Cek apakah user boleh membuat submission baru
     */
    public function create(User $user): bool
    {
        // Semua employee dan admin boleh buat, tapi tetap cek subdivisi kalau ada
        if (in_array($user->role, ['employee', 'admin'])) {
            // Kalau user tidak punya subdivisi, izinkan saja (fallback)
            if (!$user->subdivision_id) {
                return true;
            }

            $permission = DocumentPermission::where('subdivision_id', $user->subdivision_id)
                ->where('can_create', true)
                ->exists();

            return $permission;
        }

        return false;
    }

    /**
     * Cek apakah user boleh approve submission
     */
    public function approve(User $user, Submission $submission): bool
    {
        // 1️⃣ Cek apakah user berasal dari divisi yang sedang aktif dalam workflow
        $inCurrentStep = SubmissionWorkflowStep::where('submission_id', $submission->id)
            ->where('step_order', $submission->current_step)
            ->where('division_id', $user->division_id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'pending');
            })
            ->exists();

        // 2️⃣ Cek subdivisi-nya punya hak approve
        $hasPermission = $this->hasSubdivisionPermission($user, $submission, 'can_approve');

        return $inCurrentStep && $hasPermission;
    }

    /**
     * Cek apakah user boleh reject submission
     */
    public function reject(User $user, Submission $submission): bool
    {
        // Sama seperti approve, tapi cek permission "can_reject"
        $inCurrentStep = SubmissionWorkflowStep::where('submission_id', $submission->id)
            ->where('step_order', $submission->current_step)
            ->where('division_id', $user->division_id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'pending');
            })
            ->exists();

        $hasPermission = $this->hasSubdivisionPermission($user, $submission, 'can_reject');

        return $inCurrentStep && $hasPermission;
    }
}
