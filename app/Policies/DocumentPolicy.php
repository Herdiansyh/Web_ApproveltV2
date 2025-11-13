<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Run before any other authorization checks.
     * Allow full access for admin.
     */
    public function before(User $user, string $ability)
    {
        if (strtolower($user->role ?? '') === 'admin') {
            return true;
        }
        return null; // continue to specific checks
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Document $document): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Document $document): bool
    {
        return false;
    }

    public function delete(User $user, Document $document): bool
    {
        return false;
    }

    public function restore(User $user, Document $document): bool
    {
        return false;
    }

    public function forceDelete(User $user, Document $document): bool
    {
        return false;
    }
}
