<?php

namespace App\Http\Controllers;

use App\Models\WorkflowStep;
use App\Models\WorkflowStepPermission;
use App\Models\Subdivision;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkflowStepPermissionController extends Controller
{
    // Tampilkan semua permission untuk satu workflow step
    public function index(WorkflowStep $workflowStep)
    {
        $permissions = $workflowStep->permissions()->with('subdivision')->get();
        $subdivisions = Subdivision::all();

        return Inertia::render('Admin/WorkflowStepPermission/Index', [
            'workflowStep' => $workflowStep,
            'permissions' => $permissions,
            'subdivisions' => $subdivisions,
        ]);
    }

    // Tampilkan form untuk menambah permission baru
    public function create(WorkflowStep $workflowStep)
    {
        $subdivisions = Subdivision::all();

        return Inertia::render('Admin/WorkflowStepPermission/Create', [
            'workflowStep' => $workflowStep,
            'subdivisions' => $subdivisions,
        ]);
    }

    // Simpan permission baru
    public function store(Request $request, WorkflowStep $workflowStep)
    {
        $request->validate([
            'subdivision_id' => 'required|exists:subdivisions,id',
            'can_read' => 'boolean',
            'can_edit' => 'boolean',
            'can_delete' => 'boolean',
            'can_approve' => 'boolean',
            'can_reject' => 'boolean',
            'can_upload' => 'boolean',
            'can_download' => 'boolean',
        ]);

        $workflowStep->permissions()->create($request->all());

        return redirect()->route('workflow-steps.permissions.index', $workflowStep->id)
                         ->with('success', 'Permission created successfully.');
    }

    // Tampilkan form edit permission
    public function edit(WorkflowStepPermission $permission)
    {
        $subdivisions = Subdivision::all();

        return Inertia::render('Admin/WorkflowStepPermission/Edit', [
            'permission' => $permission,
            'subdivisions' => $subdivisions,
        ]);
    }

    // Update permission
    public function update(Request $request, WorkflowStepPermission $permission)
    {
        $request->validate([
            'subdivision_id' => 'required|exists:subdivisions,id',
            'can_read' => 'boolean',
            'can_edit' => 'boolean',
            'can_delete' => 'boolean',
            'can_approve' => 'boolean',
            'can_reject' => 'boolean',
            'can_upload' => 'boolean',
            'can_download' => 'boolean',
        ]);

        $permission->update($request->all());

        return redirect()->route('workflow-steps.permissions.index', $permission->workflow_step_id)
                         ->with('success', 'Permission updated successfully.');
    }

    // Hapus permission
    public function destroy(WorkflowStepPermission $permission)
    {
        $workflowStepId = $permission->workflow_step_id;
        $permission->delete();

        return redirect()->route('workflow-steps.permissions.index', $workflowStepId)
                         ->with('success', 'Permission deleted successfully.');
    }
}
