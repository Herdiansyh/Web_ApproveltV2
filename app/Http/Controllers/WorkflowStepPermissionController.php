<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\Subdivision;
use App\Models\WorkflowStepPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WorkflowStepPermissionController extends Controller
{
    public function index(Workflow $workflow)
    {
        // ambil step milik workflow, include division dan permissions -> subdivision
        $steps = WorkflowStep::where('workflow_id', $workflow->id)
    ->with(['division', 'permissions'])
    ->orderBy('step_order')
    ->get();


        // ambil semua subdivisions (bukan hanya milik division step)
        $subdivisions = Subdivision::orderBy('division_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/WorkflowStepPermission/Index', [
            'workflow' => $workflow,
            'steps' => $steps,
            'subdivisions' => $subdivisions,
        ]);
    }

    public function store(Request $request, Workflow $workflow)
    {
        $data = $request->validate([
            'permissions' => 'required|array',
            'permissions.*.workflow_step_id' => 'required|exists:workflow_steps,id',
            'permissions.*.subdivision_id' => 'required|exists:subdivisions,id',
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_approve' => 'boolean',
            'permissions.*.can_reject' => 'boolean',
            'permissions.*.can_request_next' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['permissions'] as $perm) {
                WorkflowStepPermission::updateOrCreate(
                    [
                        'workflow_step_id' => $perm['workflow_step_id'],
                        'subdivision_id' => $perm['subdivision_id'],
                    ],
                    [
                        'can_view' => $perm['can_view'] ?? false,
                        'can_approve' => $perm['can_approve'] ?? false,
                        'can_reject' => $perm['can_reject'] ?? false,
                        'can_request_next' => $perm['can_request_next'] ?? false,
                        'can_edit' => $perm['can_edit'] ?? false,
                        'can_delete' => $perm['can_delete'] ?? false,
                    ]
                );
            }
        });

        return redirect()->back()->with('success', 'Permissions updated successfully.');
    }
}
