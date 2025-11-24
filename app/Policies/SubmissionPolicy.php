<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Submission;
use App\Services\PermissionCacheService;

class SubmissionPolicy
{
    // ⚠️ OPTIMASI: Gunakan permission cache service untuk menghindari repeated queries
    private PermissionCacheService $permissionService;

    public function __construct(PermissionCacheService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Cek apakah user boleh melihat submission
     * 
     * Logika:
     * 1. Pemilik selalu boleh lihat
     * 2. Admin boleh lihat semua
     * 3. User lain boleh lihat jika:
     *    - Dia adalah approver di step aktif dengan permission, ATAU
     *    - Dia di divisi yang sama dengan pembuat dan punya can_view permission
     */
    public function view(User $user, Submission $submission): bool
    {
        // Pemilik selalu boleh
        if ($user->id === $submission->user_id) {
            return true;
        }

        // Admin bypass
        if ($user->role === 'admin') {
            return true;
        }

        // Guard: butuh subdivision untuk non-admin
        if (!$user->subdivision_id) {
            return false;
        }

        // Kasus 1: User adalah approver di step saat ini dengan izin aksi
        if ($submission->workflow_id) {
            $currentStep = $submission->workflow?->steps
                ?->where('step_order', $submission->current_step)
                ->first();

            if ($currentStep && $currentStep->division_id === $user->division_id) {
                // Check permission dengan cache (menghindari query berulang)
                $perms = $this->permissionService->getMultiplePermissions(
                    $user->subdivision_id,
                    ['can_approve', 'can_reject', 'can_request_next']
                );

                if (in_array(true, $perms)) {
                    return true;
                }
            }

            // Kasus 1b: User PERNAH terlibat (approve/reject) di salah satu langkah submission ini
            // Beri akses VIEW saja meskipun bukan step aktif / berbeda divisi
            if ($submission->workflowSteps()
                ->where('approver_id', $user->id)
                ->exists()) {
                return true;
            }
        }

        // Kasus 2: User di divisi yang sama dengan pembuat dan punya can_view
        if ($user->division_id === $submission->division_id) {
            return $this->permissionService->hasPermission($user->subdivision_id, 'can_view');
        }

        return false;
    }

    /**
     * Cek apakah user boleh membuat submission baru
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['employee', 'admin']);
    }

    /**
     * Cek apakah user boleh approve submission
     * Hanya di step workflow yang sesuai dengan divisi user
     */
    public function approve(User $user, Submission $submission): bool
    {
        // Admin bypass
        if ($user->role === 'admin') {
            return true;
        }

        // Guard
        if (!$user->subdivision_id || !$submission->workflow_id) {
            return false;
        }

        // Harus divisi pemilik step aktif
        $currentStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$currentStep || $currentStep->division_id !== $user->division_id) {
            return false;
        }

        // Cache: check permission dengan caching
        return $this->permissionService->hasPermission($user->subdivision_id, 'can_approve');
    }

    /**
     * Cek apakah user boleh reject submission
     */
    public function reject(User $user, Submission $submission): bool
    {
        // Admin bypass
        if ($user->role === 'admin') {
            return true;
        }

        // Guard
        if (!$user->subdivision_id || !$submission->workflow_id) {
            return false;
        }

        // Harus divisi pemilik step aktif
        $currentStep = $submission->workflow->steps
            ->where('step_order', $submission->current_step)
            ->first();

        if (!$currentStep || $currentStep->division_id !== $user->division_id) {
            return false;
        }

        // Cache: check permission dengan caching
        return $this->permissionService->hasPermission($user->subdivision_id, 'can_reject');
    }

    /**
     * Update hanya untuk pemilik, atau admin, atau di divisi yang sama dengan punya can_edit
     */
    public function update(User $user, Submission $submission): bool
    {
        // Tidak boleh edit jika sudah disetujui/ditolak
        $status = strtolower((string) $submission->status);
        if (str_contains($status, 'approved') || str_contains($status, 'rejected')) {
            return false;
        }

        // Pemilik boleh edit
        if ($user->id === $submission->user_id) {
            return true;
        }

        // Admin boleh edit (non-final)
        if ($user->role === 'admin') {
            return true;
        }

        // Guard
        if (!$user->subdivision_id) {
            return false;
        }

        // Hanya user di divisi yang sama dengan pemilik
        if ($user->division_id !== $submission->division_id) {
            return false;
        }

        // Check permission dengan caching
        return $this->permissionService->hasPermission($user->subdivision_id, 'can_edit');
    }

    /**
     * Delete hanya untuk pemilik, atau admin, atau di divisi yang sama dengan punya can_delete
     */
    public function delete(User $user, Submission $submission): bool
    {
        // Tidak boleh delete jika sudah final
        $status = strtolower((string) $submission->status);
        if (str_contains($status, 'approved') || str_contains($status, 'rejected')) {
            return false;
        }

        // Pemilik boleh delete
        if ($user->id === $submission->user_id) {
            return true;
        }

        // Admin boleh delete (non-final)
        if ($user->role === 'admin') {
            return true;
        }

        // Guard
        if (!$user->subdivision_id) {
            return false;
        }

        // Hanya user di divisi yang sama dengan pemilik
        if ($user->division_id !== $submission->division_id) {
            return false;
        }

        // Check permission dengan caching
        return $this->permissionService->hasPermission($user->subdivision_id, 'can_delete');
    }
}
