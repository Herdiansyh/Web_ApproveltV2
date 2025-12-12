<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Submission extends Model
{
    // ⚠️ PENTING: Jangan gunakan protected $with, load relasi secara explicit di Service
    // Ini menghindari N+1 queries dan over-fetching
    
    protected $fillable = [
        'user_id',
        'workflow_id',
        'title',
        'description',
        'file_path',
        'status',
        'approval_note',
        'signature_path',
        'approved_at',
        'approved_by',
        'division_id',
        'notes',
        'document_id',
        'series_code',
        'verification_token',
        'short_code',
        'qr_code_path',
        'current_step',
        'watermark_x',
        'watermark_y',
        'watermark_width',
        'watermark_height',
        'data_json',
        'cancel_reason',
        'cancelled_at',
        'cancelled_by',
        'amend_reason',
        'original_submission_id',
        'amend_version',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'data_json' => 'array',
    ];

    // ============================================================
    // RELASI
    // ============================================================

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function files(): HasMany
    {
        return $this->hasMany(SubmissionFile::class);
    }

    public function stamped(): HasOne
    {
        return $this->hasOne(StampedFile::class)->latestOfMany('stamped_generated_at');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function workflowSteps(): HasMany
    {
        return $this->hasMany(SubmissionWorkflowStep::class)
            ->orderBy('step_order');
    }

    public function currentWorkflowStep(): HasOne
    {
        return $this->hasOne(SubmissionWorkflowStep::class)
            ->whereColumn('step_order', 'submissions.current_step');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function originalSubmission(): BelongsTo
    {
        return $this->belongsTo(Submission::class, 'original_submission_id');
    }

    public function amendedSubmissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'original_submission_id');
    }

    // ============================================================
    // SCOPES - Untuk reusable query logic
    // ============================================================

    /**
     * Scope untuk filter submission yang belum final (bukan approved/rejected)
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereRaw('LOWER(status) NOT LIKE ?', ['%approved%'])
              ->whereRaw('LOWER(status) NOT LIKE ?', ['%rejected%'])
              ->whereRaw('LOWER(status) NOT LIKE ?', ['%cancelled%']);
        });
    }

    /**
     * Scope untuk filter submission yang sudah final
     */
    public function scopeCompleted($query)
    {
        return $query->where(function ($q) {
            $q->whereRaw('LOWER(status) LIKE ?', ['%approved%'])
              ->orWhereRaw('LOWER(status) LIKE ?', ['%rejected%']);
        });
    }

    /**
     * Scope untuk filter berdasarkan status pending
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope untuk submission di workflow tertentu
     */
    public function scopeOfWorkflow($query, int $workflowId)
    {
        return $query->where('workflow_id', $workflowId);
    }

    /**
     * Scope untuk submission di divisi tertentu
     */
    public function scopeOfDivision($query, int $divisionId)
    {
        return $query->where('division_id', $divisionId);
    }

    /**
     * Scope untuk submission dari user tertentu
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope untuk submission yang di-cancel
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope untuk submission yang bisa di-cancel (approved/rejected)
     */
    public function scopeCancellable($query)
    {
        return $query->whereIn('status', ['approved', 'rejected']);
    }

    /**
     * Scope untuk submission yang bisa di-amend (cancelled)
     */
    public function scopeAmendable($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Generate short code yang aman untuk URL verifikasi
     */
    public static function generateShortCode(): string
    {
        do {
            // Generate 8 karakter alphanumeric yang tidak ambigu
            $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
            $code = substr(str_shuffle(str_repeat($chars, 3)), 0, 8);
        } while (self::where('short_code', $code)->exists());

        return $code;
    }

    /**
     * Pastikan submission memiliki short code
     */
    public function ensureShortCode(): void
    {
        if (!$this->short_code) {
            $this->short_code = self::generateShortCode();
            $this->save();
        }
    }

    /**
     * Cari submission berdasarkan short code
     */
    public static function findByShortCode(string $shortCode): ?self
    {
        return self::where('short_code', $shortCode)->first();
    }

    /**
     * Check if user can cancel this submission
     */
    public function canBeCancelledBy($user): bool
    {
        // Check if submission is approved (including variations like "Approved by Direktur")
        $status = strtolower($this->status);
        $isApproved = str_contains($status, 'approved');
        
        if (!$isApproved) {
            return false;
        }

        // Submission creator can cancel
        if ($this->user_id === $user->id) {
            return true;
        }

        // Users who approved can also cancel
        if ($this->approved_by === $user->id) {
            return true;
        }

        // Check if user was involved in workflow steps as approver
        $hasWorkflowApproval = $this->workflowSteps()
            ->where('approver_id', $user->id)
            ->where('status', 'approved')
            ->exists();
        
        if ($hasWorkflowApproval) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can amend this submission
     */
    public function canBeAmendedBy($user): bool
    {
        // Only cancelled or rejected submissions can be amended
        $status = strtolower($this->status);
        $isCancelled = $status === 'cancelled';
        $isRejected = str_contains($status, 'rejected');
        
        if (!$isCancelled && !$isRejected) {
            return false;
        }

        // Only submission creator can amend
        if ($this->user_id !== $user->id) {
            return false;
        }

        return true;
    }

    /**
     * Cancel the submission
     */
    public function cancel(string $reason, $cancelledBy): void
    {
        $this->status = 'cancelled';
        $this->cancel_reason = $reason;
        $this->cancelled_at = now();
        $this->cancelled_by = $cancelledBy->id;
        $this->save();
    }

    /**
     * Generate amended series code
     */
    public function generateAmendedSeriesCode(): string
    {
        if (!$this->series_code) {
            return '';
        }

        // Find the original submission (could be this one or an ancestor)
        $originalId = $this->original_submission_id ?? $this->id;
        
        // Get the original series code from the very first submission in the chain
        $originalSubmission = self::find($originalId);
        
        // If this submission has an original_submission_id, find the root submission
        if ($originalSubmission->original_submission_id) {
            $rootSubmission = $originalSubmission;
            while ($rootSubmission->original_submission_id) {
                $rootSubmission = self::find($rootSubmission->original_submission_id);
            }
            $baseSeriesCode = $rootSubmission->series_code;
        } else {
            $baseSeriesCode = $originalSubmission->series_code;
        }
        
        // Get the highest amend version for this original submission
        $highestVersion = self::where('original_submission_id', $originalId)
            ->orWhere('id', $originalId)
            ->max('amend_version') ?? 0;

        return $baseSeriesCode . '-' . ($highestVersion + 1);
    }

    /**
     * Create amended submission
     */
    public function createAmendedSubmission(string $amendReason, $amendedBy): self
    {
        $amendedSubmission = $this->replicate();
        $amendedSubmission->original_submission_id = $this->id;
        $amendedSubmission->amend_version = ($this->amendedSubmissions()->max('amend_version') ?? 0) + 1;
        $amendedSubmission->series_code = $this->generateAmendedSeriesCode();
        $amendedSubmission->amend_reason = $amendReason;
        $amendedSubmission->status = 'pending';
        $amendedSubmission->current_step = 1;
        $amendedSubmission->approved_at = null;
        $amendedSubmission->approved_by = null;
        $amendedSubmission->approval_note = null;
        $amendedSubmission->cancel_reason = null;
        $amendedSubmission->cancelled_at = null;
        $amendedSubmission->cancelled_by = null;
        $amendedSubmission->verification_token = null;
        $amendedSubmission->short_code = self::generateShortCode();
        $amendedSubmission->qr_code_path = null;
        
        $amendedSubmission->save();

        // Recreate workflow steps for the amended submission
        if ($amendedSubmission->workflow) {
            $steps = $amendedSubmission->workflow->steps()->orderBy('step_order')->get();
            
            foreach ($steps as $step) {
                SubmissionWorkflowStep::create([
                    'submission_id' => $amendedSubmission->id,
                    'division_id' => $step->division_id,
                    'step_order' => $step->step_order,
                    'status' => 'pending',
                ]);
            }
        }

        return $amendedSubmission;
    }
}



