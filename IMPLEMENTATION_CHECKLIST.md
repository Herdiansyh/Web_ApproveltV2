# Backend Performance Optimization - Implementation Checklist

**Version:** 1.0  
**Date Started:** November 20, 2025

---

## 📋 Pre-Implementation Review

### Code Files Created/Modified

#### ✅ NEW SERVICE FILES (4 files)

-   [ ] `app/Services/PermissionCacheService.php`

    -   [ ] Check: Constructor dengan cache service
    -   [ ] Check: `getPermissionForSubdivision()` method
    -   [ ] Check: `hasPermission()` method
    -   [ ] Check: `getMultiplePermissions()` method
    -   [ ] Check: Flush methods ada
    -   [ ] Check: TTL configuration (3600 seconds)

-   [ ] `app/Services/SubmissionQueryService.php`

    -   [ ] Check: Base relations defined
    -   [ ] Check: List relations dengan select() statements
    -   [ ] Check: Detail relations lengkap
    -   [ ] Check: `baseQuery()`, `listQuery()`, `detailQuery()` methods
    -   [ ] Check: Filter methods ada (user, division, status)
    -   [ ] Check: Select methods untuk stats dan list

-   [ ] `app/Services/SubmissionListService.php`

    -   [ ] Check: Dependency injection services
    -   [ ] Check: `getCompletedSubmissionsForUser()` method
    -   [ ] Check: `getActiveSubmissionsForDivision()` method
    -   [ ] Check: `getSubmissionDetail()` method
    -   [ ] Check: `getSubmissionForEdit()` method
    -   [ ] Check: `formatForInertia()` method

-   [ ] `app/Services/DashboardStatsService.php`
    -   [ ] Check: PermissionCacheService injection
    -   [ ] Check: `getStats()` returns correct array
    -   [ ] Check: `getPendingItems()` returns collection
    -   [ ] Check: Combined queries (tidak separate)

#### ✅ UPDATED MODEL FILES

-   [ ] `app/Models/Submission.php`
    -   [ ] ✅ Remove: `protected $with = [...]` (DONE)
    -   [ ] ✅ Add: `scopeActive()` (DONE)
    -   [ ] ✅ Add: `scopeCompleted()` (DONE)
    -   [ ] ✅ Add: `scopePending()` (DONE)
    -   [ ] ✅ Add: `scopeOfWorkflow()` (DONE)
    -   [ ] ✅ Add: `scopeOfDivision()` (DONE)
    -   [ ] ✅ Add: `scopeByUser()` (DONE)
    -   [ ] Check: Relasi masih ada (user, workflow, approver, etc)
    -   [ ] Check: Division relation ditambah

#### ✅ UPDATED POLICY FILES

-   [ ] `app/Policies/SubmissionPolicy.php`
    -   [ ] ✅ Inject: PermissionCacheService (DONE)
    -   [ ] ✅ Update: `view()` method (DONE)
    -   [ ] ✅ Update: `approve()` method (DONE)
    -   [ ] ✅ Update: `reject()` method (DONE)
    -   [ ] ✅ Update: `update()` method (DONE)
    -   [ ] ✅ Update: `delete()` method (DONE)
    -   [ ] Check: No more `SubdivisionPermission::where()` queries
    -   [ ] Check: All permission checks use service

#### ✅ DATABASE MIGRATION

-   [ ] `database/migrations/2025_11_20_000000_add_performance_indexes.php`
    -   [ ] Check: Submissions table indexes (11 indexes)
    -   [ ] Check: Users table indexes (4 indexes)
    -   [ ] Check: Workflows table indexes (3 indexes)
    -   [ ] Check: WorkflowSteps indexes (3 indexes)
    -   [ ] Check: SubmissionWorkflowSteps indexes (6 indexes)
    -   [ ] Check: SubdivisionPermissions index
    -   [ ] Check: Documents, Divisions, Subdivisions indexes
    -   [ ] Check: Approvals, SubmissionFiles indexes
    -   [ ] Check: Down() method dengan drop indexes

#### ✅ REFERENCE IMPLEMENTATION

