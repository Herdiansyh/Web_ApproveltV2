<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentField extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'name',
        'label',
        'type',
        'required',
        'options_json',
        'order',
    ];

    protected $casts = [
        'required' => 'boolean',
    ];

    // Expose decoded options for select fields
    protected $appends = [
        'options',
    ];

    public function getOptionsAttribute(): array
    {
        if (!$this->options_json) return [];
        $arr = json_decode($this->options_json, true);
        return is_array($arr) ? $arr : [];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
