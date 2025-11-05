<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('submission_workflow_steps', function (Blueprint $table) {
        $table->id();
        $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
        $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
        $table->integer('step_order');

        $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->text('note')->nullable();
        $table->timestamp('approved_at')->nullable();
        $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();

        $table->timestamps();
    });
}

    public function down(): void
    {
        Schema::dropIfExists('submission_workflow_steps');
    }
};
