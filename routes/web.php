<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubdivisionController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\WorkflowStepPermissionController;
use App\Http\Controllers\GlobalPermissionController;
use App\Http\Controllers\VerificationController;
use App\Models\Document;
use App\Models\Submission;
use App\Models\SubmissionWorkflowStep;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\SubdivisionPermission;

// Login page
Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Public verification route (no auth)
Route::get('/verify/{token}', [VerificationController::class, 'show'])
    ->name('verification.show')
    ->middleware('throttle:30,1');

// Compatibility path: /submissions/verify/{token} -> redirect ke /verify/{token}
Route::get('/submissions/verify/{token}', function (string $token) {
    return redirect()->route('verification.show', $token);
})->middleware('throttle:30,1');

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
    $totalSubmission = Submission::where('user_id', $user->id)->count();

    // 2) Menunggu persetujuan oleh user/divisi ini (pakai permission global)
    $canApproveGlobal = $user->role === 'admin' ? true : ($user->subdivision_id
        ? (bool) SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->value('can_approve')
        : false);

    $waitingApproval = 0;
    if ($canApproveGlobal) {
        $waitingApprovalQuery = Submission::query()
            ->whereNotNull('workflow_id')
            ->whereHas('workflow.steps', function ($q) use ($user) {
                $q->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                if ($user->role !== 'admin') {
                    $q->where('workflow_steps.division_id', $user->division_id);
                }
            })
            ->whereHas('workflowSteps', function ($q) {
                $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
                  ->where('submission_workflow_steps.status', 'pending');
            });
        $waitingApproval = $waitingApprovalQuery->count();
    }

    // 3) Total disetujui oleh user ini (berdasarkan step yang ia approve)
    $approvedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
        ->where('status', 'approved')
        ->count();

    // 4) Total ditolak oleh user ini
    $rejectedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
        ->where('status', 'rejected')
        ->count();

    // Preview 5 item yang menunggu persetujuan (untuk alert/notification)
    $pendingItems = collect();
    if ($canApproveGlobal) {
        $pendingItemsQuery = Submission::query()
            ->select(['id', 'title', 'current_step', 'status'])
            ->whereNotNull('workflow_id')
            ->whereHas('workflow.steps', function ($q) use ($user) {
                $q->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                if ($user->role !== 'admin') {
                    $q->where('workflow_steps.division_id', $user->division_id);
                }
            })
            ->whereHas('workflowSteps', function ($q) {
                $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
                  ->where('submission_workflow_steps.status', 'pending');
            })
            ->latest()
            ->take(5);
        $pendingItems = $pendingItemsQuery->get();
    }

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
    Route::get('/submissions', [SubmissionController::class, 'index'])->name('submissions.index');
    Route::get('/submissions/for-division', [SubmissionController::class, 'forDivision'])->name('submissions.for-division');
    Route::get('/submissions/history', [SubmissionController::class, 'history'])->name('submissions.history');
    Route::resource('submissions', SubmissionController::class)->only(['show', 'edit', 'update', 'destroy']);
    Route::get('submissions/{submission}/file', [SubmissionController::class, 'file'])->name('submissions.file');
    Route::get('submissions/{submission}/download', [SubmissionController::class, 'download'])->name('submissions.download');
    Route::get('submissions/{submission}/print', [SubmissionController::class, 'printDocument'])->name('submissions.printDocument');
    Route::post('submissions/{submission}/request', [SubmissionController::class, 'request'])->name('submissions.request');
    Route::post('submissions/{submission}/request-next', [SubmissionController::class, 'requestNext'])
    ->name('submissions.requestNext');

    // Manager-only routes
        Route::post('submissions/{submission}/approve', [SubmissionController::class, 'approve'])->name('submissions.approve');
        Route::post('submissions/{submission}/reject', [SubmissionController::class, 'reject'])->name('submissions.reject');
        
  

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
  // Admin Dashboard
    Route::get('/admin/dashboard', function () {
        $stats = [
            'users' => User::count(),
            'submissions' => Submission::count(),
            'today_activities' => Submission::whereDate('created_at', today())->count(),
            'recentActivities' => Submission::latest()
                ->take(5)
                ->get()
                ->map(fn ($s) => [
                    'user' => $s->user->name ?? 'Unknown',
                    'action' => 'membuat atau mengubah pengajuan "' . $s->title . '"',
                    'time' => $s->created_at->diffForHumans(),
                ]),
        ];

        return Inertia::render('AdminDashboard', [
            'auth' => [
                'user' => Auth::user(),
            ],
            'stats' => $stats,
        ]);
    })->name('Admindashboard');
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
        // Document Type Fields management
        Route::post('documents/{document}/fields', [DocumentController::class, 'addField'])->name('documents.fields.store');
        Route::put('documents/{document}/fields/{field}', [DocumentController::class, 'updateField'])->name('documents.fields.update');
        Route::delete('documents/{document}/fields/{field}', [DocumentController::class, 'deleteField'])->name('documents.fields.destroy');

        // Document Name Series management
        Route::post('documents/{document}/name-series', [DocumentController::class, 'updateNameSeries'])->name('documents.nameSeries.update');
        Route::post('documents/{document}/name-series/reset', [DocumentController::class, 'resetNameSeries'])->name('documents.nameSeries.reset');

        // Global Subdivision Permissions
        Route::get('/global-permissions', [GlobalPermissionController::class, 'index'])->name('global-permissions.index');
        Route::post('/global-permissions', [GlobalPermissionController::class, 'store'])->name('global-permissions.store');

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