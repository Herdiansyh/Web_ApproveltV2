<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Cancel functionality
            $table->text('cancel_reason')->nullable()->after('notes');
            $table->timestamp('cancelled_at')->nullable()->after('cancel_reason');
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete()->after('cancelled_at');
            
            // Amend functionality
            $table->text('amend_reason')->nullable()->after('cancelled_by');
            $table->foreignId('original_submission_id')->nullable()->constrained('submissions')->nullOnDelete()->after('amend_reason');
            $table->integer('amend_version')->default(0)->after('original_submission_id');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn([
                'cancel_reason',
                'cancelled_at', 
                'cancelled_by',
                'amend_reason',
                'original_submission_id',
                'amend_version'
            ]);
        });
    }
};
