<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('workflows', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();

        // relasi ke document type (documents)
        $table->foreignId('document_id')->nullable()->constrained('documents')->cascadeOnDelete();

        // workflow bekerja di tingkat division (division_from_id / division_to_id optional)
        $table->foreignId('division_from_id')->nullable()->constrained('divisions')->nullOnDelete();
        $table->foreignId('division_to_id')->nullable()->constrained('divisions')->nullOnDelete();

        $table->boolean('is_active')->default(true);
        $table->integer('total_steps')->nullable();
        $table->json('flow_definition')->nullable();

        $table->timestamps();
    });
}



    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
