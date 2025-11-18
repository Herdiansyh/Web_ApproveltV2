<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepPermission;
use App\Models\Division;
use App\Models\Subdivision;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class WorkflowController extends Controller
{
    public function index()
    {
        $workflows = Workflow::with(['document', 'steps.division', 'steps.permissions'])
            ->orderByDesc('id')
            ->get();

        $documents = Document::all();

        return Inertia::render('Admin/Workflow/Index', [
            'workflows' => $workflows,
            'divisions' => Division::orderBy('name')->get(),
            'documents' => $documents,
            'subdivisions' => Subdivision::orderBy('name')->get(),
            'flash' => session('success'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_id' => 'required|exists:documents,id',
            'steps' => 'required|array|min:1',
            'steps.*.division_id' => 'required|exists:divisions,id',
            'steps.*.role' => 'nullable|string|max:100',
            'steps.*.instructions' => 'nullable|string',
            'steps.*.actions' => 'nullable|array',
            'steps.*.permissions' => 'array',
            'is_active' => 'sometimes|boolean',
        ]);

        DB::transaction(function () use ($validated) {
            $divisionFromId = Auth::user()->division_id;
            $lastStep = end($validated['steps']);
            $divisionToId = $lastStep['division_id'] ?? null;

            $workflow = Workflow::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'division_from_id' => $divisionFromId,
                'division_to_id' => $divisionToId,
                'document_id' => $validated['document_id'],
                'is_active' => array_key_exists('is_active', $validated) ? (bool)$validated['is_active'] : true,
                'total_steps' => count($validated['steps']),
            ]);

            foreach ($validated['steps'] as $index => $stepData) {
                $step = WorkflowStep::create([
                    'workflow_id' => $workflow->id,
                    'division_id' => $stepData['division_id'],
                    'step_order' => $index + 1,
                    'role' => $stepData['role'] ?? null,
                    'is_final_step' => ($index + 1 === count($validated['steps'])),
                    'instructions' => $stepData['instructions'] ?? null,
                    'actions' => isset($stepData['actions']) && is_array($stepData['actions']) ? $stepData['actions'] : [],
                ]);

                if (!empty($stepData['permissions'])) {
                    foreach ($stepData['permissions'] as $perm) {
                        WorkflowStepPermission::updateOrCreate(
                            [
                                'workflow_step_id' => $step->id,
                                'subdivision_id' => $perm['subdivision_id'],
                            ],
                            [
                                'can_view' => $perm['can_view'] ?? false,
                                'can_approve' => $perm['can_approve'] ?? false,
                                'can_reject' => $perm['can_reject'] ?? false,
                                'can_request_next' => $perm['can_request_next'] ?? false,
                            ]
                        );
                    }
                }
            }
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil dibuat.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'document_id' => 'required|exists:documents,id',
            'steps' => 'array',
            'steps.*.division_id' => 'required|exists:divisions,id',
            'steps.*.role' => 'nullable|string|max:100',
            'steps.*.instructions' => 'nullable|string',
            'steps.*.actions' => 'nullable|array',
            'steps.*.permissions' => 'array',
            'is_active' => 'sometimes|boolean',
        ]);

        DB::transaction(function () use ($validated, $id) {
            $workflow = Workflow::findOrFail($id);

            $divisionFromId = Auth::user()->division_id;
            $divisionToId = isset($validated['steps']) ? end($validated['steps'])['division_id'] : $workflow->division_to_id;

            $workflow->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'division_from_id' => $divisionFromId,
                'division_to_id' => $divisionToId,
                'document_id' => $validated['document_id'],
                'is_active' => array_key_exists('is_active', $validated) ? (bool)$validated['is_active'] : $workflow->is_active,
                'total_steps' => isset($validated['steps']) ? count($validated['steps']) : $workflow->total_steps,
            ]);

            if (isset($validated['steps'])) {
                // Simpan existing permissions sebelum delete step
                $existingSteps = $workflow->steps()->with('permissions')->get();
                $permissionsMap = [];
                foreach ($existingSteps as $oldStep) {
                    $key = $oldStep->step_order . '_' . $oldStep->division_id;
                    $permissionsMap[$key] = $oldStep->permissions->map(function($perm) {
                        return [
                            'subdivision_id' => $perm->subdivision_id,
                            'can_view' => $perm->can_view,
                            'can_approve' => $perm->can_approve,
                            'can_reject' => $perm->can_reject,
                            'can_request_next' => $perm->can_request_next,
                        ];
                    })->toArray();
                }

                // Delete existing steps (permissions will cascade)
                $workflow->steps()->delete();

                foreach ($validated['steps'] as $index => $stepData) {
                    $step = WorkflowStep::create([
                        'workflow_id' => $workflow->id,
                        'division_id' => $stepData['division_id'],
                        'step_order' => $index + 1,
                        'role' => $stepData['role'] ?? null,
                        'is_final_step' => ($index + 1 === count($validated['steps'])),
                        'instructions' => $stepData['instructions'] ?? null,
                        'actions' => isset($stepData['actions']) && is_array($stepData['actions']) ? $stepData['actions'] : [],
                    ]);

                    // Restore permissions dari step lama jika step_order dan division_id sama
                    $key = $step->step_order . '_' . $step->division_id;
                    $permissionsToRestore = $permissionsMap[$key] ?? [];

                    // Jika ada permissions dari request, gunakan itu, jika tidak gunakan yang tersimpan
                    $permissions = !empty($stepData['permissions']) ? $stepData['permissions'] : $permissionsToRestore;

                    if (!empty($permissions)) {
                        foreach ($permissions as $perm) {
                            WorkflowStepPermission::updateOrCreate(
                                [
                                    'workflow_step_id' => $step->id,
                                    'subdivision_id' => $perm['subdivision_id'],
                                ],
                                [
                                    'can_view' => $perm['can_view'] ?? false,
                                    'can_approve' => $perm['can_approve'] ?? false,
                                    'can_reject' => $perm['can_reject'] ?? false,
                                    'can_request_next' => $perm['can_request_next'] ?? false,
                                ]
                            );
                        }
                    }
                }
            }
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $workflow = Workflow::findOrFail($id);

        DB::transaction(function () use ($workflow) {
            $workflow->steps()->delete();
            $workflow->delete();
        });

        return redirect()->route('workflows.index')->with('success', 'Workflow berhasil dihapus.');
    }
}