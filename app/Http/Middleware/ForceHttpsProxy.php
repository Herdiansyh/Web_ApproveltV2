<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceHttpsProxy
{
    public function handle(Request $request, Closure $next)
    {
        // Paksa Laravel mendeteksi request sebagai HTTPS untuk ngrok
        if ($request->header('X-Forwarded-Proto') == 'https' || 
            $request->header('X-Forwarded-Ssl') == 'on' ||
            $request->server->get('HTTP_X_FORWARDED_PROTO') == 'https') {
            
            $request->server->set('HTTPS', 'on');
            $request->setTrustedProxies([$request->ip()]);
            \URL::forceScheme('https');
        }

        return $next($request);
    }
}
