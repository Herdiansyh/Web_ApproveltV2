<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubdivisionPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'subdivision_id',
        'can_view',
        'can_approve',
        'can_reject',
        'can_request_next',
        'can_edit',
        'can_delete',
    ];

    protected $casts = [
        'can_view' => 'boolean',
        'can_approve' => 'boolean',
        'can_reject' => 'boolean',
        'can_request_next' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
    ];

    public function subdivision()
    {
        return $this->belongsTo(Subdivision::class);
    }
}
