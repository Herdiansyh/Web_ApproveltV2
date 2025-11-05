<?php

namespace App\Http\Controllers;

use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DivisionController extends Controller
{
    // Menampilkan daftar division
 public function index()
{
    return Inertia::render('Admin/Division/Index', [
        'divisions' => Division::with('subdivisions')->get(),
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

    // Hapus division
    public function destroy(Division $division)
    {
        $division->delete();

        return redirect()->route('divisions.index')
            ->with('success', 'Division berhasil dihapus');
    }
}
