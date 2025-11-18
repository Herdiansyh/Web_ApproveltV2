<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'division_from_id',
        'division_to_id',
        'is_active',
        'total_steps',
        'document_id',
        'flow_definition',
    ];

    // Relasi ke steps
    public function steps()
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('step_order');
    }

    // Relasi ke dokumen
    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    // Relasi ke divisi asal
    public function divisionFrom()
    {
        return $this->belongsTo(Division::class, 'division_from_id');
    }

    // Relasi ke divisi tujuan
    public function divisionTo()
    {
        return $this->belongsTo(Division::class, 'division_to_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeActiveWithActiveDocument($query)
    {
        return $query->where('is_active', true)
            ->whereHas('document', function ($q) {
                $q->where('is_active', true);
            });
    }
}
