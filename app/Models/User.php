<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'division_id',
        'subdivision_id', // ✅ tambahkan ini
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relasi ke Divisi
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    // Relasi ke Subdivisi
    public function subdivision(): BelongsTo
    {
        return $this->belongsTo(Subdivision::class);
    }

    // Relasi ke submission
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    // Helper role
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
