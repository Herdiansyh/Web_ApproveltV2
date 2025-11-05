<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Division;
use App\Models\Subdivision;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Menampilkan daftar user.
     */
    public function index()
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::with(['division', 'subdivision'])
                ->latest()
                ->paginate(10),
            'divisions' => Division::all(),
            'subdivisions' => Subdivision::all(),
            'roles' => ['direktur', 'admin', 'employee'], // ✅ sesuai sistem E-Approval
        ]);
    }

    /**
     * Simpan user baru.
     */
    public function store(Request $request)
    {
        // Validasi umum
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', Rules\Password::defaults()],
            'role' => 'required|in:direktur,admin,employee',
            'division_id' => 'required|exists:divisions,id',
            'subdivision_id' => 'nullable|exists:subdivisions,id',
        ]);

        // Jika role employee, subdivision wajib diisi
        if ($validated['role'] === 'employee' && !$validated['subdivision_id']) {
            return back()->withErrors(['subdivision_id' => 'Sub divisi wajib diisi untuk employee']);
        }

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'division_id' => $validated['division_id'],
            'subdivision_id' => $validated['subdivision_id'],
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User berhasil ditambahkan');
    }

    /**
     * Update data user.
     */
    public function update(Request $request, User $user)
    {
        // Validasi umum
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:direktur,admin,employee',
            'division_id' => 'required|exists:divisions,id',
            'subdivision_id' => 'nullable|exists:subdivisions,id',
        ]);

        // Jika role employee, subdivision wajib diisi
        if ($validated['role'] === 'employee' && !$validated['subdivision_id']) {
            return back()->withErrors(['subdivision_id' => 'Sub divisi wajib diisi untuk employee']);
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'division_id' => $validated['division_id'],
            'subdivision_id' => $validated['subdivision_id'],
        ];

        // Update password jika diisi
        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', 'string', Rules\Password::defaults()],
            ]);
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'User berhasil diperbarui');
    }

    /**
     * Hapus user.
     */
    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Tidak bisa menghapus akun sendiri');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus');
    }
}
