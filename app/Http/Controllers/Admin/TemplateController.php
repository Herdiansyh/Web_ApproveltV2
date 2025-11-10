<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\TemplateField;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $templates = Template::withCount('fields')->latest()->paginate(10)->through(function ($t) {
            return [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'description' => $t->description,
                'is_active' => $t->is_active,
                'version' => $t->version,
                'fields_count' => $t->fields_count,
                'updated_at' => $t->updated_at,
            ];
        });

        return Inertia::render('Admin/Templates/Index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Templates/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:templates,slug'],
            'description' => ['nullable', 'string'],
            'template_type' => ['nullable', 'in:html'],
            'html_view_path' => ['nullable', 'string', 'max:255'],
            'config_json' => ['nullable'],
            'is_active' => ['nullable', 'boolean'],
            'version' => ['nullable', 'integer', 'min:1'],
            // optional fields array
            'fields' => ['nullable', 'array'],
            'fields.*.name' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.label' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.type' => ['nullable', 'string', 'max:50'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.validations_json' => ['nullable'],
            'fields.*.options_json' => ['nullable'],
            'fields.*.order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $slug = $validated['slug'] ?? Str::slug($validated['name']);

            $template = Template::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'template_type' => $validated['template_type'] ?? 'html',
                'html_view_path' => $validated['html_view_path'] ?? null,
                'config_json' => $validated['config_json'] ?? null,
                'version' => $validated['version'] ?? 1,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()->id ?? null,
            ]);

            if (!empty($validated['fields'])) {
                foreach ($validated['fields'] as $f) {
                    $template->fields()->create([
                        'name' => $f['name'],
                        'label' => $f['label'],
                        'type' => $f['type'] ?? 'text',
                        'required' => $f['required'] ?? false,
                        'validations_json' => $f['validations_json'] ?? null,
                        'options_json' => $f['options_json'] ?? null,
                        'order' => $f['order'] ?? 0,
                    ]);
                }
            }
        });

        return redirect()->route('templates.index')->with('success', 'Template created');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $template = Template::with('fields')->findOrFail($id);
        return Inertia::render('Admin/Templates/Show', [
            'template' => $template,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $template = Template::with('fields')->findOrFail($id);
        return Inertia::render('Admin/Templates/Edit', [
            'template' => $template,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $template = Template::with('fields')->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:templates,slug,' . $template->id],
            'description' => ['nullable', 'string'],
            'template_type' => ['sometimes', 'in:html'],
            'html_view_path' => ['nullable', 'string', 'max:255'],
            'config_json' => ['nullable'],
            'is_active' => ['nullable', 'boolean'],
            'version' => ['nullable', 'integer', 'min:1'],
            // optional fields array to replace
            'fields' => ['nullable', 'array'],
            'fields.*.id' => ['nullable', 'integer'],
            'fields.*.name' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.label' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.type' => ['nullable', 'string', 'max:50'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.validations_json' => ['nullable'],
            'fields.*.options_json' => ['nullable'],
            'fields.*.order' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($template, $validated) {
            $template->fill([
                'name' => $validated['name'] ?? $template->name,
                'slug' => $validated['slug'] ?? $template->slug,
                'description' => $validated['description'] ?? $template->description,
                'template_type' => $validated['template_type'] ?? $template->template_type,
                'html_view_path' => $validated['html_view_path'] ?? $template->html_view_path,
                'config_json' => $validated['config_json'] ?? $template->config_json,
                'version' => $validated['version'] ?? $template->version,
                'is_active' => array_key_exists('is_active', $validated) ? (bool)$validated['is_active'] : $template->is_active,
            ])->save();

            if (array_key_exists('fields', $validated)) {
                // Simple strategy: replace all fields with incoming array
                $template->fields()->delete();
                foreach ($validated['fields'] ?? [] as $f) {
                    $template->fields()->create([
                        'name' => $f['name'],
                        'label' => $f['label'],
                        'type' => $f['type'] ?? 'text',
                        'required' => $f['required'] ?? false,
                        'validations_json' => $f['validations_json'] ?? null,
                        'options_json' => $f['options_json'] ?? null,
                        'order' => $f['order'] ?? 0,
                    ]);
                }
            }
        });

        return redirect()->route('templates.edit', $template->id)->with('success', 'Template updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $template = Template::findOrFail($id);
        $template->delete();
        return redirect()->route('templates.index')->with('success', 'Template deleted');
    }
}

