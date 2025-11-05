<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to use raw SQL to change ENUM to VARCHAR
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `submissions` MODIFY COLUMN `status` VARCHAR(255) DEFAULT "pending"');
        } else {
            Schema::table('submissions', function (Blueprint $table) {
                $table->string('status', 255)->default('pending')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For MySQL, we need to use raw SQL to change VARCHAR back to ENUM
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE `submissions` MODIFY COLUMN `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        } else {
            Schema::table('submissions', function (Blueprint $table) {
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->change();
            });
        }
    }
};
