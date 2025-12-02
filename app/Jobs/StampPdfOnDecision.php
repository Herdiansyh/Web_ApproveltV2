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
    protected array $approvers; // array of all approvers with their data

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

            // Prepare stamp text untuk semua approver dalam satu baris
            $label = 'APPROVED BY';
            $approverNames = [];
            $approverDates = [];
            
            foreach ($this->approvers as $approver) {
                $approverNames[] = strtoupper($approver['name']);
                if (!empty($approver['approved_at'])) {
                    $approverDates[] = \Carbon\Carbon::parse($approver['approved_at'])->format('d/m/Y H:i');
                }
            }
            
            $allApproversText = implode(' • ', $approverNames);
            $allDatesText = implode(' • ', $approverDates);

            // Stamp dengan teks dan hiasan
            $rightMargin = 10;
            $bottomMargin = 10;
            $fontSize = 9;
            $smallFontSize = 6;

            // Set font untuk kalkulasi width
            $pdf->SetFont('Helvetica', 'B', $fontSize);
            $labelWidth = $pdf->GetStringWidth($label);
            $approversWidth = $pdf->GetStringWidth($allApproversText);
            $maxWidth = max($labelWidth, $approversWidth) + 8; // Tambah padding lebih banyak

            $x = $submission->watermark_x ?? ($size['width'] - $maxWidth - $rightMargin);
            $y = $submission->watermark_y ?? ($size['height'] - 35 - $bottomMargin); // Tambah height untuk multiple lines

            // Warna stamp berdasarkan status
            $textColor = $this->status === 'approved' ? [6, 95, 70] : [220, 38, 38]; // #065f46 / #dc2626
            $accentColor = $this->status === 'approved' ? [34, 197, 94] : [239, 68, 68]; // #22c55e / #ef4444

            // Draw decorative lines (hiasan untuk anti-kopi)
            $pdf->SetDrawColor(...$accentColor);
            $pdf->SetLineWidth(0.5);
            
            // Garis atas
            $pdf->Line($x - 3, $y, $x + $maxWidth + 3, $y);
            
            // Garis bawah (lebih panjang untuk multiple lines)
            $pdf->Line($x - 3, $y + 25, $x + $maxWidth + 3, $y + 25);

            // Draw small decorative corners (sudut dekoratif)
            $cornerSize = 2;
            // Kiri atas
            $pdf->Line($x - 3, $y, $x - 3 + $cornerSize, $y);
            $pdf->Line($x - 3, $y, $x - 3, $y + $cornerSize);
            // Kanan atas
            $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3 - $cornerSize, $y);
            $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3, $y + $cornerSize);
            // Kiri bawah
            $pdf->Line($x - 3, $y + 25, $x - 3 + $cornerSize, $y + 25);
            $pdf->Line($x - 3, $y + 25, $x - 3, $y + 25 - $cornerSize);
            // Kanan bawah
            $pdf->Line($x + $maxWidth + 3, $y + 25, $x + $maxWidth + 3 - $cornerSize, $y + 25);
            $pdf->Line($x + $maxWidth + 3, $y + 25, $x + $maxWidth + 3, $y + 25 - $cornerSize);

            // Tulis label (APPROVED BY)
            $pdf->SetFont('Helvetica', 'B', $fontSize);
            $pdf->SetTextColor(...$textColor);
            $pdf->SetXY($x, $y + 2);
            $pdf->Cell($maxWidth, 4, $label, 0, 1, 'C', false);

            // Tulis semua nama approver dalam satu baris
            $pdf->SetFont('Helvetica', 'B', $fontSize + 1);
            $pdf->SetXY($x, $y + 6);
            $pdf->Cell($maxWidth, 5, $allApproversText, 0, 1, 'C', false);

            // Tulis semua tanggal dengan font kecil
            $pdf->SetFont('Helvetica', '', $smallFontSize);
            $pdf->SetTextColor(100, 100, 100); // abu-abu
            $pdf->SetXY($x, $y + 12);
            $pdf->Cell($maxWidth, 3, $allDatesText, 0, 1, 'C', false);
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
