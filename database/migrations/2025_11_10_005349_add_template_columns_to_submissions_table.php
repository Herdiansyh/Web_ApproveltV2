<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->foreignId('template_id')->nullable()->constrained('templates')->nullOnDelete()->after('document_id');
            $table->json('data_json')->nullable()->after('template_id');
            $table->string('generated_pdf_path')->nullable()->after('data_json');
            $table->string('generated_pdf_hash')->nullable()->after('generated_pdf_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn(['data_json', 'generated_pdf_path', 'generated_pdf_hash']);
            $table->dropConstrainedForeignId('template_id');
        });
    }
};
