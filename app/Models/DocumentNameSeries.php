<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentNameSeries extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'series_pattern',
        'prefix',
        'current_number',
        'reset_type',
        'last_reset_at',
    ];

    protected $casts = [
        'current_number' => 'integer',
        'last_reset_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
