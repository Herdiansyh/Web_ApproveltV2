<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubdivisionsTable extends Migration
{
    public function up()
    {
        Schema::create('subdivisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable(); // opsional, kalau mau kode singkat
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subdivisions');
    }
}
