<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->onDelete('cascade');
            $table->foreignId('subdivision_id')->constrained()->onDelete('cascade');

            // Hak akses (boleh diatur lewat checkbox di halaman admin nantinya)
            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_approve')->default(false);
$table->boolean('can_reject')->default(false); // <--- tambahkan ini
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_permissions');
    }
};
