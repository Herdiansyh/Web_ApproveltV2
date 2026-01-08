<?php

namespace App\Http\Controllers;

use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DivisionController extends Controller
{
    /**
     * Fetch semua divisions tanpa pagination untuk search/filter.
     */
    public function all()
    {
        $divisions = Division::with(['subdivisions'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $divisions
        ]);
    }

    // Menampilkan daftar division
    public function index()
    {
        return Inertia::render('Admin/Division/Index', [
            'divisions' => Division::with('subdivisions')->paginate(10),
        ]);
    }


    // Halaman buat division baru
    public function create()
    {
        return Inertia::render('Admin/Division/Create');
    }

    // Simpan division baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:divisions,name',
            'description' => 'nullable|string',
        ]);

        Division::create($request->only('name', 'description'));

        return redirect()->route('divisions.index')
            ->with('success', 'Division berhasil dibuat');
    }

    // Halaman edit division
    public function edit(Division $division)
    {
        return Inertia::render('Admin/Division/Edit', [
            'division' => $division,
        ]);
    }

    // Update division
    public function update(Request $request, Division $division)
    {
        $request->validate([
            'name' => 'required|unique:divisions,name,' . $division->id,
            'description' => 'nullable|string',
        ]);

        $division->update($request->only('name', 'description'));

        return redirect()->route('divisions.index')
            ->with('success', 'Division berhasil diperbarui');
    }

    // API endpoints untuk dropdown dinamis
    public function getDivisions()
    {
        $divisions = Division::all()->map(function ($division) {
            return [
                'id' => $division->id,
                'name' => $division->name,
            ];
        });

        return response()->json($divisions);
    }

    public function getSubdivisions($divisionId)
    {
        try {
            $division = Division::findOrFail($divisionId);
            $subdivisions = $division->subdivisions()->get()->map(function ($subdivision) {
                return [
                    'id' => $subdivision->id,
                    'name' => $subdivision->name,
                ];
            });

            return response()->json($subdivisions);
        } catch (\Exception $e) {
            \Log::error('Error fetching subdivisions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch subdivisions'], 500);
        }
    }

    // Hapus division
    public function destroy(Division $division)
    {
        $division->delete();

        return redirect()->route('divisions.index')
            ->with('success', 'Division berhasil dihapus');
    }
}