-   [ ] `app/Http/Controllers/SubmissionControllerOptimized.php`
    -   [ ] Check: Service injection di constructor
    -   [ ] Check: `index()` method menggunakan service
    -   [ ] Check: `forDivision()` method menggunakan service
    -   [ ] Check: `show()` method menggunakan service
    -   [ ] Check: `edit()` method menggunakan service
    -   [ ] Check: `update()` method optimal
    -   [ ] Check: `destroy()` method minimal load
    -   [ ] Check: `approve()` method contoh

#### ✅ DOCUMENTATION

-   [ ] `PERFORMANCE_OPTIMIZATION.md` (200+ lines)

    -   [ ] Check: Overview section
    -   [ ] Check: Database indexes documented
    -   [ ] Check: Service layer documentation
    -   [ ] Check: Query optimization examples
    -   [ ] Check: Permission caching explanation
    -   [ ] Check: Model optimization
    -   [ ] Check: Controller improvements
    -   [ ] Check: Response optimization
    -   [ ] Check: Caching strategy
    -   [ ] Check: Migration guide
    -   [ ] Check: Best practices
    -   [ ] Check: Troubleshooting

-   [ ] `OPTIMIZATION_IMPLEMENTATION_SUMMARY.md`
    -   [ ] Check: Deliverables summary
    -   [ ] Check: Key improvements table
    -   [ ] Check: Implementation steps
    -   [ ] Check: Service descriptions
    -   [ ] Check: Expected results

---

## 🚀 Phase 1: Setup & Integration (Day 1)

### 1. Copy Service Files

```bash
# Verify services exist
ls -la app/Services/
# Should list:
# - PermissionCacheService.php
# - SubmissionQueryService.php
# - SubmissionListService.php
# - DashboardStatsService.php
```

-   [ ] All 4 service files copied
-   [ ] File permissions correct
-   [ ] No syntax errors: `php artisan tinker` → `exit`

### 2. Database Migration

```bash
# Run migration
php artisan migrate

# Verify migration ran
php artisan migrate:status
```

-   [ ] Migration shows as `Batch 1` or latest batch
-   [ ] No errors during migration
-   [ ] Check indexes created:

    ```bash
    # For MySQL
    SHOW INDEXES FROM submissions;

    # Should see 11 indexes
    ```

### 3. Update Models

```bash
# Check Submission model
php artisan tinker
> $s = App\Models\Submission::first();
> # Should work without 'protected $with'
```

-   [ ] `Submission.php` updated (removed `protected $with`)
-   [ ] Scopes accessible: `Submission::active()->count()`
-   [ ] No SQL errors

### 4. Update Policies

```bash
# Check if SubmissionPolicy can be instantiated
php artisan tinker
> $policy = app()->makeWith(App\Policies\SubmissionPolicy::class);
> # Should not error on dependency injection
```

-   [ ] `SubmissionPolicy.php` updated with service injection
-   [ ] No errors when authorizing: `$user->can('view', $submission)`

### 5. Test Service Layer

```bash
php artisan tinker

# Test PermissionCacheService
> $permService = app(App\Services\PermissionCacheService::class);
> $perms = $permService->getMultiplePermissions(1, ['can_view', 'can_approve']);
> dd($perms);

# Test SubmissionQueryService
> $queryService = app(App\Services\SubmissionQueryService::class);
> $subs = $queryService->listQuery()->take(5)->get();
> dd($subs->count());

# Test SubmissionListService
> $listService = app(App\Services\SubmissionListService::class);
> $user = App\Models\User::find(1);
> $completed = $listService->getCompletedSubmissionsForUser($user);
> dd($completed->count());

# Test DashboardStatsService
> $statsService = app(App\Services\DashboardStatsService::class);
> $stats = $statsService->getStats($user);
> dd($stats);
```

-   [ ] PermissionCacheService works
-   [ ] SubmissionQueryService works
-   [ ] SubmissionListService works
-   [ ] DashboardStatsService works
-   [ ] No errors in all tests above

---

## 🧪 Phase 2: Controller Updates (Day 2-3)

### Update SubmissionController

Gunakan `SubmissionControllerOptimized.php` as reference.

-   [ ] Update `index()` method

    -   [ ] Inject `SubmissionListService`
    -   [ ] Use `getCompletedSubmissionsForUser()`
    -   [ ] Response only needed fields
    -   [ ] Test: `GET /submissions`
    -   [ ] Verify: Query count reduced

