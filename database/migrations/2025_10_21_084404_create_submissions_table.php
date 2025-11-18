<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('division_id')
                ->nullable()
                ->constrained('divisions')
                ->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('signature_path')->nullable();

            // Workflow (SET NULL jika workflow dihapus)
            $table->foreignId('workflow_id')
                ->nullable()
                ->constrained('workflows')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->integer('current_step')->default(1);

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('approval_note')->nullable();
            $table->text('notes')->nullable();
            $table->json('data_json')->nullable();

            // Document type (SET NULL jika document type dihapus)
            $table->foreignId('document_id')
                ->nullable()
                ->constrained('documents')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            // Series code
            $table->string('series_code')->nullable();

            // Verification & QR
            $table->string('verification_token')->nullable()->unique();
            $table->string('qr_code_path')->nullable();

            // Watermark
            $table->float('watermark_x')->nullable();
            $table->float('watermark_y')->nullable();
            $table->float('watermark_width')->nullable();
            $table->float('watermark_height')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
