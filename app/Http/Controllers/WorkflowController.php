<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepPermission;
use App\Models\Division;
use App\Models\Document;
use App\Models\Subdivision;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    /**
     * Tampilkan daftar semua workflow
     */
 public function index()
{
    $workflows = Workflow::with(['document', 'steps.division'])
        ->orderBy('id', 'desc')
        ->get();

    $divisions = Division::orderBy('name')->get();
    $documents = Document::orderBy('name')->get();
    $subdivisions = Subdivision::orderBy('name')->get();

    return Inertia::render('Admin/Workflow/Index', [
        'workflows' => $workflows,
        'divisions' => $divisions,
        'documents' => $documents,
        'subdivisions' => $subdivisions,
    ]);
}


    /**
     * Form untuk membuat workflow baru
     */
    public function create()
    {
        return Inertia::render('Admin/Workflow/Create', [
            'divisions' => Division::all(),
            'documents' => Document::all(),
            'subdivisions' => Subdivision::all(),
        ]);
    }

    /**
     * Simpan workflow baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'division_from_id' => 'required|exists:divisions,id',
            'division_to_id'   => 'nullable|exists:divisions,id',
            'document_id'      => 'required|exists:documents,id',
            'steps'            => 'required|array|min:1',
            'steps.*.division_id' => 'required|exists:divisions,id',
            'steps.*.step_order'  => 'required|integer|min:1',
            'steps.*.role'        => 'nullable|string|max:100',
            'steps.*.permissions' => 'array', // subdivisi + hak akses
        ]);

        DB::transaction(function () use ($validated) {
            // Simpan workflow utama
            $workflow = Workflow::create([
                'name'             => $validated['name'],
                'description'      => $validated['description'] ?? null,
                'division_from_id' => $validated['division_from_id'],
                'division_to_id'   => $validated['division_to_id'] ?? null,
                'document_id'      => $validated['document_id'],
                'is_active'        => true,
                'total_steps'      => count($validated['steps']),
            ]);

            // Simpan langkah-langkah workflow
            foreach ($validated['steps'] as $stepData) {
                $step = WorkflowStep::create([
                    'workflow_id'   => $workflow->id,
                    'division_id'   => $stepData['division_id'],
                    'step_order'    => $stepData['step_order'],
                    'role'          => $stepData['role'] ?? null,
                    'is_final_step' => $stepData['is_final_step'] ?? false,
                    'instructions'  => $stepData['instructions'] ?? null,
                    'actions'       => $stepData['actions'] ?? null,
                ]);

                // Simpan permission subdivisi di langkah ini (jika ada)
                if (!empty($stepData['permissions'])) {
                    foreach ($stepData['permissions'] as $perm) {
                        WorkflowStepPermission::create([
                            'workflow_step_id' => $step->id,
                            'subdivision_id'   => $perm['subdivision_id'],
                            'can_read'         => $perm['can_read'] ?? false,
                            'can_create'       => $perm['can_create'] ?? false,
                            'can_edit'         => $perm['can_edit'] ?? false,
                            'can_delete'       => $perm['can_delete'] ?? false,
                            'can_approve'      => $perm['can_approve'] ?? false,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil dibuat.');
    }

    /**
     * Edit workflow
     */
    public function edit($id)
    {
        $workflow = Workflow::with(['steps.permissions.subdivision', 'document'])->findOrFail($id);

        return Inertia::render('Admin/Workflow/Edit', [
            'workflow' => $workflow,
            'divisions' => Division::all(),
            'documents' => Document::all(),
            'subdivisions' => Subdivision::all(),
        ]);
    }

    /**
     * Update workflow
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'division_from_id' => 'required|exists:divisions,id',
            'division_to_id'   => 'nullable|exists:divisions,id',
            'document_id'      => 'required|exists:documents,id',
            'steps'            => 'array',
        ]);

        DB::transaction(function () use ($validated, $id) {
            $workflow = Workflow::findOrFail($id);
            $workflow->update([
                'name'             => $validated['name'],
                'description'      => $validated['description'] ?? null,
                'division_from_id' => $validated['division_from_id'],
                'division_to_id'   => $validated['division_to_id'] ?? null,
                'document_id'      => $validated['document_id'],
                'total_steps'      => isset($validated['steps']) ? count($validated['steps']) : $workflow->total_steps,
            ]);

            if (isset($validated['steps'])) {
                // Hapus semua step dan permission lama
                $workflow->steps()->each(function ($step) {
                    $step->permissions()->delete();
                });
                $workflow->steps()->delete();

                // Simpan step dan permission baru
                foreach ($validated['steps'] as $stepData) {
                    $step = WorkflowStep::create([
                        'workflow_id'   => $workflow->id,
                        'division_id'   => $stepData['division_id'],
                        'step_order'    => $stepData['step_order'],
                        'role'          => $stepData['role'] ?? null,
                        'is_final_step' => $stepData['is_final_step'] ?? false,
                        'instructions'  => $stepData['instructions'] ?? null,
                        'actions'       => $stepData['actions'] ?? null,
                    ]);

                    if (!empty($stepData['permissions'])) {
                        foreach ($stepData['permissions'] as $perm) {
                            WorkflowStepPermission::create([
                                'workflow_step_id' => $step->id,
                                'subdivision_id'   => $perm['subdivision_id'],
                                'can_read'         => $perm['can_read'] ?? false,
                                'can_create'       => $perm['can_create'] ?? false,
                                'can_edit'         => $perm['can_edit'] ?? false,
                                'can_delete'       => $perm['can_delete'] ?? false,
                                'can_approve'      => $perm['can_approve'] ?? false,
                            ]);
                        }
                    }
                }
            }
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil diperbarui.');
    }

    /**
     * Hapus workflow
     */
    public function destroy($id)
    {
        $workflow = Workflow::findOrFail($id);
        DB::transaction(function () use ($workflow) {
            $workflow->steps()->each(function ($step) {
                $step->permissions()->delete();
            });
            $workflow->steps()->delete();
            $workflow->delete();
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil dihapus.');
    }
}
