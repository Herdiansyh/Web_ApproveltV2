<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workflow;
use App\Models\Document;
use App\Models\DocumentField;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class SubmissionValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'employee',
        ]);
    }

    /** @test */
    public function document_type_field_is_required()
    {
        // Test without authentication first
        $response = $this->postJson('/submissions', [
            'title' => 'Test Submission',
            'description' => 'Test Description',
        ]);

        $response->assertStatus(401); // Unauthorized

        // Test with authentication but without workflow_id
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'title' => 'Test Submission',
            'description' => 'Test Description',
        ]);

        $response->assertStatus(422) // Validation error
                 ->assertJsonValidationErrors(['workflow_id']);
    }

    /** @test */
    public function document_type_must_exist_in_workflows_table()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => 999, // Non-existent workflow ID
            'title' => 'Test Submission',
            'description' => 'Test Description',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['workflow_id']);
    }

    /** @test */
    public function submission_fails_with_invalid_workflow_id()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => 'invalid',
            'title' => 'Test Submission',
            'description' => 'Test Description',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['workflow_id']);
    }

    /** @test */
    public function validation_error_message_is_clear()
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'title' => 'Test Submission',
            'description' => 'Test Description',
        ]);

        $response->assertStatus(422);
        
        $data = $response->json();
        
        // Check that the error message exists and is clear
        $this->assertArrayHasKey('errors', $data);
        $this->assertArrayHasKey('workflow_id', $data['errors']);
        $this->assertStringContainsStringIgnoringCase('required', strtolower($data['errors']['workflow_id'][0]));
    }
}
