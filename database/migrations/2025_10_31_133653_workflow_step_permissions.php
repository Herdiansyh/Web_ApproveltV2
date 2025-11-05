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
    $table->foreignId('workflow_step_id')->constrained('workflow_steps')->cascadeOnDelete();
    $table->foreignId('subdivision_id')->constrained('subdivisions')->cascadeOnDelete();

    $table->boolean('can_view')->default(false);
    $table->boolean('can_approve')->default(false);
    $table->boolean('can_reject')->default(false);
    $table->boolean('can_request_next')->default(false);

    $table->timestamps();
    $table->unique(['workflow_step_id', 'subdivision_id']);
});

    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_step_permissions');
    }
};
