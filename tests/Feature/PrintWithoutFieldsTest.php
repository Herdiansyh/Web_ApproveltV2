<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Division;
use App\Models\Document;
use App\Models\Workflow;
use App\Models\Submission;
use App\Models\WorkflowStep;
use App\Models\SubmissionWorkflowStep;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintWithoutFieldsTest extends TestCase
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
    public function document_without_fields_can_be_printed_after_approval()
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

        // Create a final step
        $finalStep = WorkflowStep::factory()->create([
            'workflow_id' => $workflow->id,
            'step_order' => 1,
            'division_id' => $this->division->id,
            'is_final_step' => true,
        ]);

        // Create submission without fields
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission Without Fields',
            'description' => 'Test Description',
            'data' => [],
        ]);

        $response->assertStatus(200);
        $submission = Submission::first();

        // Approve the submission
        $submissionStep = SubmissionWorkflowStep::where('submission_id', $submission->id)->first();
        $submissionStep->update([
            'status' => 'approved',
            'approver_id' => $this->user->id,
            'approved_at' => now(),
        ]);

        $submission->update(['status' => 'approved']);

        // Test print endpoint
        $printResponse = $this->actingAs($this->user)
            ->get("/submissions/{$submission->id}/print");

        $printResponse->assertStatus(200);
        $printResponse->assertHeader('Content-Type', 'text/html; charset=UTF-8');
        
        // Check that the print view contains expected content
        $content = $printResponse->getContent();
        $this->assertStringContainsString('Test Submission Without Fields', $content);
        $this->assertStringContainsString('Test Description', $content);
        $this->assertStringContainsString('Detail Pengajuan', $content);
    }

    /** @test */
    public function document_without_fields_with_table_data_can_be_printed()
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

        // Create a final step
        $finalStep = WorkflowStep::factory()->create([
            'workflow_id' => $workflow->id,
            'step_order' => 1,
            'division_id' => $this->division->id,
            'is_final_step' => true,
        ]);

        // Create submission with table data
        $this->actingAs($this->user);

        $tableData = [
            ['nama' => 'John', 'umur' => 25],
            ['nama' => 'Jane', 'umur' => 30],
        ];

        $tableColumns = [
            ['key' => 'nama', 'name' => 'Nama'],
            ['key' => 'umur', 'name' => 'Umur'],
        ];

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission With Table',
            'description' => 'Test Description with table data',
            'tableData' => $tableData,
            'tableColumns' => $tableColumns,
        ]);

        $response->assertStatus(200);
        $submission = Submission::first();

        // Approve the submission
        $submissionStep = SubmissionWorkflowStep::where('submission_id', $submission->id)->first();
        $submissionStep->update([
            'status' => 'approved',
            'approver_id' => $this->user->id,
            'approved_at' => now(),
        ]);

        $submission->update(['status' => 'approved']);

        // Test print endpoint
        $printResponse = $this->actingAs($this->user)
            ->get("/submissions/{$submission->id}/print");

        $printResponse->assertStatus(200);
        
        // Check that the print view contains table data
        $content = $printResponse->getContent();
        $this->assertStringContainsString('Test Submission With Table', $content);
        $this->assertStringContainsString('Data Tabel', $content);
        $this->assertStringContainsString('John', $content);
        $this->assertStringContainsString('Jane', $content);
        $this->assertStringContainsString('Nama', $content);
        $this->assertStringContainsString('Umur', $content);
    }

    /** @test */
    public function document_with_fields_can_still_be_printed()
    {
        // Create a document with fields
        $document = Document::factory()->create([
            'is_active' => true,
        ]);

        // Create required fields
        $field1 = \App\Models\DocumentField::factory()->create([
            'document_id' => $document->id,
            'name' => 'nama_lengkap',
            'label' => 'Nama Lengkap',
            'type' => 'text',
            'required' => true,
        ]);

        // Create workflow for the document
        $workflow = Workflow::factory()->create([
            'document_id' => $document->id,
            'is_active' => true,
        ]);

        // Create a final step
        $finalStep = WorkflowStep::factory()->create([
            'workflow_id' => $workflow->id,
            'step_order' => 1,
            'division_id' => $this->division->id,
            'is_final_step' => true,
        ]);

        // Create submission with field data
        $this->actingAs($this->user);

        $response = $this->postJson('/submissions', [
            'workflow_id' => $workflow->id,
            'title' => 'Test Submission With Fields',
            'description' => 'Test Description',
            'data' => [
                'nama_lengkap' => 'John Doe',
            ],
        ]);

        $response->assertStatus(200);
        $submission = Submission::first();

        // Approve the submission
        $submissionStep = SubmissionWorkflowStep::where('submission_id', $submission->id)->first();
        $submissionStep->update([
            'status' => 'approved',
            'approver_id' => $this->user->id,
            'approved_at' => now(),
        ]);

        $submission->update(['status' => 'approved']);

        // Test print endpoint
        $printResponse = $this->actingAs($this->user)
            ->get("/submissions/{$submission->id}/print");

        $printResponse->assertStatus(200);
        
        // Check that the print view contains field data
        $content = $printResponse->getContent();
        $this->assertStringContainsString('Test Submission With Fields', $content);
        $this->assertStringContainsString('Nama Lengkap', $content);
        $this->assertStringContainsString('John Doe', $content);
    }
}
