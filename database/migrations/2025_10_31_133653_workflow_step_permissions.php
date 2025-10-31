<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_step_permissions', function (Blueprint $table) {
            $table->id();

            // Relasi ke step di workflow
            $table->foreignId('workflow_step_id')
                ->constrained('workflow_steps')
                ->onDelete('cascade');

            // Relasi ke subdivisi yang punya hak akses
            $table->foreignId('subdivision_id')
                ->constrained('subdivisions')
                ->onDelete('cascade');

            // Hak akses yang bisa diatur
            $table->boolean('can_read')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->boolean('can_reject')->default(false);
            $table->boolean('can_upload')->default(false);
            $table->boolean('can_download')->default(false);

            // Untuk fleksibilitas ke depan
            $table->json('extra_permissions')->nullable();

            $table->timestamps();

            // Cegah duplikasi entry per step dan subdivisi
            $table->unique(['workflow_step_id', 'subdivision_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_step_permissions');
    }
};
