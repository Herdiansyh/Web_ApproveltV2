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

            // Relasi ke pembuat
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('division_id')->nullable()->constrained()->onDelete('cascade');

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('signature_path')->nullable();

            // workflow dinamis
            $table->foreignId('workflow_id')->nullable()->constrained('workflows')->onDelete('set null');
            $table->integer('current_step')->default(1);

            // status & approval tracking
            $table->string('status')->default('pending'); // ubah dari enum -> string agar fleksibel
            $table->string('waiting_for')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('approval_note')->nullable();
            $table->text('notes')->nullable();

            // posisi watermark
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
