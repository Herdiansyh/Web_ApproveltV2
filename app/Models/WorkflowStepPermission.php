<?php
namespace App\Models;
use App\Models\Subdivision;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowStepPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_step_id',
        'subdivision_id',
        'can_view',
        'can_approve',
        'can_reject',
        'can_request_next',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_approve' => 'boolean',
        'can_reject' => 'boolean',
        'can_request_next' => 'boolean',
    ];

    public function workflowStep()
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function subdivision()
    {
        return $this->belongsTo(Subdivision::class);
    }
}

