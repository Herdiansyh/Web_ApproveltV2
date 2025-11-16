<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Division;
use App\Models\DocumentField;
use App\Models\DocumentNameSeries;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        return Inertia::render('Admin/Documents/Index', [
            'documents' => Document::with(['division', 'fields', 'nameSeries'])->get(),
            'divisions' => Division::all(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Document::class);
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
        $this->authorize('update', $document);
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
        $this->authorize('delete', $document);
        $document->delete();
        return back()->with('success', 'Dokumen berhasil dihapus.');
    }

    // ------------------------------
    // Document Type Fields Endpoints
    // ------------------------------

    public function addField(Request $request, Document $document)
    {
        $this->authorize('update', $document);
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'label' => 'required|string|max:255',
            'type' => 'required|string|in:text,textarea,number,date,select,file',
            'required' => 'boolean',
            'order' => 'nullable|integer|min:0',
            'options' => 'nullable|array', // for select
            'options.*' => 'nullable|string',
        ]);

        $field = new DocumentField([
            'name' => $data['name'],
            'label' => $data['label'],
            'type' => $data['type'],
            'required' => (bool)($data['required'] ?? false),
            'order' => $data['order'] ?? 0,
            'options_json' => isset($data['options']) ? json_encode(array_values($data['options'])) : null,
        ]);
        $document->fields()->save($field);

        return back()->with('success', 'Field ditambahkan.');
    }

    public function updateField(Request $request, Document $document, DocumentField $field)
    {
        $this->authorize('update', $document);
        abort_unless($field->document_id === $document->id, 404);

        $data = $request->validate([
            'label' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:text,textarea,number,date,select,file',
            'required' => 'sometimes|boolean',
            'order' => 'sometimes|integer|min:0',
            'options' => 'nullable|array',
            'options.*' => 'nullable|string',
        ]);

        $field->fill([
            'label' => $data['label'] ?? $field->label,
            'type' => $data['type'] ?? $field->type,
            'required' => array_key_exists('required', $data) ? (bool)$data['required'] : $field->required,
            'order' => $data['order'] ?? $field->order,
            'options_json' => array_key_exists('options', $data) ? json_encode(array_values($data['options'] ?? [])) : $field->options_json,
        ])->save();

        return back()->with('success', 'Field diperbarui.');
    }

    public function deleteField(Document $document, DocumentField $field)
    {
        $this->authorize('update', $document);
        abort_unless($field->document_id === $document->id, 404);
        $field->delete();
        return back()->with('success', 'Field dihapus.');
    }

    // ------------------------------
    // Document Name Series Endpoints
    // ------------------------------

    public function updateNameSeries(Request $request, Document $document)
    {
        $this->authorize('update', $document);

        $data = $request->validate([
            'series_pattern' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:50',
            'reset_type' => 'required|in:none,monthly,yearly',
            'current_number' => 'nullable|integer|min:0',
        ]);

        $series = DocumentNameSeries::firstOrCreate(
            ['document_id' => $document->id],
            [
                'series_pattern' => 'yyyy-mm-####',
                'prefix' => null,
                'current_number' => 0,
                'reset_type' => 'none',
                'last_reset_at' => null,
            ]
        );

        $series->series_pattern = $data['series_pattern'];
        $series->prefix = $data['prefix'] ?? null;
        $series->reset_type = $data['reset_type'];
        if (array_key_exists('current_number', $data) && $data['current_number'] !== null) {
            $series->current_number = (int) $data['current_number'];
        }
        $series->save();

        return back()->with('success', 'Name Series berhasil diperbarui.');
    }

    public function resetNameSeries(Document $document)
    {
        $this->authorize('update', $document);

        $series = $document->nameSeries;
        if (!$series) {
            return back()->with('error', 'Name Series belum dikonfigurasi untuk dokumen ini.');
        }

        $series->current_number = 0;
        $series->last_reset_at = now();
        $series->save();

        return back()->with('success', 'Counter Name Series berhasil di-reset.');
    }
}

