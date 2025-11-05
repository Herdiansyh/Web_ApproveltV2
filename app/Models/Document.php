<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = ['division_id', 'name', 'description'];

    // Relasi ke Division
    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    // Relasi ke Workflow
    public function workflows()
    {
        return $this->hasMany(Workflow::class, 'document_id');
    }

    // Relasi ke Permission
   
}
