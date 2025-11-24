# Backend Performance Optimization Guide

**Last Updated:** November 20, 2025  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview of Optimizations](#overview)
2. [Database Indexes](#database-indexes)
3. [Service Layer](#service-layer)
4. [Query Optimization](#query-optimization)
5. [Permission Caching](#permission-caching)
6. [Model Optimization](#model-optimization)
7. [Controller Improvements](#controller-improvements)
8. [API Response Optimization](#api-response-optimization)
9. [Caching Strategy](#caching-strategy)
10. [Migration Guide](#migration-guide)

---

## Overview

Optimasi backend aplikasi E-Approval System fokus pada 6 area utama:

### 1. **Database Queries**

-   Menghilangkan N+1 queries dengan eager loading yang tepat
-   Menambah indexes untuk kolom yang sering difilter
-   Menggunakan select() untuk mengambil hanya kolom yang dibutuhkan
-   Memisahkan kompleks queries ke service layer

### 2. **Permission & Authorization**

-   Caching permission untuk menghindari repeated queries ke tabel `subdivision_permissions`
-   Service layer untuk permission checks yang consistent
-   Policy optimization dengan dependency injection

### 3. **Response Optimization**

-   Tidak mengirim relasi yang tidak digunakan ke frontend
-   Formatting response minimal untuk Inertia
-   Lazy loading untuk data yang besar

### 4. **Caching Strategy**

-   Cache untuk data statis (permissions, documents, workflows)
-   TTL 1 jam untuk permission cache
-   Cache invalidation saat data berubah

### 5. **Service Layer**

-   Service untuk submission list queries
-   Service untuk dashboard statistics
-   Service untuk submission edit/detail retrieval

### 6. **Model Improvements**

-   Hapus `protected $with` untuk menghindari over-fetching
-   Tambah scopes untuk reusable query logic
-   Relationship optimization dengan select()

---

## Database Indexes

### Migration: `2025_11_20_000000_add_performance_indexes.php`

Menambah indexes untuk kolom yang sering digunakan dalam:

-   WHERE clauses
-   JOIN conditions
-   ORDER BY
-   Filters

#### Indexes Added:

**Submissions table:**

```
- idx_submissions_user_id
- idx_submissions_division_id
- idx_submissions_workflow_id
- idx_submissions_approved_by
- idx_submissions_document_id
- idx_submissions_status
- idx_submissions_current_step
- idx_submissions_user_status (composite)
- idx_submissions_division_status (composite)
- idx_submissions_workflow_step (composite)
- idx_submissions_created_at
- idx_submissions_verification_token
```

**Users table:**

```
- idx_users_division_id
- idx_users_subdivision_id
- idx_users_role
- idx_users_email (unique)
```

**Workflows & Related:**

```
- idx_workflows_document_id
- idx_workflows_is_active
- idx_workflows_active_document (composite)
- idx_workflow_steps_workflow_id
- idx_workflow_steps_division_id
- idx_workflow_steps_workflow_order (composite)
- idx_subm_wf_steps_submission_id
- idx_subm_wf_steps_approver_id
- idx_subm_wf_steps_step_order
- idx_subm_wf_steps_status
- idx_subm_wf_steps_submission_order (composite)
- idx_subm_wf_steps_approver_status (composite)
```

**Other:**

```
- idx_subdivision_permissions_subdivision_id
- idx_documents_is_active
- idx_divisions_name
- idx_subdivisions_division_id
- idx_subdivisions_name
- idx_approvals_submission_id
- idx_approvals_approver_id
- idx_approvals_status
- idx_submission_files_submission_id
```

### To Apply Migration:

```bash
php artisan migrate
```

---

## Service Layer

### 1. **PermissionCacheService**

Location: `app/Services/PermissionCacheService.php`

Handles permission caching dengan cache lifetime 1 jam (3600 detik).

**Methods:**

```php
// Ambil permission object dengan caching
getPermissionForSubdivision(int $subdivisionId): ?SubdivisionPermission

// Cek single permission
hasPermission(int $subdivisionId, string $permission): bool

// Ambil multiple permissions sekaligus
getMultiplePermissions(int $subdivisionId, array $permissions): array

// Flush cache
flushSubdivisionPermissionCache(int $subdivisionId): void
```

**Usage:**

```php
// Di controller atau policy
$permService = app(PermissionCacheService::class);

// Cek satu permission
if ($permService->hasPermission($user->subdivision_id, 'can_approve')) {
    // lakukan sesuatu
}

// Cek multiple permissions sekaligus (lebih efisien)
$perms = $permService->getMultiplePermissions($user->subdivision_id, [
    'can_view', 'can_approve', 'can_reject'
]);

if ($perms['can_approve']) {
    // approval logic
}
```

### 2. **SubmissionQueryService**

Location: `app/Services/SubmissionQueryService.php`

Manage all submission queries dengan proper eager loading dan select statements.

**Methods:**

```php
// Base query minimal
baseQuery(): Builder

// List view dengan eager loading
listQuery(): Builder

// Detail view dengan semua relasi
detailQuery(): Builder

// Filters
filterByUser(Builder $query, User $user): Builder
filterByDivision(Builder $query, User $user, bool $canViewGlobal): Builder
filterByStatus(Builder $query, string $status): Builder

// Select yang tepat
selectForList(): Builder
selectForStats(): Builder
```

**Usage:**

```php
$queryService = app(SubmissionQueryService::class);

// Get active submissions dengan optimasi
$submissions = $queryService->listQuery()
    ->active()
    ->filterByDivision($user, $canViewGlobal)
    ->latest()
    ->paginate(10);

// Get detail dengan semua relasi
$submission = $queryService->detailQuery()
    ->find($id);
```

### 3. **SubmissionListService**

Location: `app/Services/SubmissionListService.php`

High-level service untuk submission list dengan filtering & permission checks.

**Methods:**

```php
// Get completed submissions (history)
getCompletedSubmissionsForUser(User $user, int $perPage = 10): LengthAwarePaginator

// Get active submissions untuk division
getActiveSubmissionsForDivision(User $user, string $statusFilter = 'all', int $perPage = 10): LengthAwarePaginator

// Get single submission detail
getSubmissionDetail(int $submissionId): ?Submission

// Get submission for edit
getSubmissionForEdit(int $submissionId): ?Submission

// Format untuk Inertia response
formatForInertia(Submission $submission, bool $includeDetails = false): array
```

**Usage:**

```php
$listService = app(SubmissionListService::class);

// Get completed submissions
$completed = $listService->getCompletedSubmissionsForUser($user);

// Get active for approval
$active = $listService->getActiveSubmissionsForDivision($user, 'pending');

// Get detail
$detail = $listService->getSubmissionDetail($id);

// Format for response
$data = $listService->formatForInertia($submission, includeDetails: true);
```

### 4. **DashboardStatsService**

Location: `app/Services/DashboardStatsService.php`

Dashboard statistics calculation dengan minimal queries.

**Methods:**

```php
// Get semua stats dalam satu object
getStats(User $user): array

// Get pending items untuk notification
getPendingItems(User $user, int $limit = 5): Collection
```

**Usage:**

```php
$statsService = app(DashboardStatsService::class);

$stats = $statsService->getStats($user);
// Returns: ['total', 'waiting', 'approved', 'rejected']

$pending = $statsService->getPendingItems($user, limit: 5);
```

---

## Query Optimization

### Eager Loading Best Practices

**❌ JANGAN:**

```php
// Over-fetching dengan protected $with
protected $with = ['user', 'workflow', 'approver', 'currentWorkflowStep'];

// Lazy loading relasi di loop
foreach ($submissions as $s) {
    $s->workflow->document->fields; // Setiap iteration = 1+ query
}
```

**✅ LAKUKAN:**

```php
// Load relasi yang tepat di service
$submissions = Submission::with([
    'user' => fn($q) => $q->select('id', 'name', 'email', 'division_id'),
    'workflow' => fn($q) => $q->select('id', 'name', 'document_id'),
])
->paginate();

// Atau gunakan service
$submissions = $queryService->listQuery()
    ->active()
    ->paginate();
```

### Select Statements

**❌ JANGAN:**

```php
// Ambil semua columns padahal hanya butuh beberapa
$submissions = Submission::get(); // SELECT * ...
```

**✅ LAKUKAN:**

```php
// Hanya kolom yang dibutuhkan
$submissions = Submission::select([
    'id', 'user_id', 'title', 'status', 'created_at'
])->paginate();
```

### Indexes & WHERE Clauses

**❌ JANGAN:**

```php
// Query tanpa index pada kolom filter
Submission::where('some_column', $value)->get();
```

**✅ LAKUKAN:**

```php
// Pastikan kolom memiliki index (lihat migration)
Submission::where('status', $value)
    ->where('user_id', $userId)
    ->get();
```

---

## Permission Caching

### How It Works

```
Request → Check Cache → If Found, Return → If Not, Query DB → Cache Result → Return
```

### Cache Key Format

```
subdivision_permission_:{subdivision_id}

Example: subdivision_permission_5
```

### Cache TTL

Default: **3600 seconds (1 hour)**

Dapat diubah di `PermissionCacheService` line 7:

```php
private const CACHE_TTL = 3600; // ubah nilai ini
```

### Invalidation

Cache otomatis invalid setelah TTL expired. Untuk invalidasi manual:

```php
$permService = app(PermissionCacheService::class);

// Flush cache untuk 1 subdivision
$permService->flushSubdivisionPermissionCache($subdivisionId);

// Flush semua
$permService->flushAllPermissionCache();
```

### Where to Add Invalidation

Saat update `SubdivisionPermission`:

```php
// Di controller atau model observer
public function updatePermission($subdivisionId, $permissions) {
    SubdivisionPermission::where('subdivision_id', $subdivisionId)
        ->update($permissions);

    // Invalidate cache
    app(PermissionCacheService::class)
        ->flushSubdivisionPermissionCache($subdivisionId);
}
```

---

## Model Optimization

### Before: Submission Model

```php
class Submission extends Model
{
    protected $with = ['user', 'workflow', 'approver', 'currentWorkflowStep'];
    // ⚠️ MASALAH: Over-fetching setiap kali query, bahkan untuk list view
}
```

### After: Submission Model

```php
class Submission extends Model
{
    // ✅ PERBAIKAN: Hapus protected $with
    // Load relasi di service layer sesuai kebutuhan

    // Tambah scopes untuk reusable logic
    public function scopeActive($query) {
        return $query->where(function ($q) {
            $q->whereRaw('LOWER(status) NOT LIKE ?', ['%approved%'])
              ->whereRaw('LOWER(status) NOT LIKE ?', ['%rejected%']);
        });
    }

    public function scopeCompleted($query) {
        return $query->where(function ($q) {
            $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
              ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%']);
        });
    }
}
```

### Usage dengan Scopes

```php
// Lebih readable dan reusable
$activeSubmissions = Submission::active()->paginate();
$completedSubmissions = Submission::completed()->paginate();
```

---

## Controller Improvements

### Before: Heavy Dashboard Route

```php
Route::get('/dashboard', function () {
    $user = Auth::user();

    // Multiple separate queries
    $totalSubmission = Submission::where('user_id', $user->id)->count();

    $canApproveGlobal = SubdivisionPermission::where(...)
        ->value('can_approve'); // Query 2

    if ($canApproveGlobal) {
        $waitingApproval = Submission::...->count(); // Query 3
    }

    $approvedSubmissions = SubmissionWorkflowStep::...
        ->count(); // Query 4

    // ... more queries
})->name('dashboard');
```

### After: Optimized Dashboard Route

```php
Route::get('/dashboard', function () {
    $user = Auth::user();

    // Single service call dengan semua stats
    $statsService = app(DashboardStatsService::class);
    $stats = $statsService->getStats($user);

    return Inertia::render('Dashboard', [
        'stats' => $stats, // Hanya data yang dibutuhkan
        'pendingItems' => $statsService->getPendingItems($user),
    ]);
})->name('dashboard');
```

---

## API Response Optimization

### Minimal Data untuk Frontend

**❌ JANGAN:**

```php
// Kirim semua relasi meskipun tidak digunakan
return Inertia::render('Submissions/Index', [
    'submissions' => $submissions->load('user', 'workflow', 'approver', 'files', 'approvals', ...),
    'userDivision' => $user->division,
    'userSubdivision' => $user->subdivision,
    'allDivisions' => Division::all(),
    'allWorkflows' => Workflow::all(),
    // ... banyak data yang tidak perlu
]);
```

**✅ LAKUKAN:**

```php
// Kirim hanya data yang digunakan di page
$submissions = $listService->getCompletedSubmissionsForUser($user);

return Inertia::render('Submissions/Index', [
    'submissions' => $submissions,
    'userDivision' => $user->division->only(['id', 'name']),
]);
```

### Lazy Loading untuk Heavy Data

```php
// Jika ada data besar atau relasi complex, lazy load di frontend
return Inertia::render('Submissions/Show', [
    'submission' => $submission->only([
        'id', 'title', 'status', 'created_at'
    ]),
    // Detail akan di-fetch saat user request via API
]);
```

---

## Caching Strategy

### Static Data Cache

```php
// Workflow list (di controller atau service)
$workflows = Cache::remember('workflows_active', 3600, function () {
    return Workflow::where('is_active', true)
        ->select(['id', 'name', 'document_id'])
        ->get();
});

// Documents
$documents = Cache::remember('documents_active', 3600, function () {
    return Document::where('is_active', true)
        ->select(['id', 'name', 'type'])
        ->get();
});
```

### Invalidate Cache saat Update

```php
public function updateWorkflow($id, $data) {
    $workflow = Workflow::find($id);
    $workflow->update($data);

    // Invalidate cache
    Cache::forget('workflows_active');
}
```

### Cache Configuration

File: `config/cache.php`

```php
'default' => env('CACHE_STORE', 'database'), // Gunakan database driver

'stores' => [
    'database' => [
        'driver' => 'database',
        'connection' => env('CACHE_DB_CONNECTION'),
        'table' => env('CACHE_TABLE', 'cache'),
    ],
]
```

---

## Migration Guide

### Step 1: Apply Database Indexes

```bash
php artisan migrate

# Migration: 2025_11_20_000000_add_performance_indexes.php
```

### Step 2: Update Models

Update `app/Models/Submission.php`:

-   Hapus `protected $with`
-   Tambah scopes (active, completed, pending, etc)
-   Tambah division() relationship

### Step 3: Add Service Layer

Buat files:

-   `app/Services/PermissionCacheService.php`
-   `app/Services/SubmissionQueryService.php`
-   `app/Services/SubmissionListService.php`
-   `app/Services/DashboardStatsService.php`

### Step 4: Update Policies

Update `app/Policies/SubmissionPolicy.php`:

-   Inject `PermissionCacheService`
-   Ganti `SubdivisionPermission` queries dengan service calls

### Step 5: Update Controllers Gradually

Start dengan:

1. Dashboard route → `DashboardStatsService`
2. Submission index → `SubmissionListService`
3. Submission forDivision → `SubmissionListService`
4. Lainnya

### Step 6: Test & Monitor

```bash
# Test dashboard response time
php artisan tinker
# > $user = User::find(1)
# > time { app(DashboardStatsService::class)->getStats($user) }

# Check query count dengan Laravel Debugbar
# composer require barryvdh/laravel-debugbar --dev
```

---

## Performance Metrics

### Expected Improvements

| Metric                  | Before           | After       | Improvement |
| ----------------------- | ---------------- | ----------- | ----------- |
| Dashboard Queries       | 10+              | 3-4         | 60-70% ↓    |
| Submission List Queries | 15+              | 2-3         | 80%+ ↓      |
| Permission Checks       | Query every time | Cached (1h) | 99%+ ↓      |
| Response Payload        | 500KB+           | 100-200KB   | 60-80% ↓    |
| Page Load Time          | 2-3s             | 500-800ms   | 60-75% ↓    |

### Monitoring

Gunakan Laravel Debugbar atau New Relic untuk monitor:

```php
// Di local development
composer require barryvdh/laravel-debugbar --dev

# Atau enable query logging
DB::enableQueryLog();
// ... queries ...
dd(DB::getQueryLog()); // Lihat semua queries
```

---

## Best Practices

### 1. Always Use Service Layer

```php
// ❌ Jangan query langsung di controller
$submissions = Submission::with('user', 'workflow')->paginate();

// ✅ Gunakan service
$listService = app(SubmissionListService::class);
$submissions = $listService->getCompletedSubmissionsForUser($user);
```

### 2. Select Only What You Need

```php
// ❌ SELECT * ...
Submission::get();

// ✅ SELECT id, title, status, created_at
Submission::select(['id', 'title', 'status', 'created_at'])->get();
```

### 3. Use Scopes for Reusable Logic

```php
// ✅ Buat scope untuk query yang sering dipakai
$active = Submission::active()->paginate();
$completed = Submission::completed()->paginate();
$pending = Submission::pending()->paginate();
```

### 4. Cache Permission Checks

```php
// ❌ Query setiap kali
if (SubdivisionPermission::...->exists()) { }

// ✅ Gunakan cache service
$permService = app(PermissionCacheService::class);
if ($permService->hasPermission($subdivisionId, 'can_approve')) { }
```

### 5. Minimize Response Payload

```php
// ❌ Kirim semua data
$submission->load('user', 'workflow', 'files', 'approvals', ...);

// ✅ Format minimal untuk Inertia
$data = $listService->formatForInertia($submission);
```

---

## Troubleshooting

### Query Not Using Index

```bash
# Check query plan
EXPLAIN SELECT * FROM submissions WHERE user_id = 1 AND status = 'pending';
```

### Cache Not Working

```php
// Check cache driver
dd(config('cache.default')); // Pastikan 'database'

// Flush cache
php artisan cache:clear
```

### Permission Cache Stale

Invalidate manual:

```php
app(PermissionCacheService::class)
    ->flushSubdivisionPermissionCache($subdivisionId);
```

---

## Support

Untuk pertanyaan atau issues, konsultasikan dengan tim development atau lihat Laravel documentation:

-   https://laravel.com/docs/queries
-   https://laravel.com/docs/cache
-   https://laravel.com/docs/authorization
