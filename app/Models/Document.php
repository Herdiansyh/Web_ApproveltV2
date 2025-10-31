<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description'];

    // Nanti kalau sudah dikaitkan ke workflow:
    public function workflows()
    {
        return $this->hasMany(Workflow::class, 'document_id');
    }
    public function permissions()
{
    return $this->hasMany(DocumentPermission::class);
}

}
