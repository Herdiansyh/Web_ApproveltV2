<?php

namespace App\Http\Controllers;

use App\Models\Subdivision;
use App\Models\Division;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubdivisionController extends Controller
{
    public function index()
    {
        $subdivisions = Subdivision::with('division')->get();
        $divisions = Division::all();

        return Inertia::render('Admin/Subdivision/Index', [
            'subdivisions' => $subdivisions,
            'divisions' => $divisions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        Subdivision::create([
            'name' => $request->name,
            'division_id' => $request->division_id,
        ]);

        return redirect()->back()->with('success', 'Subdivision berhasil ditambahkan');
    }

    public function update(Request $request, Subdivision $subdivision)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        $subdivision->update([
            'name' => $request->name,
            'division_id' => $request->division_id,
        ]);

        return redirect()->back()->with('success', 'Subdivision berhasil diperbarui');
    }

    public function destroy(Subdivision $subdivision)
    {
        $subdivision->delete();
        return redirect()->back()->with('success', 'Subdivision berhasil dihapus');
    }
}
