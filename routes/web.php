<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkflowController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// User Management Routes (Manager only)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});
Route::get('/view-pdf/{filename}', function ($filename) {
    $path = storage_path('app/private/submission/' . $filename);

    if (!file_exists($path)) {
        abort(404, 'File not found');
    }

    return response()->file($path, [
        'Content-Type' => 'application/pdf',
    ]);
});
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // User Management Routes (Manager only)
    Route::middleware('can:manage-users')->group(function () {

    });
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Employee-only routes
    Route::middleware(['role:employee'])->group(function () {
        Route::get('submissions/create', [SubmissionController::class, 'create'])->name('submissions.create');
        Route::post('submissions', [SubmissionController::class, 'store'])->name('submissions.store');
  
    });
 Route::get('/submissions/division', [SubmissionController::class, 'forDivision'])
    ->name('submissions.forDivision');

    // Common submission routes for both employees and managers
    Route::middleware(['auth'])->group(function () {
        Route::resource('submissions', SubmissionController::class)->only(['index', 'show']);
        Route::get('submissions/{submission}/file', [SubmissionController::class, 'file'])->name('submissions.file');
    });

    // Manager-only routes
   Route::middleware(['auth'])->group(function () {
    Route::post('submissions/{submission}/approve', [SubmissionController::class, 'approve'])->name('submissions.approve');
    Route::post('submissions/{submission}/reject', [SubmissionController::class, 'reject'])->name('submissions.reject');
    Route::post('submissions/{submission}/request-to-next-step', [SubmissionController::class, 'requestToNextStep'])
    ->name('submissions.requestToNextStep');

});

    //admin only
    Route::middleware(['role:admin'])->group(function () {
     Route::get('/divisions', [DivisionController::class, 'index'])->name('divisions.index');
    Route::get('/divisions/create', [DivisionController::class, 'create'])->name('divisions.create');
    Route::post('/divisions', [DivisionController::class, 'store'])->name('divisions.store');
    Route::get('/divisions/{division}/edit', [DivisionController::class, 'edit'])->name('divisions.edit');
    Route::put('/divisions/{division}', [DivisionController::class, 'update'])->name('divisions.update');
    Route::delete('/divisions/{division}', [DivisionController::class, 'destroy'])->name('divisions.destroy');
       Route::get('/workflows', [WorkflowController::class, 'index'])->name('workflows.index');
    Route::post('/workflows', [WorkflowController::class, 'store'])->name('workflows.store');
    Route::put('/workflows/{workflow}', [WorkflowController::class, 'update'])->name('workflows.update');
    Route::delete('/workflows/{workflow}', [WorkflowController::class, 'destroy'])->name('workflows.destroy');

 });
});

require __DIR__.'/auth.php';
