<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubdivisionController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkflowController;
// use App\Http\Controllers\WorkflowStepPermissionController; // deprecated
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
use Illuminate\Support\Facades\Cache;

// CSRF Token Refresh Endpoint
Route::get('/csrf-token', function () {
    return response()->json([
        'token' => csrf_token()
    ]);
})->middleware('web');

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
    $role = strtolower((string) $user->role);

    // Permission global untuk banner alert (tetap)
    $canApproveGlobal = $user->role === 'admin' ? true : ($user->subdivision_id
        ? (bool) SubdivisionPermission::where('subdivision_id', $user->subdivision_id)->value('can_approve')
        : false);

    if ($role === 'direktur') {
        // Direktur: hitung yang menunggu action Direktur pada step saat ini
        $totalSubmission = 0; // tidak ditampilkan untuk direktur
        $waitingApproval = Submission::query()
            ->whereNotNull('workflow_id')
            ->whereHas('workflow.steps', function ($q) use ($user) {
                $q->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                  ->where(function ($w) use ($user) {
                      $w->where('workflow_steps.division_id', $user->division_id)
                        ->orWhereRaw('LOWER(workflow_steps.role) LIKE ?', ['%direktur%']);
                  });
            })
            ->whereHas('workflowSteps', function ($q) {
                $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
                  ->where('submission_workflow_steps.status', 'pending');
            })
            ->count();

        // Direktur: total yang ia setujui/ditolak berdasarkan aksi pribadi
        $approvedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
            ->where('status', 'approved')
            ->count();
        $rejectedSubmissions = SubmissionWorkflowStep::where('approver_id', $user->id)
            ->where('status', 'rejected')
            ->count();
    } else {
        // User biasa: statistik hanya dari pengajuan yang ia buat
        $totalSubmission = Submission::where('user_id', $user->id)->count();
        $waitingApproval = Submission::where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) NOT LIKE ?', ['%approved%'])
                  ->whereRaw('LOWER(status) NOT LIKE ?', ['%rejected%']);
            })
            ->count();
        $approvedSubmissions = Submission::where('user_id', $user->id)
            ->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
            ->count();
        $rejectedSubmissions = Submission::where('user_id', $user->id)
            ->whereRaw('LOWER(status) LIKE ?', ['%rejected%'])
            ->count();
    }

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
        'canApprove' => $canApproveGlobal,
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

    // Notifications endpoint for header bell popover (supports limit & since)
    Route::get('/notifications', function () {
        $user = Auth::user();
        $limit = (int) request('limit', 10);
        $since = request('since'); // ISO string or null

        // Server-side last read & clear markers in cache (per user)
        $cacheKeyRead = 'notif:last_read:' . $user->id;
        $cacheKeyClear = 'notif:clear_until:' . $user->id;
        $lastReadAt = Cache::get($cacheKeyRead); // string|Carbon|null
        $clearUntil = Cache::get($cacheKeyClear); // string|Carbon|null

        // Normalize cached values to Carbon for reliable DB comparisons
        if (is_string($lastReadAt)) {
            try { $lastReadAt = \Carbon\Carbon::parse($lastReadAt); } catch (\Exception $e) { $lastReadAt = null; }
        }
        if (is_string($clearUntil)) {
            try { $clearUntil = \Carbon\Carbon::parse($clearUntil); } catch (\Exception $e) { $clearUntil = null; }
        }

        $sinceTime = null;
        try { if ($since) { $sinceTime = \Carbon\Carbon::parse($since); } } catch (\Exception $e) { $sinceTime = null; }

        $items = collect();

        // 1) Tasks awaiting user's action (approver for current step)
        $pendingForMeBase = Submission::query()
            ->select(['id', 'title', 'status', 'updated_at'])
            ->whereNotNull('workflow_id')
            ->whereHas('workflow.steps', function ($q) use ($user) {
                $q->whereColumn('workflow_steps.step_order', 'submissions.current_step');
                if ($user->role !== 'admin') {
                    $q->where(function ($w) use ($user) {
                        $w->where('workflow_steps.division_id', $user->division_id)
                          ->orWhereRaw('LOWER(workflow_steps.role) LIKE ?', ['%direktur%']);
                    });
                }
            })
            ->whereHas('workflowSteps', function ($q) {
                $q->whereColumn('submission_workflow_steps.step_order', 'submissions.current_step')
                  ->where('submission_workflow_steps.status', 'pending');
            })
            ->when($clearUntil, fn($q) => $q->where('updated_at', '>', $clearUntil))
            ->when($sinceTime, fn($q) => $q->where('updated_at', '>', $sinceTime))
            ->with(['user:id,name'])
            ->latest();

        $pendingForMe = $pendingForMeBase->get()->map(function ($s) {
            $by = $s->user?->name ? (' dari ' . $s->user->name) : '';
            return [
                'icon' => '⏳',
                'message' => 'Pengajuan ' . ($s->title ?: 'Tanpa Judul') . $by . ' menunggu persetujuan Anda.',
                'timestamp' => optional($s->updated_at)->toIso8601String(),
                'relative' => optional($s->updated_at)->diffForHumans(),
            ];
        });

        $items = $items->concat($pendingForMe);

        // 2) Status updates for user's own submissions (approved/rejected)
        $myStatusBase = Submission::query()
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%']);
            })
            ->when($clearUntil, fn($q) => $q->where('updated_at', '>', $clearUntil))
            ->when($sinceTime, fn($q) => $q->where('updated_at', '>', $sinceTime))
            ->select(['id', 'title', 'status', 'updated_at'])
            ->latest('updated_at');

        $myStatus = $myStatusBase->get()->map(function ($s) {
            $status = strtolower((string) $s->status);
            if (str_contains($status, 'approved')) {
                $icon = '✔️';
                $msg = 'Pengajuan Anda disetujui' . (str_contains($s->status, 'Approved by') ? (' ' . $s->status) : '.');
            } else {
                $icon = '❌';
                $msg = 'Pengajuan ditolak.';
            }
            return [
                'icon' => $icon,
                'message' => $msg,
                'timestamp' => optional($s->updated_at)->toIso8601String(),
                'relative' => optional($s->updated_at)->diffForHumans(),
            ];
        });

        $items = $items->concat($myStatus)->sortByDesc('timestamp')->values();

        $totalCount = $items->count();

        // Compute new_count vs lastReadAt (server-side)
        $lastRead = $lastReadAt instanceof \Carbon\Carbon ? $lastReadAt : ($lastReadAt ? \Carbon\Carbon::parse($lastReadAt) : null);
        $newCount = $lastRead
            ? $items->filter(fn($i) => \Carbon\Carbon::parse($i['timestamp'])->gt($lastRead))->count()
            : $totalCount;

        // Apply limit for dropdown
        if ($limit > 0) {
            $items = $items->take($limit)->values();
        }

        return response()->json([
            'items' => $items,
            'total_count' => $totalCount,
            'new_count' => $newCount,
            'server_time' => now()->toIso8601String(),
        ]);
    })->name('notifications.index');

    // Mark notifications as read (update last_read in cache)
    Route::post('/notifications/read', function () {
        $user = Auth::user();
        $ts = request('ts') ?: now();
        try { $tsC = is_string($ts) ? \Carbon\Carbon::parse($ts) : $ts; } catch (\Exception $e) { $tsC = now(); }
        Cache::put('notif:last_read:' . $user->id, $tsC, now()->addDays(7));
        return response()->json(['ok' => true]);
    })->name('notifications.read');

    // Clear notifications (suppress old items by setting clear_until)
    Route::post('/notifications/clear', function () {
        $user = Auth::user();
        $ts = request('ts') ?: now();
        try { $tsC = is_string($ts) ? \Carbon\Carbon::parse($ts) : $ts; } catch (\Exception $e) { $tsC = now(); }
        Cache::put('notif:clear_until:' . $user->id, $tsC, now()->addDays(7));
        // Also mark as read
        Cache::put('notif:last_read:' . $user->id, $tsC, now()->addDays(7));
        return response()->json(['ok' => true]);
    })->name('notifications.clear');

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

       // Deprecated Workflow Step Permission routes removed

    });
}); 

require __DIR__.'/auth.php';