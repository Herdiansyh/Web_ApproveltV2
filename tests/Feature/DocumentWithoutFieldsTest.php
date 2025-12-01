<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\Division;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class DocumentWithoutFieldsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user with division
        $this->division = Division::factory()->create();
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'employee',
            'division_id' => $this->division->id,
        ]);
    }

    /** @test */
    public function document_type_without_fields_can_be_submitted_successfully()
    {
        // Create a document without any fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Test submission without any field data
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission Without Fields',
            'description' => 'Test Description',
            'data' => [], // Empty data array
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pengajuan berhasil dibuat.',
                 ]);

        // Verify submission was created in database
        $this->assertDatabaseHas('submissions', [
            'title' => 'Test Submission Without Fields',
            'workflow_id' => $workflow->id,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function document_type_without_fields_can_be_submitted_with_table_data()
    {
        // Create a document without any fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Test submission with table data
        $this->actingAs($this->user);

        $tableData = [
            ['name' => 'Item 1', 'quantity' => 2],
            ['name' => 'Item 2', 'quantity' => 5],
        ];

        $tableColumns = [
            ['key' => 'name', 'label' => 'Nama'],
            ['key' => 'quantity', 'label' => 'Jumlah'],
        ];

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission With Table Data',
            'description' => 'Test Description',
            'data' => [],
            'tableData' => $tableData,
            'tableColumns' => $tableColumns,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pengajuan berhasil dibuat.',
                 ]);

        // Verify submission was created and table data is saved
        $this->assertDatabaseHas('submissions', [
            'title' => 'Test Submission With Table Data',
            'workflow_id' => $workflow->id,
            'user_id' => $this->user->id,
        ]);

        // Check that data_json contains table data
        $submission = \App\Models\Submission::where('title', 'Test Submission With Table Data')->first();
        $this->assertNotNull($submission->data_json);
        $this->assertArrayHasKey('tableData', $submission->data_json);
        $this->assertArrayHasKey('tableColumns', $submission->data_json);
    }

    /** @test */
    public function document_type_without_fields_can_be_submitted_with_null_data()
    {
        // Create a document without any fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Test submission without data field at all
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission Without Data Field',
            'description' => 'Test Description',
            // No 'data' field at all
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Pengajuan berhasil dibuat.',
                 ]);

        // Verify submission was created and data_json is null
        $this->assertDatabaseHas('submissions', [
            'title' => 'Test Submission Without Data Field',
            'workflow_id' => $workflow->id,
            'user_id' => $this->user->id,
        ]);

        $submission = \App\Models\Submission::where('title', 'Test Submission Without Data Field')->first();
        $this->assertNull($submission->data_json);
    }
}
