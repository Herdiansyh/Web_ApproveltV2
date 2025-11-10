<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateField extends Model
{
    protected $fillable = [
        'template_id',
        'name',
        'label',
        'type',
        'required',
        'validations_json',
        'options_json',
        'order',
    ];

    protected $casts = [
        'required' => 'boolean',
        'validations_json' => 'array',
        'options_json' => 'array',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
