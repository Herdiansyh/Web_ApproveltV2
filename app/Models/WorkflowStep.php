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
        'instructions',
        'actions',

        // 🔹 Kolom hak akses subdivisi
        'can_create',
        'can_edit',
        'can_delete',
        'can_approve',
        'can_reject',
    ];

    protected $casts = [
        'actions' => 'array', // JSON otomatis jadi array
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_approve' => 'boolean',
        'can_reject' => 'boolean',
        'is_final_step' => 'boolean',
    ];

    /**
     * Relasi ke Workflow (template workflow)
     */
    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    /**
     * Relasi ke Division (pemilik step)
     */
    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Relasi ke Submission (jika nanti digunakan untuk runtime tracking)
     */
    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }
    public function permissions()
{
    return $this->hasMany(WorkflowStepPermission::class);
}

}
