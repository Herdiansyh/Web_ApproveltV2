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

class StampPdfOnDecision implements ShouldQueue
{
    use Queueable;

    protected int $submissionId;
    protected string $status; // approved|rejected
    protected string $by; // approver name
    protected string $at; // timestamp string

    /**
     * Create a new job instance.
     */
    public function __construct(int $submissionId, string $status, string $by, string $at)
    {
        $this->submissionId = $submissionId;
        $this->status = $status; // 'approved' or 'rejected'
        $this->by = $by;
        $this->at = $at;
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
            Log::warning('FPDI CrossReferenceException, attempting qpdf fallback', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);
            $fallback = $this->tryUncompressWithQpdf($inputPath, $submission->id, $this->status);
            if ($fallback && File::exists($fallback)) {
                $pdf = new Fpdi();
                $pageCount = $pdf->setSourceFile($fallback);
            } else {
                Log::error('QPDF fallback failed or not configured. Skipping stamping for this file.', [
                    'submission_id' => $submission->id,
                ]);
                return; // give up stamping to avoid blocking the flow
            }
        }

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $tplId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($tplId);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplId);

            // Status stamp text
            $label = $this->status === 'approved' ? 'Approved by ' : 'Rejected by ';
            $text = $label . $this->by . ' • ' . $this->at;

            // Default top-right; allow override from submission watermark_x/y
            // Reserve ~160 width for text box; 20pt margin
            $xDefault = max(5, $size['width'] - 160);
            $x = $submission->watermark_x ?? data_get($pos, 'x', $xDefault);
            $y = $submission->watermark_y ?? data_get($pos, 'y', 20);
            $font = data_get($pos, 'font', 'Helvetica');
            $sizePt = data_get($pos, 'size', 12);
            $color = data_get($pos, 'color', $this->status === 'approved' ? '#0E9F6E' : '#DC2626');
            [$r, $g, $b] = $this->hexToRgb($color);

            $pdf->SetFont($font, '', $sizePt);
            $pdf->SetTextColor($r, $g, $b);
            $pdf->SetXY($x, $y);
            $pdf->Cell(150, 8, $text, 0, 0, 'L');
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
            @exec($cmd . ' 2>&1', $result, $exit);
            if ($exit === 0 && File::exists($out)) {
                return $out;
            }
            Log::error('qpdf command failed', [
                'using_path_binary' => $usePathBinary,
                'cmd' => $cmd,
                'exit' => $exit,
                'output' => $result,
            ]);
        } catch (\Throwable $t) {
            Log::error('qpdf execution error', ['error' => $t->getMessage()]);
        }
        return null;
    }
}
