<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Subdivision;
use App\Models\DocumentPermission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DocumentPermissionController extends Controller
{
      public function index()
    {
          $documents = Document::all(); // contoh data dokumen
    $users = User::all(); // contoh data user untuk permission

    return Inertia::render('Admin/Permission/PermissionIndex', [
        'documents' => $documents,
        'users' => $users,
    ]);
    }
    public function edit($documentId)
    {
        $document = Document::findOrFail($documentId);
        $subdivisions = Subdivision::with(['documentPermissions' => function ($query) use ($documentId) {
            $query->where('document_id', $documentId);
        }])->get();

        return Inertia::render('Admin/DocumentPermissions/Edit', [
            'document' => $document,
            'subdivisions' => $subdivisions,
        ]);
    }

    public function update(Request $request, $documentId)
    {
        $request->validate([
            'permissions' => 'array',
        ]);

        DB::transaction(function () use ($request, $documentId) {
            $permissions = $request->input('permissions', []);

            // Hapus semua permission lama dulu
            DocumentPermission::where('document_id', $documentId)->delete();

            foreach ($permissions as $subdivisionId => $values) {
                DocumentPermission::create([
                    'document_id' => $documentId,
                    'subdivision_id' => $subdivisionId,
                    'can_view' => !empty($values['can_view']),
                    'can_create' => !empty($values['can_create']),
                    'can_edit' => !empty($values['can_edit']),
                    'can_delete' => !empty($values['can_delete']),
                    'can_approve' => !empty($values['can_approve']),
                    'can_reject' => !empty($values['can_reject']),
                ]);
            }
        });

        return redirect()->back()->with('success', 'Permissions updated successfully.');
    }
}
