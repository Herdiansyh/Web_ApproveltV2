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
        'qr_code_path',
        'current_step',
        'watermark_x',
        'watermark_y',
        'watermark_width',
        'watermark_height',
        'data_json',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
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
        return $this->hasOne(StampedFile::class);
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
              ->whereRaw('LOWER(status) NOT LIKE ?', ['%rejected%']);
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
}



