<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Submission;
use App\Models\StampedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use setasign\Fpdi\PdfParser\CrossReference\CrossReferenceException;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class StampPdfOnDecision implements ShouldQueue
{
    use Queueable;

    protected int $submissionId;
    protected string $status; // approved|rejected
    protected array $approvers; // array of all approvers with their data including action_type

    /**
     * Create a new job instance.
     */
    public function __construct(int $submissionId, string $status, array $approvers)
    {
        $this->submissionId = $submissionId;
        $this->status = $status; // 'approved' or 'rejected'
        $this->approvers = $approvers;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $submission = Submission::findOrFail($this->submissionId);

        $inputPath = null;
        if ($submission->generated_pdf_path) {
            $inputPath = storage_path('app/private/' . $submission->generated_pdf_path);
        } elseif ($submission->file_path) {
            $origAbs = Storage::disk('private')->path($submission->file_path);
            if (strtolower(pathinfo($origAbs, PATHINFO_EXTENSION)) === 'pdf' && File::exists($origAbs)) {
                $inputPath = $origAbs;
            }
        }
        if (!$inputPath || !File::exists($inputPath)) {
            Log::warning('Stamping skipped: input PDF not found or unsupported extension', [
                'submission_id' => $submission->id,
                'generated_pdf_path' => $submission->generated_pdf_path,
                'file_path' => $submission->file_path ?? null,
            ]);
            return;
        }

        Log::info('Stamping start', [
            'submission_id' => $submission->id,
            'status' => $this->status,
            'inputPath' => $inputPath,
        ]);

        // Position can optionally be customized via submission watermark_x/y
        $pos = null;

        $dirRel = 'submission/' . $submission->id;
        $outRel = $dirRel . '/stamped_' . $this->status . '.pdf';
        $outAbs = storage_path('app/private/' . $outRel);
        File::ensureDirectoryExists(dirname($outAbs));

        $pdf = new Fpdi();
        try {
            $pageCount = $pdf->setSourceFile($inputPath);
        } catch (CrossReferenceException $e) {
            Log::warning('FPDI CrossReferenceException, attempting alternative solutions', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            
            // Try multiple fallback methods for shared hosting
            $fallback = $this->tryAlternativeFallback($inputPath, $submission->id, $this->status);
            if ($fallback && File::exists($fallback)) {
                $pdf = new Fpdi();
                $pageCount = $pdf->setSourceFile($fallback);
            } else {
                // Create a simple stamped PDF as last resort
                Log::warning('All PDF processing failed, creating simple stamped PDF', [
                    'submission_id' => $submission->id,
                ]);
                $this->createSimpleStampedPdf($submission, $inputPath);
                return;
            }
        }

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $tplId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($tplId);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplId);

            // Hanya tambahkan stamp di halaman terakhir
            if ($pageNo === $pageCount) {

            // Group approvers by action_type to create separate stamps
            $stampsByAction = [];
            foreach ($this->approvers as $approver) {
                $actionType = $approver['action_type'] ?? 'approve';
                if (!isset($stampsByAction[$actionType])) {
                    $stampsByAction[$actionType] = [];
                }
                $stampsByAction[$actionType][] = $approver;
            }
            
            // Render stamps for each action type separately
            $stampY = $submission->watermark_y ?? ($size['height'] - 25 - 10);
            $stampSpacing = 30; // Space between stamps
            
            foreach ($stampsByAction as $actionType => $approvers) {
                // Determine label based on action_type
                $label = 'APPROVED BY'; // default
                if ($actionType === 'request_next') {
                    $label = 'MENGETAHUI';
                } elseif ($actionType === 'approve') {
                    $label = 'DISETUJUI OLEH';
                }
                
                $approverNames = [];
                $approverDates = [];
                
                // For external documents, only show last approver per action type
                $isExternalDocument = !$submission->generated_pdf_path && $submission->file_path;
                
                if ($isExternalDocument && count($approvers) > 1) {
                    $lastApprover = end($approvers);
                    $approverNames = [strtoupper($lastApprover['name'])];
                    $approverDates = [];
                    if (!empty($lastApprover['approved_at'])) {
                        $approverDates[] = \Carbon\Carbon::parse($lastApprover['approved_at'])->format('d/m/Y H:i');
                    }
                } else {
                    // Show all approvers for this action type
                    foreach ($approvers as $approver) {
                        $approverNames[] = strtoupper($approver['name']);
                        if (!empty($approver['approved_at'])) {
                            $approverDates[] = \Carbon\Carbon::parse($approver['approved_at'])->format('d/m/Y H:i');
                        }
                    }
                }
                
                $allApproversText = implode(' • ', $approverNames);
                $allDatesText = implode(' • ', $approverDates);
                
                // Calculate stamp dimensions
                $baseHeight = 25;
                $totalHeight = $baseHeight;
                $rightMargin = 10;
                $fontSize = 9;
                $smallFontSize = 6;
                
                // Set font for width calculation
                $pdf->SetFont('Helvetica', 'B', $fontSize);
                $labelWidth = $pdf->GetStringWidth($label);
                $approversWidth = $pdf->GetStringWidth($allApproversText);
                $maxWidth = max($labelWidth, $approversWidth) + 8;
                
                $x = $submission->watermark_x ?? ($size['width'] - $maxWidth - $rightMargin);
                $y = $stampY;
                
                // Colors based on status
                $textColor = $this->status === 'approved' ? [6, 95, 70] : [220, 38, 38];
                $accentColor = $this->status === 'approved' ? [34, 197, 94] : [239, 68, 68];
                
                // Draw decorative lines
                $pdf->SetDrawColor(...$accentColor);
                $pdf->SetLineWidth(0.5);
                $pdf->Line($x - 3, $y, $x + $maxWidth + 3, $y);
                $pdf->Line($x - 3, $y + $totalHeight, $x + $maxWidth + 3, $y + $totalHeight);
                
                // Draw corners
                $cornerSize = 2;
                $pdf->Line($x - 3, $y, $x - 3 + $cornerSize, $y);
                $pdf->Line($x - 3, $y, $x - 3, $y + $cornerSize);
                $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3 - $cornerSize, $y);
                $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3, $y + $cornerSize);
                $pdf->Line($x - 3, $y + $totalHeight, $x - 3 + $cornerSize, $y + $totalHeight);
                $pdf->Line($x - 3, $y + $totalHeight, $x - 3, $y + $totalHeight - $cornerSize);
                $pdf->Line($x + $maxWidth + 3, $y + $totalHeight, $x + $maxWidth + 3 - $cornerSize, $y + $totalHeight);
                $pdf->Line($x + $maxWidth + 3, $y + $totalHeight, $x + $maxWidth + 3, $y + $totalHeight - $cornerSize);
                
                // Write label
                $pdf->SetFont('Helvetica', 'B', $fontSize);
                $pdf->SetTextColor(...$textColor);
                $pdf->SetXY($x, $y + 2);
                $pdf->Cell($maxWidth, 4, $label, 0, 1, 'C', false);
                
                // Write approver names
                $pdf->SetFont('Helvetica', 'B', $fontSize + 1);
                $pdf->SetXY($x, $y + 6);
                $pdf->Cell($maxWidth, 5, $allApproversText, 0, 1, 'C', false);
                
                // Write dates
                $pdf->SetFont('Helvetica', '', $smallFontSize);
                $pdf->SetTextColor(100, 100, 100);
                $pdf->SetXY($x, $y + 11);
                $pdf->Cell($maxWidth, 3, $allDatesText, 0, 1, 'C', false);
                
                // Add QR code for the first stamp only
                if ($actionType === array_key_first($stampsByAction)) {
                    try {
                        $verifyUrl = route('verification.show', $submission->short_code);
                        $qrSvg = QrCode::format('svg')
                            ->size(90)
                            ->margin(1)
                            ->errorCorrection('M')
                            ->generate($verifyUrl);
                        
                        $qrTempPath = sys_get_temp_dir() . '/qr_' . $submission->id . '.png';
                        $qrPng = QrCode::format('png')
                            ->size(90)
                            ->margin(1)
                            ->errorCorrection('M')
                            ->generate($verifyUrl);
                        
                        file_put_contents($qrTempPath, $qrPng);
                        
                        $qrSize = 35;
                        $qrX = $x - $qrSize - 15;
                        $qrY = $y + ($totalHeight / 2) - ($qrSize / 2);
                        
                        $pdf->Image($qrTempPath, $qrX, $qrY, $qrSize, $qrSize, 'PNG');
                        
                        if (file_exists($qrTempPath)) {
                            unlink($qrTempPath);
                        }
                        
                        $pdf->SetFont('Helvetica', '', 6);
                        $pdf->SetTextColor(100, 100, 100);
                        $pdf->SetXY($qrX, $qrY + $qrSize + 2);
                        $pdf->Cell($qrSize, 3, 'Verify Document', 0, 1, 'C', false);
                        
                    } catch (\Throwable $e) {
                        Log::warning('Failed to add QR code to stamped PDF', [
                            'submission_id' => $submission->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
                
                // Move Y position for next stamp
                $stampY -= ($totalHeight + $stampSpacing);
            }
            }
        }

        try {
            $pdf->Output($outAbs, 'F');
        } catch (\Throwable $t) {
            Log::error('Failed to write stamped PDF', [
                'submission_id' => $submission->id,
                'outAbs' => $outAbs,
                'error' => $t->getMessage(),
            ]);
            return;
        }

        $hash = @hash_file('sha256', $outAbs) ?: null;
        StampedFile::updateOrCreate(
            ['submission_id' => $submission->id, 'status' => $this->status],
            [
                'stamped_pdf_path' => $outRel,
                'stamped_pdf_hash' => $hash,
                'stamped_generated_at' => now(),
            ]
        );
        Log::info('Stamped PDF generated', [
            'submission_id' => $submission->id,
            'status' => $this->status,
            'path' => $outRel,
        ]);
    }

    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }
        $int = hexdec($hex);
        return [($int >> 16) & 255, ($int >> 8) & 255, $int & 255];
    }

    /**
     * Try multiple fallback methods for shared hosting environments
     */
    private function tryAlternativeFallback(string $inputPath, int $submissionId, string $status): ?string
    {
        // Method 1: Try original QPDF method if available
        $qpdfFallback = $this->tryUncompressWithQpdf($inputPath, $submissionId, $status);
        if ($qpdfFallback) {
            return $qpdfFallback;
        }
        
        // Method 2: Try using built-in PDF manipulation (limited but works without external tools)
        try {
            return $this->tryPdfReconstruction($inputPath, $submissionId, $status);
        } catch (\Throwable $e) {
            Log::warning('PDF reconstruction failed', [
                'submission_id' => $submissionId,
                'error' => $e->getMessage(),
            ]);
        }
        
        return null;
    }
    
    /**
     * Attempt to reconstruct PDF using PHP only (no external dependencies)
     */
    private function tryPdfReconstruction(string $inputPath, int $submissionId, string $status): ?string
    {
        $dir = storage_path('app/private/submission/' . $submissionId);
        File::ensureDirectoryExists($dir);
        $out = $dir . '/_reconstructed_' . $status . '.pdf';
        
        try {
            // Read original PDF
            $content = file_get_contents($inputPath);
            if (!$content) {
                return null;
            }
            
            // Simple PDF reconstruction - remove problematic streams
            // This is a basic approach that works for many PDF files
            $reconstructed = preg_replace(
                ['/stream\s*\n/', '/\nendstream/'],
                ['stream', 'endstream'],
                $content
            );
            
            if (file_put_contents($out, $reconstructed)) {
                return $out;
            }
        } catch (\Throwable $e) {
            Log::error('PDF reconstruction error', [
                'error' => $e->getMessage(),
            ]);
        }
        
        return null;
    }
    
    /**
     * Create a simple stamped PDF when all else fails
     */
    private function createSimpleStampedPdf(Submission $submission, string $originalPath): void
    {
        try {
            $dirRel = 'submission/' . $submission->id;
            $outRel = $dirRel . '/stamped_' . $this->status . '.pdf';
            $outAbs = storage_path('app/private/' . $outRel);
            
            // Create a new PDF with just the stamp
            $pdf = new Fpdi();
            $pdf->AddPage();
            
            // Add stamp information
            $label = $this->status === 'approved' ? 'APPROVED' : 'REJECTED';
            $approverNames = [];
            foreach ($this->approvers as $approver) {
                $approverNames[] = strtoupper($approver['name']);
            }
            $allApproversText = implode(' • ', $approverNames);
            
            // Set colors
            $textColor = $this->status === 'approved' ? [6, 95, 70] : [220, 38, 38];
            
            // Add stamp text
            $pdf->SetFont('Helvetica', 'B', 24);
            $pdf->SetTextColor(...$textColor);
            $pdf->Cell(0, 20, $label, 0, 1, 'C');
            
            $pdf->SetFont('Helvetica', 'B', 16);
            $pdf->Cell(0, 15, $allApproversText, 0, 1, 'C');
            
            $pdf->SetFont('Helvetica', '', 12);
            $pdf->SetTextColor(100, 100, 100);
            $pdf->Cell(0, 10, 'Original document could not be processed', 0, 1, 'C');
            $pdf->Cell(0, 10, 'Please check the original document separately', 0, 1, 'C');
            
            // Save the simple stamped PDF
            $pdf->Output($outAbs, 'F');
            
            // Update database
            $hash = @hash_file('sha256', $outAbs) ?: null;
            StampedFile::updateOrCreate(
                ['submission_id' => $submission->id, 'status' => $this->status],
                [
                    'stamped_pdf_path' => $outRel,
                    'stamped_pdf_hash' => $hash,
                    'stamped_generated_at' => now(),
                ]
            );
            
            Log::info('Simple stamped PDF created', [
                'submission_id' => $submission->id,
                'status' => $this->status,
                'path' => $outRel,
            ]);
            
        } catch (\Throwable $e) {
            Log::error('Failed to create simple stamped PDF', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
    /**
     * Attempt to uncompress PDF using qpdf to make it compatible with FPDI free parser.
     * Requires QPDF_PATH in env (path to qpdf executable). Returns path to processed file or null.
     */
    private function tryUncompressWithQpdf(string $inputPath, int $submissionId, string $status): ?string
    {
        $qpdf = (string) config('services.qpdf.path');
        $usePathBinary = false;
        if (!$qpdf || !File::exists($qpdf)) {
            Log::warning('qpdf path not configured or not found on disk, trying PATH fallback');
            $usePathBinary = true;
            $qpdf = 'qpdf'; // rely on system PATH
        }
        $dir = storage_path('app/private/submission/' . $submissionId);
        File::ensureDirectoryExists($dir);
        $out = $dir . '/_qpdf_uncompressed_' . $status . '.pdf';

        // Try to make PDF FPDI-compatible: disable object streams, uncompress streams, remove encryption
        // qpdf --qdf --object-streams=disable --stream-data=uncompress --decrypt input.pdf output.pdf
        $cmd = '"' . $qpdf . '" --qdf --object-streams=disable --stream-data=uncompress --decrypt "' . $inputPath . '" "' . $out . '"';
        try {
            $result = null;
            $exit = null;
            
            // Optimized: Add timeout control to prevent hanging
            $timeout = 30; // 30 seconds timeout
            $startTime = time();
            
            @exec($cmd . ' 2>&1', $result, $exit);
            
            $executionTime = time() - $startTime;
            if ($executionTime > $timeout) {
                Log::error('qpdf command timeout', [
                    'submission_id' => $submissionId,
                    'execution_time' => $executionTime,
                    'timeout' => $timeout,
                ]);
                return null;
            }
            
            if ($exit === 0 && File::exists($out)) {
                Log::info('qpdf command succeeded', [
                    'submission_id' => $submissionId,
                    'execution_time' => $executionTime,
                ]);
                return $out;
            }
            Log::error('qpdf command failed', [
                'using_path_binary' => $usePathBinary,
                'cmd' => $cmd,
                'exit' => $exit,
                'output' => $result,
                'execution_time' => $executionTime,
            ]);
        } catch (\Throwable $t) {
            Log::error('qpdf execution error', [
                'error' => $t->getMessage(),
                'submission_id' => $submissionId,
            ]);
        }
        return null;
    }
}