-   [ ] Update `forDivision()` method

    -   [ ] Inject `SubmissionListService`
    -   [ ] Use `getActiveSubmissionsForDivision()`
    -   [ ] Include permission from cache
    -   [ ] Test: `GET /submissions/division`
    -   [ ] Verify: Query count reduced

-   [ ] Update `show()` method

    -   [ ] Use `getSubmissionDetail()`
    -   [ ] Include authorization checks
    -   [ ] Test: `GET /submissions/{id}`
    -   [ ] Verify: All relasi loaded

-   [ ] Update `edit()` method

    -   [ ] Use `getSubmissionForEdit()`
    -   [ ] Minimal relasi untuk edit form
    -   [ ] Test: `GET /submissions/{id}/edit`

-   [ ] Update `update()` method

    -   [ ] Minimal model loading
    -   [ ] Efficient update
    -   [ ] Test: `PATCH /submissions/{id}`

-   [ ] Update `destroy()` method
    -   [ ] No unnecessary loading
    -   [ ] Fast delete
    -   [ ] Test: `DELETE /submissions/{id}`

### Test Each Method

```bash
# Test list
GET http://localhost:8000/submissions
GET http://localhost:8000/submissions/division
GET http://localhost:8000/submissions/1
GET http://localhost:8000/submissions/1/edit

# Test updates
PATCH http://localhost:8000/submissions/1
DELETE http://localhost:8000/submissions/1
```

-   [ ] All endpoints respond correctly
-   [ ] No permission errors
-   [ ] No N+1 queries (check Debugbar)

### Update Dashboard Route

Location: `routes/web.php` line ~60

Replace heavy route dengan service:

```php
Route::get('/dashboard', function () {
    $user = Auth::user();
    $statsService = app(App\Services\DashboardStatsService::class);

    return Inertia::render('Dashboard', [
        'stats' => $statsService->getStats($user),
        'pendingItems' => $statsService->getPendingItems($user),
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');
```

-   [ ] Dashboard route updated
-   [ ] Stats service injected
-   [ ] Test: `GET /dashboard`
-   [ ] Verify: Loads fast (should be 500-800ms)

---

## 📊 Phase 3: Testing & Verification (Day 4)

### Query Count Verification

```bash
# Install Laravel Debugbar (if not already)
composer require barryvdh/laravel-debugbar --dev

# Test with Debugbar enabled
# Visit pages dan check "Queries" tab
```

-   [ ] Dashboard: **Before 10+ → After 3-4** queries
-   [ ] Submission List: **Before 15+ → After 2-3** queries
-   [ ] Permission checks: **Before multiple → After 0** (cached)
-   [ ] Detail view: **Before N+1 → After single** eager load

### Performance Benchmarking

```bash
# Check response time
php artisan tinker
> \Illuminate\Support\Facades\DB::enableQueryLog();
> $start = microtime(true);
>
> // Simulate controller action
> $user = App\Models\User::find(1);
> $statsService = app(App\Services\DashboardStatsService::class);
> $stats = $statsService->getStats($user);
>
> $time = (microtime(true) - $start) * 1000;
> echo "Time: {$time}ms\n";
> dd(count(DB::getQueryLog()), 'queries');
```

Expected results:

-   [ ] Dashboard stats: **< 100ms**, **3-4 queries**
-   [ ] Submission list: **< 200ms**, **2-3 queries**
-   [ ] Detail load: **< 150ms**, **1 query with eager load**

### Payload Size Verification

```bash
# Check response size
curl -i http://localhost:8000/submissions 2>&1 | grep Content-Length
```

-   [ ] Submissions list: **< 200KB** (before was 500KB+)
-   [ ] Dashboard: **< 100KB** (before was 300KB+)
-   [ ] Detail view: **< 150KB** (before was 400KB+)

### Unit Tests

```bash
# Create test for services if not exist
php artisan make:test PermissionCacheServiceTest --unit
php artisan make:test SubmissionQueryServiceTest --unit
php artisan make:test SubmissionListServiceTest

# Run tests
php artisan test
```

-   [ ] PermissionCacheService tests pass
-   [ ] SubmissionQueryService tests pass
-   [ ] SubmissionListService tests pass
-   [ ] Controller tests pass
-   [ ] Authorization tests pass
-   [ ] All tests: **PASS** ✅

---

## 🔍 Phase 4: Code Review Checklist

