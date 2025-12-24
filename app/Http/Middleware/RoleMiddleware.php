<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        // Support both single role and multiple roles (role1|role2|role3)
        $allowedRoles = explode('|', $role);
        $userRole = $request->user()->role;

        // Debug: Log role check
        \Log::info('RoleMiddleware Check', [
            'path' => $request->path(),
            'user_id' => $request->user()->id,
            'user_role' => $userRole,
            'allowed_roles' => $allowedRoles,
            'has_access' => in_array($userRole, $allowedRoles)
        ]);

        if (!in_array($userRole, $allowedRoles)) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
            return redirect()->route('dashboard')->with('error', 'Anda tidak memiliki akses ke halaman tersebut.');
        }

        return $next($request);
    }
}