<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
  
        return Inertia::render('Admin/Documents/Index', [
            'documents' => Document::with(['division'])->get(),
            'divisions' => Division::all(),
        ]);
    }

    public function store(Request $request)
    {
     
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Document::create($request->only('division_id', 'name', 'description'));

        return back()->with('success', 'Dokumen berhasil ditambahkan.');
    }

    public function update(Request $request, Document $document)
    {
 
        $request->validate([
            'division_id' => 'required|exists:divisions,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $document->update($request->only('division_id', 'name', 'description'));

        return back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    public function destroy(Document $document)
    {
  
        $document->delete();

        return back()->with('success', 'Dokumen berhasil dihapus.');
    }
}
