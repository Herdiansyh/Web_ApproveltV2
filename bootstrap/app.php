<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Response;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\CustomCsrfMiddleware::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response) {
            if ($response->getStatusCode() === 404) {
                return Inertia::render('Errors/NotFound')
                    ->toResponse(request())
                    ->setStatusCode(404);
            }
            
            return $response;
        });$exceptions->respond(function ($response) {
    if ($response->getStatusCode() === 404) {
        return Inertia::render('Errors/NotFound')
            ->toResponse(request())
            ->setStatusCode(404);
    }

    return $response;
});

    })->create();
