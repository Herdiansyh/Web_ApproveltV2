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
        Schema::table('submission_workflow_steps', function (Blueprint $table) {
            $table->string('action_type')->nullable()->after('note')
                ->comment('The specific action taken: approve, request_next, reject');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submission_workflow_steps', function (Blueprint $table) {
            $table->dropColumn('action_type');
        });
    }
};
