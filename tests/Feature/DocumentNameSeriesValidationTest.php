<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentNameSeries;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Validation\ValidationException;

class DocumentNameSeriesValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($this->admin);
    }

    public function test_prefix_must_be_unique_across_documents()
    {
        // Create first document with prefix
        $document1 = Document::factory()->create();
        DocumentNameSeries::factory()->create([
            'document_id' => $document1->id,
            'prefix' => 'TEST-'
        ]);

        // Create second document
        $document2 = Document::factory()->create();

        // Try to create name series with same prefix - should fail
        $response = $this->post(route('documents.nameSeries.update', $document2->id), [
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => 'TEST-', // Same prefix as first document
            'reset_type' => 'none',
            'current_number' => 0
        ]);

        // Should have validation error
        $response->assertSessionHasErrors('prefix');
        
        // Verify error message
        $errors = session('errors');
        $this->assertEquals('Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda.', 
                           $errors->get('prefix')[0]);
    }

    public function test_prefix_can_be_same_for_same_document()
    {
        // Create document with prefix
        $document = Document::factory()->create();
        $series = DocumentNameSeries::factory()->create([
            'document_id' => $document->id,
            'prefix' => 'TEST-'
        ]);

        // Try to update same document with same prefix - should succeed
        $response = $this->post(route('documents.nameSeries.update', $document->id), [
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => 'TEST-', // Same prefix but same document
            'reset_type' => 'none',
            'current_number' => 5
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('document_name_series', [
            'document_id' => $document->id,
            'prefix' => 'TEST-',
            'current_number' => 5
        ]);
    }

    public function test_null_prefix_is_allowed()
    {
        // Create first document with null prefix
        $document1 = Document::factory()->create();
        DocumentNameSeries::factory()->create([
            'document_id' => $document1->id,
            'prefix' => null
        ]);

        // Create second document with null prefix - should succeed
        $document2 = Document::factory()->create();

        $response = $this->post(route('documents.nameSeries.update', $document2->id), [
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => null,
            'reset_type' => 'none',
            'current_number' => 0
        ]);

        $response->assertRedirect();
    }

    public function test_prefix_validation_in_document_creation()
    {
        // Create document with prefix
        $document1 = Document::factory()->create();
        DocumentNameSeries::factory()->create([
            'document_id' => $document1->id,
            'prefix' => 'DUPLICATE-'
        ]);

        // Try to create new document with same prefix - should fail
        $response = $this->post(route('documents.store'), [
            'name' => 'Test Document',
            'description' => 'Test Description',
            'is_active' => true,
            'default_columns' => [],
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => 'DUPLICATE-', // Same prefix as existing document
            'reset_type' => 'none',
            'current_number' => 0
        ]);

        // Should have validation error
        $response->assertSessionHasErrors('prefix');
        
        // Verify error message
        $errors = session('errors');
        $this->assertEquals('Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda.', 
                           $errors->get('prefix')[0]);
    }

    public function test_prefix_validation_in_document_update()
    {
        // Create two documents with different prefixes
        $document1 = Document::factory()->create();
        DocumentNameSeries::factory()->create([
            'document_id' => $document1->id,
            'prefix' => 'EXISTING-'
        ]);

        $document2 = Document::factory()->create();
        DocumentNameSeries::factory()->create([
            'document_id' => $document2->id,
            'prefix' => 'CURRENT-'
        ]);

        // Try to update document2 with prefix from document1 - should fail
        $response = $this->put(route('documents.update', $document2->id), [
            'name' => 'Updated Document',
            'description' => 'Updated Description',
            'is_active' => true,
            'default_columns' => [],
            'series_pattern' => 'yyyy-mm-####',
            'prefix' => 'EXISTING-', // Prefix from another document
            'reset_type' => 'none',
            'current_number' => 0
        ]);

        // Should have validation error
        $response->assertSessionHasErrors('prefix');
        
        // Verify error message
        $errors = session('errors');
        $this->assertEquals('Prefix sudah digunakan oleh dokumen lain. Silakan pilih prefix yang berbeda.', 
                           $errors->get('prefix')[0]);
    }
}
