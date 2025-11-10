<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Submission;

class StampedFile extends Model
{
    protected $fillable = [
        'submission_id',
        'status',
        'stamped_pdf_path',
        'stamped_pdf_hash',
        'stamped_generated_at',
    ];

    protected $casts = [
        'stamped_generated_at' => 'datetime',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }
}
