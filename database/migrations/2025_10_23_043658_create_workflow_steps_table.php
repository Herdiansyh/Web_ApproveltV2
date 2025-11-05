    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        public function up(): void
{
   Schema::create('workflow_steps', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workflow_id')->constrained('workflows')->cascadeOnDelete();
    $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
    $table->integer('step_order');
    $table->string('role')->nullable();
    $table->boolean('is_final_step')->default(false);
    $table->boolean('is_active')->default(true); // 🆕 status aktif
    $table->text('instructions')->nullable();
    $table->json('actions')->nullable();
   $table->timestamps();
});

}


        public function down(): void
        {
            Schema::dropIfExists('workflow_steps');
        }
    };
