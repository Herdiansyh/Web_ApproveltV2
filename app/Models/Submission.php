<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $with = ['user', 'workflow', 'approver', 'currentWorkflowStep'];
    
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
        'notes',
        'current_step', // urutan langkah sekarang
        'watermark_x',
        'watermark_y',
        'watermark_width',
        'watermark_height',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Semua langkah workflow untuk submission ini
    public function workflowSteps()
    {
        return $this->hasMany(SubmissionWorkflowStep::class);
    }

    // Langkah workflow saat ini untuk approval
    public function currentWorkflowStep()
    {
        return $this->hasOne(SubmissionWorkflowStep::class)
            ->where('step_order', $this->current_step);
    }
    
public function division()
{
    return $this->belongsTo(Division::class);
}
}


