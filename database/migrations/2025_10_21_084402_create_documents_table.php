<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->onDelete('cascade');
            $table->string('name'); // Nama dokumen yang juga berfungsi sebagai jenis dokumen
            $table->text('description')->nullable(); // Deskripsi singkat
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
