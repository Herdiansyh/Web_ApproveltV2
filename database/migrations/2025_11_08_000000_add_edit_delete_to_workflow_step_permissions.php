<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_step_permissions', function (Blueprint $table) {
            $table->boolean('can_edit')->default(false)->after('can_request_next');
            $table->boolean('can_delete')->default(false)->after('can_edit');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_step_permissions', function (Blueprint $table) {
            $table->dropColumn(['can_edit', 'can_delete']);
        });
    }
};
