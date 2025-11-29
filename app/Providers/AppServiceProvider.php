<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register middleware
        $this->app['router']->aliasMiddleware('role', \App\Http\Middleware\CheckRole::class);

        // Force HTTPS untuk ngrok dan production
        if (app()->environment('production') || 
            request()->header('x-forwarded-proto') == 'https' ||
            str_contains(request()->getHost(), 'ngrok')) {
            URL::forceScheme('https');
        }
    }
}
