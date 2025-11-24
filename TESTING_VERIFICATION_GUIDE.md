# Testing Guide - Backend Optimization Verification

## 🚀 How to Test Performance Improvements

### Prerequisites

1. Install Laravel Debugbar (jika belum):

```bash
composer require barryvdh/laravel-debugbar --dev
```

2. Ensure `.env` has:

```env
APP_DEBUG=true
DEBUGBAR_ENABLED=true
```

3. Clear cache:

```bash
php artisan cache:clear
php artisan config:clear
```

4. Start development server:

```bash
php artisan serve
```

---

## ✅ Test 1: Dashboard Performance (MOST IMPORTANT)

### Before Optimization

-   Expected: 10+ database queries
-   Load time: 2-3 seconds
-   Multiple separate SELECT statements

### After Optimization

-   Expected: 3-4 queries (70% reduction)
-   Load time: 500-800ms (65% faster)
-   Combined queries

### How to Test:

```
1. Open browser: http://localhost:8000
2. Login dengan user credentials
3. Go to: Dashboard page
4. Open Developer Tools → Network tab
5. Look at bottom for "Query Count" in Debugbar
6. Check "Timeline" untuk load time
```

### What to Look For:

✅ **Debugbar Panel (bottom right of page)**

-   Click "Queries" tab
-   Count total queries: Should be 3-4 (was 10+)
-   Check "Timeline" - Should be 200-400ms total (was 1500-2000ms)

📊 **Example Output:**

```
Queries: 4
Time: 347ms
Database Connection: mysql
Executed: 1.24 ms (avg)
```

---

## ✅ Test 2: Submission List Performance

### Route: `/submissions` (History/Completed)

### Before:

-   10+ queries
-   Load time: 1.5-2 seconds
-   Complex eager loading

### After:

-   2-3 queries (80% reduction)
-   Load time: 300-500ms
-   Optimized eager loading

### How to Test:

```
1. Go to: http://localhost:8000/submissions
2. Open Debugbar → Queries tab
3. Count queries: Should be 2-3
4. Check timeline: Should be 150-300ms
```

---

## ✅ Test 3: For Division (Approval List)

### Route: `/submissions/for-division`

### Before:

-   15+ queries
-   Load time: 2-3 seconds
-   WhereHas dengan multiple joins

### After:

-   4-5 queries (70% reduction)
-   Load time: 600-900ms
-   Optimized with indexes

### How to Test:

```
1. Go to: http://localhost:8000/submissions/for-division
2. Check Debugbar for queries
3. Expected: 4-5 queries (down from 15+)
4. Time should be <1 second
```

---

## ✅ Test 4: Permission Caching

### How to Verify:

```
1. Open http://localhost:8000/submissions
2. Debugbar → Database tab
3. Look for queries dengan pattern:
   SELECT * FROM subdivision_permissions WHERE subdivision_id = ?

   Expected:
   - First page load: 1 query (hits database)
   - Subsequent actions: 0 queries (from cache for 1 hour)
```

### Manual Check dengan Tinker:

```bash
php artisan tinker

# Test cache
$permService = app(App\Services\PermissionCacheService::class);
DB::enableQueryLog();
$perm1 = $permService->hasPermission(1, 'can_view');
echo "First call queries: " . count(DB::getQueryLog());

DB::flushQueryLog();
$perm2 = $permService->hasPermission(1, 'can_view');
echo "Second call queries: " . count(DB::getQueryLog());
# Expected: First = 1, Second = 0
```

---

## ✅ Test 5: Database Indexes

### How to Verify Indexes Created:

```bash
php artisan tinker

# Check submissions table indexes
$indexes = DB::select("SHOW INDEXES FROM submissions WHERE Key_name LIKE 'idx_%'");
echo "Submissions indexes: " . count($indexes);
# Expected: 11+ indexes

# Check workflow_steps indexes
$indexes = DB::select("SHOW INDEXES FROM workflow_steps WHERE Key_name LIKE 'idx_%'");
echo "WorkflowSteps indexes: " . count($indexes);
# Expected: 3+ indexes

# Check users indexes
$indexes = DB::select("SHOW INDEXES FROM users WHERE Key_name LIKE 'idx_%'");
echo "Users indexes: " . count($indexes);
# Expected: 4+ indexes
```

Or via MySQL directly:

```sql
SHOW INDEXES FROM submissions;
# Should show: idx_submissions_user_id, idx_submissions_division_id, dll
```

---

## ✅ Test 6: Response Payload Size

### How to Check:

```
1. Open Developer Tools → Network tab
2. Refresh page
3. Look at XHR requests (API responses)
4. Check "Size" column

Expected:
- Before: 300-500KB
- After: 50-150KB (60-80% reduction)
```

### Example:

```
GET /submissions
  - Before: 450KB
  - After: 85KB ✓

GET /submissions/for-division
  - Before: 520KB
  - After: 120KB ✓
```

---

