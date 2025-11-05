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

        $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
        $table->foreignId('division_id')->nullable()->constrained('divisions')->nullOnDelete();

        $table->string('title');
        $table->text('description')->nullable();
        $table->string('file_path')->nullable();
        $table->string('signature_path')->nullable();

        $table->foreignId('workflow_id')->nullable()->constrained('workflows')->nullOnDelete();
        $table->integer('current_step')->default(1);

        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->timestamp('approved_at')->nullable();
        $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
        $table->text('approval_note')->nullable();
        $table->text('notes')->nullable();

        $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();

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
