<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Submission;

class SubmissionFile extends Model
{
    protected $fillable = [
        'submission_id',
        'file_path',
        'original_name',
        'mime',
        'size',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }
}
