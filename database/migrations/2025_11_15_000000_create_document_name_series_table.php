<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_name_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->string('series_pattern')->default('yyyy-mm-####');
            $table->string('prefix')->nullable();
            $table->unsignedBigInteger('current_number')->default(0);
            $table->enum('reset_type', ['none', 'monthly', 'yearly'])->default('none');
            $table->timestamp('last_reset_at')->nullable();
            $table->timestamps();

            $table->unique('document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_name_series');
    }
};
