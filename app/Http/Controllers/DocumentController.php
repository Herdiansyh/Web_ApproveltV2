<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('viewAny', Document::class);

        return Inertia::render('Documents/Index', [
    'documents' => Document::with('permissions.subdivision')->get(),
]);

    }

    public function store(Request $request)
    {
        $this->authorize('create', Document::class);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Document::create($request->only('name', 'description'));

        return back()->with('success', 'Dokumen berhasil ditambahkan.');
    }

    public function update(Request $request, Document $document)
    {
        $this->authorize('update', $document);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $document->update($request->only('name', 'description'));

        return back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    public function destroy(Document $document)
    {
        $this->authorize('delete', $document);

        $document->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }
}
