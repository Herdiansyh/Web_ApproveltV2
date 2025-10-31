<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Document;
use App\Models\DocumentPermission;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Document $document): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if (!$user->subdivision_id) {
            return false;
        }

        return DocumentPermission::where('subdivision_id', $user->subdivision_id)
            ->where('can_create', true)
            ->exists();
    }

    public function update(User $user, Document $document): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if (!$user->subdivision_id) {
            return false;
        }

        return DocumentPermission::where('document_id', $document->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_edit', true)
            ->exists();
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if (!$user->subdivision_id) {
            return false;
        }

        return DocumentPermission::where('document_id', $document->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_delete', true)
            ->exists();
    }

    public function approve(User $user, Document $document): bool
    {
        if (!$user->subdivision_id) {
            return false;
        }

        return DocumentPermission::where('document_id', $document->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_approve', true)
            ->exists();
    }

    public function reject(User $user, Document $document): bool
    {
        if (!$user->subdivision_id) {
            return false;
        }

        return DocumentPermission::where('document_id', $document->id)
            ->where('subdivision_id', $user->subdivision_id)
            ->where('can_reject', true)
            ->exists();
    }
}
