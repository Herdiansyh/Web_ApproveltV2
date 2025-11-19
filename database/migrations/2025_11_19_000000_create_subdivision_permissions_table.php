<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subdivision_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subdivision_id')->constrained()->onDelete('cascade');
            $table->boolean('can_view')->default(false);
            $table->boolean('can_approve')->default(false);
            $table->boolean('can_reject')->default(false);
            $table->boolean('can_request_next')->default(false);
            $table->boolean('can_edit')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->timestamps();
            $table->unique('subdivision_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subdivision_permissions');
    }
};
