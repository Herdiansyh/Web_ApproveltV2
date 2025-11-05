<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubdivisionsTable extends Migration
{
   public function up(): void
{
    Schema::create('subdivisions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
        $table->string('name');
        $table->string('code')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('subdivisions');
}

}
