<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStepPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_step_id',
        'subdivision_id',
        'can_read',
        'can_edit',
        'can_delete',
        'can_approve',
        'can_reject',
        'can_upload',
        'can_download',
        'extra_permissions',
    ];

    protected $casts = [
        'can_read' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_approve' => 'boolean',
        'can_reject' => 'boolean',
        'can_upload' => 'boolean',
        'can_download' => 'boolean',
        'extra_permissions' => 'array',
    ];

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function subdivision(): BelongsTo
    {
        return $this->belongsTo(Subdivision::class);
    }
}
