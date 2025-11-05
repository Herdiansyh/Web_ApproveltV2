<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subdivision extends Model
{
    protected $fillable = [
        'division_id',
        'name',
        'code',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }


public function workflowStepPermissions()
{
    return $this->hasMany(WorkflowStepPermission::class);
}

}
