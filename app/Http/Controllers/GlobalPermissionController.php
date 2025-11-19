<?php

namespace App\Http\Controllers;

use App\Models\Subdivision;
use App\Models\SubdivisionPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class GlobalPermissionController extends Controller
{
    public function index()
    {
        $subdivisions = Subdivision::with('division')
            ->orderBy('division_id')
            ->orderBy('name')
            ->get();

        $permissions = SubdivisionPermission::all()->keyBy('subdivision_id');

        return Inertia::render('Admin/GlobalPermissions/Index', [
            'subdivisions' => $subdivisions,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'permissions' => 'required|array',
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
                SubdivisionPermission::updateOrCreate(
                    ['subdivision_id' => $perm['subdivision_id']],
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

        return redirect()->back()->with('success', 'Global permissions updated successfully.');
    }
}
