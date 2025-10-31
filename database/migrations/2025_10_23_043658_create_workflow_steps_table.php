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
    $table->foreignId('workflow_id')->constrained('workflows')->onDelete('cascade');
    $table->foreignId('division_id')->constrained('divisions')->onDelete('cascade');
    $table->integer('step_order'); // Urutan proses (1, 2, 3, dst)

    // Opsional dan tambahan
    $table->string('role')->nullable(); // Role/divisi khusus untuk step ini
    $table->boolean('is_final_step')->default(false);
    $table->text('instructions')->nullable();
    $table->json('actions')->nullable(); // misalnya ["approve", "reject", "request to direktur"]

    // 🔽 Tambahan hak akses subdivisi
    $table->boolean('can_create')->default(false);
    $table->boolean('can_edit')->default(false);
    $table->boolean('can_delete')->default(false);
    $table->boolean('can_approve')->default(false);
    $table->boolean('can_reject')->default(false);

    $table->timestamps();
});

        }

        public function down(): void
        {
            Schema::dropIfExists('workflow_steps');
        }
    };