### Code Quality

-   [ ] All services have proper type hints
-   [ ] All methods documented with PHPDoc
-   [ ] No hardcoded values (use constants)
-   [ ] Follow PSR-12 coding standards
-   [ ] Proper exception handling
-   [ ] Consistent naming conventions

### Performance

-   [ ] ✅ Query count reduced 70%+
-   [ ] ✅ Response time faster 65%+
-   [ ] ✅ Payload size reduced 60%+
-   [ ] ✅ Permission caching working
-   [ ] ✅ Eager loading optimized
-   [ ] ✅ Database indexes created

### Functionality

-   [ ] Authorization working correctly
-   [ ] Filters working properly
-   [ ] Pagination working
-   [ ] Sorting working
-   [ ] Error handling proper
-   [ ] Edge cases handled

### Documentation

-   [ ] Code comments clear
-   [ ] Methods documented
-   [ ] Usage examples provided
-   [ ] Troubleshooting guide present
-   [ ] Migration guide clear

---

## 🚢 Phase 5: Deployment (Day 5)

### Pre-Deployment

-   [ ] Backup database
-   [ ] All tests passing
-   [ ] Code review completed
-   [ ] Performance verified locally
-   [ ] Documentation complete

### Deployment Steps

```bash
# 1. Pull changes
git pull origin main

# 2. Install/update packages
composer update

# 3. Run migration
php artisan migrate --force

# 4. Clear cache
php artisan cache:clear
php artisan config:clear

# 5. Restart queue worker (if using)
# Kill old workers
# Start new workers: php artisan queue:work

# 6. Monitor logs
tail -f storage/logs/laravel.log
```

-   [ ] Code deployed
-   [ ] Migrations ran successfully
-   [ ] No errors in logs
-   [ ] Services accessible
-   [ ] Cache working

### Post-Deployment Verification

```bash
# Check dashboard still works
curl http://yourapp.com/dashboard

# Check submission endpoints
curl http://yourapp.com/submissions
curl http://yourapp.com/submissions/division

# Monitor performance
# Check APM tool (New Relic, Datadog, etc)
```

-   [ ] All endpoints responding
-   [ ] No 500 errors
-   [ ] Response times good
-   [ ] Permission checks working
-   [ ] Cache hits visible

---

## 📈 Performance Benchmarks

Record actual numbers:

### Before Optimization

| Metric                    | Value     |
| ------------------------- | --------- |
| Dashboard Load Time       | **\_** ms |
| Dashboard Queries         | **\_**    |
| Submission List Load Time | **\_** ms |
| Submission List Queries   | **\_**    |
| Avg Page Payload          | **\_** KB |
| Avg Response Time         | **\_** ms |
| Peak Memory Usage         | **\_** MB |

### After Optimization

| Metric                    | Value     | Change   |
| ------------------------- | --------- | -------- |
| Dashboard Load Time       | **\_** ms | **\_** % |
| Dashboard Queries         | **\_**    | **\_** % |
| Submission List Load Time | **\_** ms | **\_** % |
| Submission List Queries   | **\_**    | **\_** % |
| Avg Page Payload          | **\_** KB | **\_** % |
| Avg Response Time         | **\_** ms | **\_** % |
| Peak Memory Usage         | **\_** MB | **\_** % |

---

## 🎯 Sign-Off

-   [ ] All phases completed
-   [ ] All tests passing
-   [ ] Performance verified
-   [ ] Documentation complete
-   [ ] Deployed to production
-   [ ] Monitoring in place
-   [ ] Team trained

**Completed By:** ********\_********  
**Date:** **********\_\_\_\_**********  
**Notes:** **********\_\_\_\_**********

---

## 📞 Support & Rollback

### If Issues Occur

1. Check error logs:

    ```bash
    tail -f storage/logs/laravel.log
    ```

2. Run diagnostics:

    ```bash
    php artisan tinker
    > App\Models\Submission::active()->count();
    > DB::select("SHOW INDEXES FROM submissions;");
    ```

3. If major issues, rollback:
    ```bash
    php artisan migrate:rollback
    # Revert code changes
    git revert HEAD
    ```

-   [ ] Rollback procedure documented
-   [ ] Emergency contact list available
-   [ ] Backup procedure tested

---

**Status:** Ready for Implementation ✅
