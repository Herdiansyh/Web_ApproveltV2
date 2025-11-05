<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Division;
use App\Models\Subdivision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Gate;

class UserManagementController extends Controller
{
    /**
     * Konstruktor: Hanya admin yang boleh kelola user
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            // Menggunakan Gate atau cek role langsung seperti ini sudah efektif
            if (Auth::check() && Auth::user()->role !== 'admin') {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }
            // Jika belum login, middleware 'auth' akan mengurusnya.
            // Jika sudah login dan role-nya 'admin', lanjutkan.
            return $next($request);
        });
    }

    /**
     * Tampilkan semua user
     */
    public function index()
    {
        $users = User::with(['division', 'subdivision'])->orderBy('name')->get();

        return Inertia::render('Admin/UserManagement/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Form untuk membuat user baru
     */
    public function create()
    {
        $divisions = Division::all();
        $subdivisions = Subdivision::all();

        return Inertia::render('Admin/UserManagement/Create', [
            'divisions' => $divisions,
            'subdivisions' => $subdivisions,
        ]);
    }

    /**
     * Simpan user baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => ['required', Rule::in(['admin', 'employee', 'direktur'])],
            'division_id' => 'nullable|exists:divisions,id',
            'subdivision_id' => 'nullable|exists:subdivisions,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            // Pastikan nilai null tetap null jika tidak ada input
            'division_id' => $validated['division_id'] ?? null, 
            'subdivision_id' => $validated['subdivision_id'] ?? null,
        ]);

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Form edit user
     */
    public function edit(User $user)
    {
        $divisions = Division::all();
        $subdivisions = Subdivision::all();

        // **Perbaikan:** Muat relasi user agar data division/subdivision siap di frontend
        $user->load(['division', 'subdivision']);

        return Inertia::render('Admin/UserManagement/Edit', [
            'user' => $user,
            'divisions' => $divisions,
            'subdivisions' => $subdivisions,
        ]);
    }

    /**
     * Update user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required','email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6|confirmed',
            'role' => ['required', Rule::in(['admin', 'employee', 'direktur'])],
            'division_id' => 'nullable|exists:divisions,id',
            'subdivision_id' => 'nullable|exists:subdivisions,id',
        ]);
        
        // **Perbaikan:** Guardrail untuk admin agar tidak bisa mengubah role dirinya sendiri menjadi non-admin
        if (Auth::user()->id === $user->id && $validated['role'] !== 'admin') {
             return redirect()->back()->withErrors([
                'role' => 'Anda tidak diizinkan mengubah role Anda sendiri dari "admin" ke role lain.'
            ]);
            // Atau secara pasif mengabaikan perubahan role:
            // $validated['role'] = 'admin'; 
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            // Hanya update password jika ada input baru
            'password' => $validated['password'] ? Hash::make($validated['password']) : $user->password,
            'role' => $validated['role'],
            'division_id' => $validated['division_id'] ?? null,
            'subdivision_id' => $validated['subdivision_id'] ?? null,
        ]);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Hapus user
     */
    public function destroy(User $user)
    {
        // Guardrail tambahan: Mencegah admin menghapus akunnya sendiri
        if (Auth::user()->id === $user->id) {
             return redirect()->back()->with('error', 'Anda tidak bisa menghapus akun Anda sendiri.');
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');
    }
}