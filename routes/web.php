<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubdivisionController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\WorkflowStepPermissionController;
use App\Models\Document;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Login page
Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// PDF view
Route::get('/view-pdf/{filename}', function ($filename) {
    $path = storage_path('app/private/submission/' . $filename);

    if (!file_exists($path)) {
        abort(404, 'File not found');
    }

    return response()->file($path, [
        'Content-Type' => 'application/pdf',
    ]);
});

// Dashboard
Route::get('/dashboard', function () {
    $user = Auth::user();

    // Statistik spesifik untuk user yang login
    // 1) Total pengajuan yang dibuat oleh user ini
    $totalSubmission = \App\Models\Submission::where('user_id', $user->id)->count();

    // 2) Menunggu persetujuan oleh user/divisi ini
    //    - current step dimiliki oleh divisi user
    //    - step saat ini statusnya pending pada SubmissionWorkflowStep
    //    - subdivision user memiliki can_approve pada step tersebut
    $waitingApproval = \App\Models\Submission::query()
        ->whereNotNull('workflow_id')
        ->whereHas('workflow.steps', function ($q) use ($user) {
            $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
              ->where('workflow_steps.division_id', $user->division_id)
              ->when($user->subdivision_id, function ($qp) use ($user) {
                  $qp->whereHas('permissions', function ($qq) use ($user) {
                      $qq->where('subdivision_id', $user->subdivision_id)
                         ->where('can_approve', true);
                  });
              });
        })
        ->whereHas('workflowSteps', function ($q) {
            $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
              ->where('submission_workflow_steps.status', 'pending');
        })
        ->count();

    // 3) Total disetujui oleh user ini (berdasarkan step yang ia approve)
    $approvedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
        ->where('status', 'approved')
        ->count();

    // 4) Total ditolak oleh user ini
    $rejectedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
        ->where('status', 'rejected')
        ->count();

    // Preview 5 item yang menunggu persetujuan (untuk alert/notification)
    $pendingItems = Submission::query()
        ->select(['id', 'title', 'current_step', 'status'])
        ->whereNotNull('workflow_id')
        ->whereHas('workflow.steps', function ($q) use ($user) {
            $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
              ->where('workflow_steps.division_id', $user->division_id)
              ->when($user->subdivision_id, function ($qp) use ($user) {
                  $qp->whereHas('permissions', function ($qq) use ($user) {
                      $qq->where('subdivision_id', $user->subdivision_id)
                         ->where('can_approve', true);
                  });
              });
        })
        ->whereHas('workflowSteps', function ($q) {
            $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
              ->where('submission_workflow_steps.status', 'pending');
        })
        ->latest()
        ->take(5)
        ->get();

    return Inertia::render('Dashboard', 
    [
        
        'auth' => [
            'user' => $user,
        ],
        'stats' => [
            'total' => $totalSubmission,
            'waiting' => $waitingApproval,
            'approved' => $approvedSubmissions,
            'rejected' => $rejectedSubmissions,
        ],
        'pendingItems' => $pendingItems,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');
// Authenticated routes
Route::middleware(['auth'])->group(function () {

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Employee-only routes
    Route::middleware('role:employee')->group(function () {
        Route::get('submissions/create', [SubmissionController::class, 'create'])->name('submissions.create');
        Route::post('submissions', [SubmissionController::class, 'store'])->name('submissions.store');
    });

    // Submission routes (common)
    Route::get('/submissions/division', [SubmissionController::class, 'forDivision'])->name('submissions.forDivision');
    Route::resource('submissions', SubmissionController::class)->only(['index', 'show']);
    Route::get('submissions/{submission}/file', [SubmissionController::class, 'file'])->name('submissions.file');
    Route::post('submissions/{submission}/request', [SubmissionController::class, 'request'])->name('submissions.request');
    Route::post('submissions/{submission}/request-next', [SubmissionController::class, 'requestNext'])
    ->name('submissions.requestNext');

    // Manager-only routes
        Route::post('submissions/{submission}/approve', [SubmissionController::class, 'approve'])->name('submissions.approve');
        Route::post('submissions/{submission}/reject', [SubmissionController::class, 'reject'])->name('submissions.reject');
        
  

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {

        Route::resource('subdivisions', SubdivisionController::class);

        // User Management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Division Management
        Route::resource('divisions', DivisionController::class);

        // Workflow Management
        Route::resource('workflows', WorkflowController::class);

        // Document Management
        Route::resource('documents', DocumentController::class);



       // Workflow Step Permission Routes
Route::prefix('workflows/{workflow}')->group(function () {
    Route::get('/permissions', [WorkflowStepPermissionController::class, 'index'])
        ->name('workflow-steps.permissions.index');
    Route::post('/permissions', [WorkflowStepPermissionController::class, 'store'])
        ->name('workflow-steps.permissions.store');
});

    });
}); 

require __DIR__.'/auth.php';