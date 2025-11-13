<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_fields', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->string('name'); // machine name, unique per document
            $table->string('label');
            $table->string('type', 50)->default('text'); // text, textarea, number, date, select, file
            $table->boolean('required')->default(false);
            $table->text('options_json')->nullable(); // JSON encoded array for select options
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->foreign('document_id')->references('id')->on('documents')->onDelete('cascade');
            $table->unique(['document_id', 'name']);
            $table->index(['document_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_fields');
    }
};