## ✅ Test 7: Service Layer Functionality

### Verify Services Load Correctly:

```bash
php artisan tinker

# Test PermissionCacheService
$permService = app(App\Services\PermissionCacheService::class);
echo $permService->hasPermission(1, 'can_view') ? "✓" : "✗";

# Test SubmissionQueryService
$queryService = app(App\Services\SubmissionQueryService::class);
echo "Query service loaded ✓";

# Test SubmissionListService
$listService = app(App\Services\SubmissionListService::class);
echo "List service loaded ✓";

# Test DashboardStatsService
$dashService = app(App\Services\DashboardStatsService::class);
$stats = $dashService->getStats(auth()->user());
echo "Dashboard stats: " . json_encode($stats);
```

---

## ✅ Test 8: Check Model Scopes

### Verify Submission Model Scopes:

```bash
php artisan tinker

# Test scopes
$active = App\Models\Submission::active()->count();
echo "Active submissions: " . $active;

$completed = App\Models\Submission::completed()->count();
echo "Completed submissions: " . $completed;

$byUser = App\Models\Submission::byUser(auth()->id())->count();
echo "User submissions: " . $byUser;

# All should work without errors ✓
```

---

## 📊 Performance Comparison Template

```
╔════════════════════════════════════════════════════════════╗
║        PERFORMANCE IMPROVEMENT VERIFICATION REPORT         ║
╚════════════════════════════════════════════════════════════╝

Dashboard:
  Queries:     Before: 10+ → After: ___  (Reduction: ___%)
  Load Time:   Before: 2-3s → After: ___ (Faster by: ___%)
  Payload:     Before: 500KB → After: ___ (Reduction: ___%)
  Status:      ✓ / ✗

Submissions List:
  Queries:     Before: 10+ → After: ___  (Reduction: ___%)
  Load Time:   Before: 1.5-2s → After: ___ (Faster by: ___%)
  Payload:     Before: 300KB → After: ___ (Reduction: ___%)
  Status:      ✓ / ✗

For Division:
  Queries:     Before: 15+ → After: ___  (Reduction: ___%)
  Load Time:   Before: 2-3s → After: ___ (Faster by: ___%)
  Payload:     Before: 450KB → After: ___ (Reduction: ___%)
  Status:      ✓ / ✗

Permission Caching:
  First call:  ___ queries
  Next calls:  ___ queries (should be 0)
  Status:      ✓ / ✗

Database Indexes:
  Submissions:      ___ indexes (expected: 11+)
  Users:            ___ indexes (expected: 4+)
  WorkflowSteps:    ___ indexes (expected: 3+)
  Status:           ✓ / ✗

Services Functionality:
  PermissionCacheService:  ✓ / ✗
  SubmissionQueryService:  ✓ / ✗
  SubmissionListService:   ✓ / ✗
  DashboardStatsService:   ✓ / ✗

Overall Status:  ✓ PASSED / ✗ ISSUES
```

---

## 🐛 Troubleshooting

### Issue: Queries tidak berkurang

**Solution:**

-   Clear cache: `php artisan cache:clear`
-   Check if migration ran: `php artisan migrate:status`
-   Verify indexes exist: `SHOW INDEXES FROM submissions`

### Issue: Services not found

**Solution:**

-   Check files exist: `ls app/Services/`
-   Run composer dump: `composer dump-autoload`
-   Clear config cache: `php artisan config:clear`

### Issue: Debugbar tidak muncul

**Solution:**

-   Install: `composer require barryvdh/laravel-debugbar --dev`
-   Check `.env`: `APP_DEBUG=true`
-   Clear cache: `php artisan cache:clear`

### Issue: Performance belum meningkat

**Possible Causes:**

-   Migration belum run - check: `php artisan migrate:status`
-   Cache belum active - check: `php artisan config:cache`
-   Old queries masih tertanam - check controller code
-   Database connection slow - check: `php artisan tinker` → `DB::getQueryLog()`

---

## ✨ Expected Results After Optimization

| Page         | Queries | Time        | Status |
| ------------ | ------- | ----------- | ------ |
| Dashboard    | 3-4 ✓   | 400-600ms ✓ | FAST   |
| Submissions  | 2-3 ✓   | 300-500ms ✓ | FAST   |
| For Division | 4-5 ✓   | 600-800ms ✓ | FAST   |
| Approval     | 2-3 ✓   | 300-400ms ✓ | FAST   |

---

## 🎯 Sign-off Checklist

After testing, verify:

-   [ ] Dashboard queries < 5
-   [ ] Dashboard load time < 1 second
-   [ ] Permission caching works (0 queries on repeat)
-   [ ] Database indexes created (11+ on submissions)
-   [ ] Response payloads < 200KB
-   [ ] All services load without errors
-   [ ] Model scopes work correctly
-   [ ] No errors in logs/console

**Once all boxes checked: ✅ OPTIMIZATION SUCCESSFUL!**
