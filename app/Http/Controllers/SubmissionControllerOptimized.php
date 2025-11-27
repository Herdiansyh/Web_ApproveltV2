<?php

namespace App\Http\Controllers;

use App\Jobs\StampPdfOnDecision;
use App\Models\Submission;
use App\Services\SubmissionListService;
use App\Services\PermissionCacheService;
use App\Services\DashboardStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * EXAMPLE: Optimized SubmissionController methods
 * Gunakan ini sebagai referensi untuk mengoptimasi method lain di SubmissionController
 */
class SubmissionControllerOptimized extends Controller
{
    use AuthorizesRequests;

    private SubmissionListService $listService;
    private PermissionCacheService $permissionService;
    private DashboardStatsService $statsService;

    public function __construct(
        SubmissionListService $listService,
        PermissionCacheService $permissionService,
        DashboardStatsService $statsService
    ) {
        $this->listService = $listService;
        $this->permissionService = $permissionService;
        $this->statsService = $statsService;
    }

    /**
     * ✅ OPTIMIZED: List pengajuan yang sudah selesai (history)
     * 
     * SEBELUM:
     * - Multiple eager load dengan relasi besar
     * - Filter logic complex di controller
     * - Loop untuk attach permission info
     * 
     * SESUDAH:
     * - Service handle eager loading yang tepat
     * - Service handle filter logic
     * - Minimal response payload
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Service handle semua logic
        $submissions = $this->listService->getCompletedSubmissionsForUser(
            user: $user,
            perPage: $request->get('per_page', 10)
        );

        // Response minimal, hanya data yang dibutuhkan
        return Inertia::render('Submissions/Index', [
            'submissions' => $submissions,
            'userDivision' => $user->division->only(['id', 'name']),
        ]);
    }

    /**
     * ✅ OPTIMIZED: List pengajuan untuk division review/approval
     * 
     * SEBELUM:
     * - whereHas dengan multiple nested relations
     * - Query permission di loop
     * - Complex filter logic di controller
     * 
     * SESUDAH:
     * - Service handle filtering dengan indexed queries
     * - Permission cache untuk repeated checks
     * - Clean controller code
     */
    public function forDivision(Request $request)
    {
        $user = Auth::user();
        $statusFilter = $request->get('status', 'all');

        // Service handle semua filtering
        $submissions = $this->listService->getActiveSubmissionsForDivision(
            user: $user,
            statusFilter: $statusFilter,
            perPage: $request->get('per_page', 10)
        );

        // Get permission dari cache (bukan query setiap kali)
        $userPermissions = $user->subdivision_id
            ? $this->permissionService->getMultiplePermissions(
                $user->subdivision_id,
                ['can_view', 'can_approve', 'can_reject', 'can_edit', 'can_delete']
            )
            : [];

        return Inertia::render('Submissions/ForDivision', [
            'submissions' => $submissions,
            'userDivision' => $user->division->only(['id', 'name']),
            'statusFilter' => $statusFilter,
            'permissions' => $userPermissions,
        ]);
    }

    /**
     * ✅ OPTIMIZED: Show submission detail
     * 
     * SEBELUM:
     * - Ambil submission tanpa relasi yang tepat
     * - Lazy load relasi di view
     * - Missing relasi untuk workflow steps
     * 
     * SESUDAH:
     * - Service load semua relasi yang dibutuhkan
     * - Single query dengan eager loading
     * - Siap untuk detail view
     */
    public function show(Submission $submission)
    {
        // Check authorization (gunakan policy yang sudah dioptimasi)
        $this->authorize('view', $submission);

        $user = Auth::user();

        // Service handle eager loading untuk detail view
        $submission = $this->listService->getSubmissionDetail($submission->id);

        return Inertia::render('Submissions/Show', [
            'submission' => $submission,
            'canApprove' => $user->can('approve', $submission),
            'canReject' => $user->can('reject', $submission),
            'canEdit' => $user->can('update', $submission),
            'canDelete' => $user->can('delete', $submission),
        ]);
    }

    /**
     * ✅ OPTIMIZED: Edit form
     * 
     * SEBELUM:
     * - Load submission dengan semua relasi
     * - Load workflow dengan semua steps di relasi
     * - Load document fields separately
     * 
     * SESUDAH:
     * - Service load hanya relasi yang dibutuhkan untuk edit
     * - Single query untuk submission + relasi
     * - Minimal overhead
     */
    public function edit(Submission $submission)
    {
        $this->authorize('update', $submission);

        // Service load untuk edit view
        $submission = $this->listService->getSubmissionForEdit($submission->id);

        return Inertia::render('Submissions/Edit', [
            'submission' => $submission,
        ]);
    }

    /**
     * ✅ OPTIMIZED: Update submission
     * 
     * SEBELUM:
     * - Load submission lengkap hanya untuk update
     * - Update relasi satu per satu
     * 
     * SESUDAH:
     * - Find atau update langsung
     * - No unnecessary eager loading
     * - Fast update
     */
    public function update(Request $request, Submission $submission)
    {
        $this->authorize('update', $submission);

        // Validate
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            // ... other fields
        ]);

        // Update tanpa eager load
        $submission->update($validated);

        // Invalidate cache jika ada relasi yang ter-cache
        if ($submission->workflow_id) {
            // Bisa invalidate workflow cache jika ada
        }

        return redirect()->route('submissions.show', $submission)
            ->with('success', 'Submission updated successfully');
    }

    /**
     * ✅ OPTIMIZED: Delete submission
     * 
     * SEBELUM:
     * - Load submission dengan relasi hanya untuk cek dan delete
     * 
     * SESUDAH:
     * - Find atau delete langsung
     * - No unnecessary loads
     */
    public function destroy(Submission $submission)
    {
        $this->authorize('delete', $submission);

        // Delete tanpa perlu load relasi
        $submission->delete();

        return redirect()->route('submissions.index')
            ->with('success', 'Submission deleted successfully');
    }

    /**
     * ✅ BONUS: Approve submission
     * 
     * OPTIMASI:
     * - Minimal load hanya untuk update status
     * - Cache permission check
     * - Fast approval process
     */
    public function approve(Request $request, Submission $submission)
    {
        $this->authorize('approve', $submission);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();

        // Update status & notes
        $submission->update([
            'status' => 'approved',
            'notes' => $validated['notes'] ?? null,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // Queue background job untuk PDF stamping (tidak block response)
        dispatch(new StampPdfOnDecision($submission));

        return back()->with('success', 'Submission approved');
    }
}

/**
 * MIGRATION CHECKLIST
 * 
 * 1. Copy service files ke app/Services/
 * 2. Inject service ke controller constructor
 * 3. Replace method satu per satu dengan contoh di atas
 * 4. Test setiap method setelah replace
 * 5. Monitor query count dengan debugbar
 * 6. Update tests jika ada
 * 
 * EXPECTED RESULTS:
 * - Dashboard queries: 10+ → 3-4 (70% reduction)
 * - Submission list: 15+ → 2-3 (85% reduction)
 * - Response time: 2-3s → 500-800ms (65% faster)
 * - Permission checks: 0 N+1 queries dengan caching
 */
