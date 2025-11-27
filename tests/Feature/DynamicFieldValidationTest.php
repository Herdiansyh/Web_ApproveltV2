<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\DocumentField;
use App\Models\Division;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class DynamicFieldValidationTest extends TestCase
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
            'role' => 'user',
            'division_id' => $this->division->id,
        ]);
    }

    /** @test */
    public function required_dynamic_fields_must_be_filled()
    {
        // Create a document with required fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create required fields
        $requiredField1 = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'tanggal_mulai',
            'label' => 'Tanggal Mulai',
            'type' => 'date',
            'required' => true,
        ]);

        $requiredField2 = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'keperluan',
            'label' => 'Keperluan',
            'type' => 'text',
            'required' => true,
        ]);

        // Create optional field
        $optionalField = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'keterangan',
            'label' => 'Keterangan',
            'type' => 'textarea',
            'required' => false,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Test submission with missing required fields
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission',
            'description' => 'Test Description',
            'data' => [
                // Missing required fields
                'keterangan' => 'Optional field filled',
            ],
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['data.tanggal_mulai'])
                 ->assertJsonValidationErrors(['data.keperluan']);
    }

    /** @test */
    public function optional_fields_can_be_empty()
    {
        // Create a document with optional fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create optional fields
        $optionalField1 = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'keterangan',
            'label' => 'Keterangan',
            'type' => 'textarea',
            'required' => false,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Test submission with empty optional fields
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission',
            'description' => 'Test Description',
            'data' => [
                // Optional fields can be empty or missing
            ],
        ]);

        $response->assertStatus(200); // Should succeed
    }

    /** @test */
    public function validation_error_messages_are_clear()
    {
        // Create a document with required field
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        $requiredField = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'alasan_cuti',
            'label' => 'Alasan Cuti',
            'type' => 'textarea',
            'required' => true,
        ]);

        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission',
            'description' => 'Test Description',
            'data' => [
                // Missing required alasan_cuti field
            ],
        ]);

        $response->assertStatus(422);
        
        $data = $response->json();
        
        // Check that the error message exists and is clear
        $this->assertArrayHasKey('errors', $data);
        $this->assertArrayHasKey('data.alasan_cuti', $data['errors']);
        $this->assertStringContains('wajib diisi', $data['errors']['data.alasan_cuti'][0]);
    }

    /** @test */
    public function empty_strings_are_treated_as_missing_for_required_fields()
    {
        // Create a document with required field
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        $requiredField = DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'nama_penerima',
            'label' => 'Nama Penerima',
            'type' => 'text',
            'required' => true,
        ]);

        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission',
            'description' => 'Test Description',
            'data' => [
                'nama_penerima' => '', // Empty string should be treated as missing
            ],
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['data.nama_penerima']);
    }
}
