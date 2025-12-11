<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Modify default_columns to support new structure
            // Since it's already JSON, we don't need to modify the table structure
            // The new fields (type, required, options) will be stored in the JSON
        });
    }

    public function down(): void
    {
        // No changes to rollback - we're just enhancing JSON structure
    }
};
