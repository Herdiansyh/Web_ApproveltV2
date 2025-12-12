<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CustomCsrfMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log CSRF debugging info
        Log::info('CSRF Check:', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'has_token' => $request->hasHeader('X-CSRF-TOKEN'),
            'token_header' => $request->header('X-CSRF-TOKEN'),
            'session_token' => $request->session()->token(),
            'cookies' => $request->cookie(),
            'is_ajax' => $request->ajax(),
            'wants_json' => $request->wantsJson(),
        ]);

        // Check if this is the cancel endpoint
        if ($request->is('submissions/*/cancel')) {
            Log::info('Cancel endpoint detected, checking authorization...');
            
            // Additional debug for cancel endpoint
            $user = auth()->user();
            if ($user) {
                Log::info('User authenticated:', [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                ]);
            } else {
                Log::warning('No authenticated user found for cancel request');
            }
        }

        return $next($request);
    }
}
