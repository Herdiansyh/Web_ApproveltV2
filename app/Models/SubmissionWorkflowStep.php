<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubmissionWorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'division_id',
        'subdivision_id',

        'step_order',
        'status',       // pending, approved, rejected
        'approver_id',  // user yang approve step
        'approved_at',
        'note'
    ];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
