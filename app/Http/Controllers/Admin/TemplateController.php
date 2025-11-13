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
            'template_type' => ['nullable', 'in:html,blade'],
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
                'template_type' => $validated['template_type'] ?? 'blade',
                'html_view_path' => $validated['html_view_path'] ?? null,
                'config_json' => $validated['config_json'] ?? null,
                'version' => $validated['version'] ?? 1,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $request->user()->id ?? null,
            ]);

            // Auto-derive fields from Blade schema or placeholders when fields not provided
            $derived = [];
            $cfgFields = [];
            if ($template->html_view_path) {
                try {
                    $viewPath = str_replace('.', DIRECTORY_SEPARATOR, $template->html_view_path) . '.blade.php';
                    $abs = base_path('resources' . DIRECTORY_SEPARATOR . 'views' . DIRECTORY_SEPARATOR . $viewPath);
                    if (is_file($abs)) {
                        $content = @file_get_contents($abs) ?: '';
                        // 1) TEMPLATE_SCHEMA JSON
                        if (preg_match('/<!--\s*TEMPLATE_SCHEMA\s*(\{[\s\S]*?\})\s*-->/', $content, $m)) {
                            $json = json_decode($m[1], true);
                            $fields = data_get($json, 'fields');
                            // also support flat map { name: type }
                            if (is_array($fields)) {
                                foreach ($fields as $f) {
                                    if (is_array($f) && isset($f['name'])) {
                                        $derived[$f['name']] = [
                                            'label' => data_get($f, 'label', ucfirst(str_replace('_', ' ', $f['name']))),
                                            'type' => strtolower((string) data_get($f, 'type', 'text')),
                                            'required' => (bool) data_get($f, 'required', false),
                                            'options' => data_get($f, 'options', []),
                                        ];
                                    }
                                }
                            } elseif (is_array($json)) {
                                foreach ($json as $name => $meta) {
                                    // flat map support
                                    if (!is_array($meta)) { $meta = ['type' => $meta]; }
                                    $derived[$name] = [
                                        'label' => data_get($meta, 'label', ucfirst(str_replace('_', ' ', $name))),
                                        'type' => strtolower((string) data_get($meta, 'type', 'text')),
                                        'required' => (bool) data_get($meta, 'required', false),
                                        'options' => data_get($meta, 'options', []),
                                    ];
                                }
                            }
                        }
                        // 2) data_get placeholders
                        if (preg_match_all("/data_get\\(\\$data,\\s*'([^']+)'/", $content, $mm)) {
                            foreach ($mm[1] as $name) {
                                if (!isset($derived[$name])) {
                                    $derived[$name] = [
                                        'label' => ucfirst(str_replace('_', ' ', $name)),
                                        'type' => 'text',
                                        'required' => false,
                                        'options' => [],
                                    ];
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Template schema parse failed', ['error' => $e->getMessage()]);
                }
            }

            // If admin provided fields, use them; else, use derived
            $finalFields = !empty($validated['fields']) ? $validated['fields'] : array_map(function ($name, $meta) {
                return [
                    'name' => $name,
                    'label' => $meta['label'] ?? ucfirst(str_replace('_', ' ', $name)),
                    'type' => $meta['type'] ?? 'text',
                    'required' => $meta['required'] ?? false,
                    'options_json' => isset($meta['options']) ? json_encode($meta['options']) : null,
                    'order' => 0,
                ];
            }, array_keys($derived), array_values($derived));

            if (!empty($finalFields)) {
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

            // Persist config_json.fields for future auto-forms
            if (empty($validated['config_json'])) {
                $cfgFields = [];
                foreach ($finalFields as $f) {
                    $opts = [];
                    if (!empty($f['options_json'])) {
                        $opts = json_decode($f['options_json'], true) ?: [];
                    }
                    $cfgFields[$f['name']] = [
                        'label' => $f['label'],
                        'type' => $f['type'] ?? 'text',
                        'required' => (bool) ($f['required'] ?? false),
                        'options' => $opts,
                    ];
                }
                $template->config_json = ['fields' => $cfgFields];
                $template->save();
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
            'template_type' => ['sometimes', 'in:html,blade'],
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

            // Auto-derive if fields not explicitly provided or when html_view_path changed
            $shouldAuto = !array_key_exists('fields', $validated) || !($validated['fields'] ?? []);
            $derived = [];
            if ($shouldAuto && $template->html_view_path) {
                try {
                    $viewPath = str_replace('.', DIRECTORY_SEPARATOR, $template->html_view_path) . '.blade.php';
                    $abs = base_path('resources' . DIRECTORY_SEPARATOR . 'views' . DIRECTORY_SEPARATOR . $viewPath);
                    if (is_file($abs)) {
                        $content = @file_get_contents($abs) ?: '';
                        if (preg_match('/<!--\s*TEMPLATE_SCHEMA\s*(\{[\s\S]*?\})\s*-->/', $content, $m)) {
                            $json = json_decode($m[1], true);
                            $fields = data_get($json, 'fields');
                            if (is_array($fields)) {
                                foreach ($fields as $f) {
                                    if (is_array($f) && isset($f['name'])) {
                                        $derived[$f['name']] = [
                                            'label' => data_get($f, 'label', ucfirst(str_replace('_', ' ', $f['name']))),
                                            'type' => strtolower((string) data_get($f, 'type', 'text')),
                                            'required' => (bool) data_get($f, 'required', false),
                                            'options' => data_get($f, 'options', []),
                                        ];
                                    }
                                }
                            } elseif (is_array($json)) {
                                foreach ($json as $name => $meta) {
                                    if (!is_array($meta)) { $meta = ['type' => $meta]; }
                                    $derived[$name] = [
                                        'label' => data_get($meta, 'label', ucfirst(str_replace('_', ' ', $name))),
                                        'type' => strtolower((string) data_get($meta, 'type', 'text')),
                                        'required' => (bool) data_get($meta, 'required', false),
                                        'options' => data_get($meta, 'options', []),
                                    ];
                                }
                            }
                        }
                        if (preg_match_all("/data_get\\(\\$data,\\s*'([^']+)'/", $content, $mm)) {
                            foreach ($mm[1] as $name) {
                                if (!isset($derived[$name])) {
                                    $derived[$name] = [
                                        'label' => ucfirst(str_replace('_', ' ', $name)),
                                        'type' => 'text',
                                        'required' => false,
                                        'options' => [],
                                    ];
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Template schema parse failed (update)', ['error' => $e->getMessage()]);
                }
            }

            if (!$shouldAuto && array_key_exists('fields', $validated)) {
                // Replace with provided fields
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
            } else {
                // Replace with auto-derived
                if (!empty($derived)) {
                    $template->fields()->delete();
                    foreach ($derived as $name => $meta) {
                        $template->fields()->create([
                            'name' => $name,
                            'label' => $meta['label'] ?? ucfirst(str_replace('_', ' ', $name)),
                            'type' => $meta['type'] ?? 'text',
                            'required' => (bool) ($meta['required'] ?? false),
                            'options_json' => !empty($meta['options']) ? json_encode($meta['options']) : null,
                            'order' => 0,
                        ]);
                    }
                    // Persist to config_json
                    $cfg = [];
                    foreach ($derived as $n => $m) {
                        $cfg[$n] = [
                            'label' => $m['label'] ?? ucfirst(str_replace('_', ' ', $n)),
                            'type' => $m['type'] ?? 'text',
                            'required' => (bool) ($m['required'] ?? false),
                            'options' => $m['options'] ?? [],
                        ];
                    }
                    $template->config_json = ['fields' => $cfg];
                    $template->save();
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

