<?php

namespace App\Services;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Service untuk mengoptimalkan queries submission
 * Menghindari N+1 queries dan eager loading yang tidak perlu
 */
class SubmissionQueryService
{
    // Property untuk relasi (tidak bisa jadi const karena closure)
    // Relasi yang selalu dibutuhkan
    private array $baseRelations = [
        'user' => ['id', 'name', 'email', 'division_id', 'subdivision_id'],
        'division' => ['id', 'name'],
        'approver' => ['id', 'name'],
        'workflow' => ['id', 'name', 'document_id', 'total_steps'],
    ];

    // Relasi tambahan untuk list view
    private array $listRelations = [
        'user' => ['id', 'name', 'email', 'division_id', 'subdivision_id'],
        'division' => ['id', 'name'],
        'workflow' => ['id', 'name', 'document_id', 'total_steps'],
        'workflow.document' => ['id', 'name', 'type'],
    ];

    // Relasi untuk detail view
    private array $detailRelations = [
        'user' => ['id', 'name', 'email', 'division_id', 'subdivision_id'],
        'division' => ['id', 'name'],
        'approver' => ['id', 'name'],
        'workflow' => ['id', 'name', 'document_id', 'total_steps', 'flow_definition'],
        'workflow.document' => ['id', 'name', 'type', 'description'],
        'workflow.steps' => ['id', 'workflow_id', 'step_order', 'name', 'division_id'],
        'workflowSteps' => ['id', 'submission_id', 'step_order', 'approver_id', 'status', 'notes', 'created_at'],
        'approvals' => [],
        'files' => [],
    ];

    /**
     * Query base dengan optimasi minimal (untuk filtering saja)
     */
    public function baseQuery(): Builder
    {
        return Submission::query();
    }

    /**
     * Query untuk list view dengan eager loading optimal
     */
    public function listQuery(): Builder
    {
        return $this->applyRelations(Submission::query(), $this->listRelations);
    }

    /**
     * Query untuk detail view dengan relasi lengkap
     */
    public function detailQuery(): Builder
    {
        return $this->applyRelations(Submission::query(), $this->detailRelations);
    }

    /**
     * Apply relations dengan optimasi column selection
     */
    private function applyRelations(Builder $query, array $relations): Builder
    {
        foreach ($relations as $relation => $columns) {
            if (empty($columns)) {
                // No columns specified, load all
                $query->with($relation);
            } else {
                // Load specific columns
                $query->with([$relation => fn($q) => $q->select($columns)]);
            }
        }
        return $query;
    }

    /**
     * Filter berdasarkan user (pemilik atau approver)
     */
    public function filterByUser(Builder $query, User $user): Builder
    {
        return $query->where(function ($q) use ($user) {
            // User adalah pemilik
            $q->where('user_id', $user->id)
              // User adalah approver di step saat ini
              ->orWhereHas('workflow.steps', function ($subQ) use ($user) {
                  $subQ->whereColumn('workflow_steps.step_order', 'submissions.current_step')
                       ->where('workflow_steps.division_id', $user->division_id);
              });
        });
    }

    /**
     * Filter berdasarkan division dan permission
     */
    public function filterByDivision(Builder $query, User $user, bool $canViewGlobal): Builder
    {
        if ($user->role === 'admin') {
            return $query; // Admin melihat semua
        }

        if (!$canViewGlobal) {
            return $query->where('user_id', $user->id); // Hanya milik sendiri
        }

        // Dapat view global: lihat submission di divisi yang sama
        return $query->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->orWhere('division_id', $user->division_id);
        });
    }

    /**
     * Filter berdasarkan status
     */
    public function filterByStatus(Builder $query, string $status): Builder
    {
        return match ($status) {
            'completed' => $query->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
                  ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%']);
            }),
            'pending' => $query->where('status', 'pending'),
            'all' => $query,
            default => $query,
        };
    }

    /**
     * Select minimal untuk list view
     */
    public function selectForList(): Builder
    {
        return $this->baseQuery()->select([
            'id',
            'user_id',
            'division_id',
            'title',
            'status',
            'current_step',
            'workflow_id',
            'approved_at',
            'created_at',
        ]);
    }

    /**
     * Select minimal untuk dashboard statistics
     */
    public function selectForStats(): Builder
    {
        return $this->baseQuery()->select([
            'id',
            'user_id',
            'status',
            'approved_by',
            'current_step',
            'workflow_id',
        ]);
    }
}
