<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'default_columns',
    ];

    protected $casts = [
        'default_columns' => 'array',
    ];

    public function fields(): HasMany
    {
        return $this->hasMany(DocumentField::class)->orderBy('order');
    }

    public function nameSeries(): HasOne
    {
        return $this->hasOne(DocumentNameSeries::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}

