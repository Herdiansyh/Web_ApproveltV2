<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Str;
use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;

class GeneratePdfFromTemplate implements ShouldQueue
{
    use Queueable;

    protected int $submissionId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $submissionId)
    {
        $this->submissionId = $submissionId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $submission = Submission::with(['template'])
            ->findOrFail($this->submissionId);

        if (!$submission->template || !$submission->template->html_view_path) {
            return;
        }

        $viewPath = $submission->template->html_view_path;
        $data = $submission->data_json ?? [];
        $config = $submission->template->config_json ?? [];

        $html = view($viewPath, [
            'submission' => $submission,
            'data' => $data,
        ])->render();

        $pageSize = data_get($config, 'render.page_size', 'A4');
        $margins = data_get($config, 'render.margins', [
            'top' => 24, 'right' => 24, 'bottom' => 24, 'left' => 24,
        ]);

        $dirRel = 'submission/' . $submission->id;
        $fileRel = $dirRel . '/generated.pdf';
        $abs = storage_path('app/private/' . $fileRel);
        File::ensureDirectoryExists(dirname($abs));

        try {
            Browsershot::html($html)
                ->format($pageSize)
                ->margins($margins['top'] ?? 24, $margins['right'] ?? 24, $margins['bottom'] ?? 24, $margins['left'] ?? 24)
                ->showBackground()
                ->setNodeBinary(env('NODE_BINARY', 'node'))
                ->setNpmBinary(env('NPM_BINARY', 'npm'))
                ->timeout(30000) // 30 seconds timeout for shared hosting
                ->savePdf($abs);
        } catch (\Throwable $e) {
            Log::error('Browsershot failed, trying alternative PDF generation', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            // Fallback to simple PDF generation without Browsershot
            $this->generateSimplePdf($submission, $html, $abs);
        }

        $hash = @hash_file('sha256', $abs) ?: null;

        $submission->generated_pdf_path = $fileRel;
        $submission->generated_pdf_hash = $hash;
        $submission->save();
    }
    
    /**
     * Generate simple PDF without external dependencies
     */
    private function generateSimplePdf(Submission $submission, string $html, string $outputPath): void
    {
        try {
            // Use FPDF to create a simple PDF with the content
            $pdf = new \setasign\Fpdf\Fpdf('P', 'mm', 'A4');
            $pdf->AddPage();
            $pdf->SetFont('Arial', '', 12);
            
            // Strip HTML tags and create simple text content
            $text = strip_tags($html);
            $text = html_entity_decode($text);
            
            // Split text into lines and add to PDF
            $lines = explode("\n", wordwrap($text, 80, "\n"));
            foreach ($lines as $line) {
                $pdf->Cell(0, 10, $line, 0, 1);
            }
            
            $pdf->Output($outputPath, 'F');
            
            Log::info('Simple PDF generated successfully', [
                'submission_id' => $submission->id,
                'output_path' => $outputPath,
            ]);
            
        } catch (\Throwable $e) {
            Log::error('Simple PDF generation failed', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            // Create a minimal PDF as last resort
            $this->createMinimalPdf($submission, $outputPath);
        }
    }
    
    /**
     * Create minimal PDF when all else fails
     */
    private function createMinimalPdf(Submission $submission, string $outputPath): void
    {
        try {
            $pdf = new \setasign\Fpdf\Fpdf('P', 'mm', 'A4');
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->Cell(0, 10, 'Document Generated', 0, 1, 'C');
            $pdf->SetFont('Arial', '', 12);
            $pdf->Cell(0, 10, 'Submission ID: ' . $submission->id, 0, 1);
            $pdf->Cell(0, 10, 'Date: ' . now()->format('Y-m-d H:i:s'), 0, 1);
            $pdf->Ln(10);
            $pdf->Cell(0, 10, 'Original HTML content could not be processed.', 0, 1);
            $pdf->Cell(0, 10, 'Please check the original template.', 0, 1);
            
            $pdf->Output($outputPath, 'F');
            
            Log::info('Minimal PDF created as fallback', [
                'submission_id' => $submission->id,
            ]);
            
        } catch (\Throwable $e) {
            Log::error('Failed to create minimal PDF', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            throw $e; // Re-throw to indicate complete failure
        }
    }
}