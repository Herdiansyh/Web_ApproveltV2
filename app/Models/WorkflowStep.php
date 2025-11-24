<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'division_id',
        'step_order',
        'role',
        'is_final_step',
        'is_active',
        'instructions',
        'actions',
        'can_create',
        'can_edit',
        'can_delete',
        'can_approve',
        'can_reject',
    ];

    protected $casts = [
        'actions' => 'array',
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_approve' => 'boolean',
        'can_reject' => 'boolean',
        'is_final_step' => 'boolean',
        'is_active' => 'boolean',
    ];
        // 🔥 Accessor untuk memastikan actions selalu array (bahkan saat serialize Inertia)

   public function getActionsAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }
        
        if (is_string($value)) {
            return json_decode($value, true) ?? [];
        }
        
        return $value;
    }
    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }



}
