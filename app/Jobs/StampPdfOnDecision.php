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

            // Hanya tambahkan stamp di halaman terakhir
            if ($pageNo === $pageCount) {

            // Prepare stamp text untuk semua approver dalam satu baris
            $label = 'APPROVED BY';
            $approverNames = [];
            $approverDates = [];
            
            // Untuk dokumen eksternal, hanya tampilkan approver terakhir
            $isExternalDocument = !$submission->generated_pdf_path && $submission->file_path;
            
            if ($isExternalDocument && count($this->approvers) > 1) {
                // Ambil hanya approver terakhir untuk dokumen eksternal
                $lastApprover = end($this->approvers);
                $approverNames = [strtoupper($lastApprover['name'])];
                $approverDates = [];
                if (!empty($lastApprover['approved_at'])) {
                    $approverDates[] = \Carbon\Carbon::parse($lastApprover['approved_at'])->format('d/m/Y H:i');
                }
            } else {
                // Untuk dokumen generated atau hanya 1 approver, tampilkan semua
                foreach ($this->approvers as $approver) {
                    $approverNames[] = strtoupper($approver['name']);
                    if (!empty($approver['approved_at'])) {
                        $approverDates[] = \Carbon\Carbon::parse($approver['approved_at'])->format('d/m/Y H:i');
                    }
                }
            }
            
            $allApproversText = implode(' • ', $approverNames);
            $allDatesText = implode(' • ', $approverDates);

            // Hitung tinggi total yang dibutuhkan (tetap konstan karena semua nama dalam satu baris)
            $baseHeight = 25; // tinggi tetap untuk layout horizontal
            $totalHeight = $baseHeight;
            
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
            $y = $submission->watermark_y ?? ($size['height'] - $totalHeight - $bottomMargin); // Gunakan tinggi dinamis

            // Warna stamp berdasarkan status
            $textColor = $this->status === 'approved' ? [6, 95, 70] : [220, 38, 38]; // #065f46 / #dc2626
            $accentColor = $this->status === 'approved' ? [34, 197, 94] : [239, 68, 68]; // #22c55e / #ef4444

            // Draw decorative lines (hiasan untuk anti-kopi)
            $pdf->SetDrawColor(...$accentColor);
            $pdf->SetLineWidth(0.5);
            
            // Garis atas
            $pdf->Line($x - 3, $y, $x + $maxWidth + 3, $y);
            
            // Garis bawah (menyesuaikan dengan tinggi dinamis)
            $pdf->Line($x - 3, $y + $totalHeight, $x + $maxWidth + 3, $y + $totalHeight);

            // Draw small decorative corners (sudut dekoratif)
            $cornerSize = 2;
            // Kiri atas
            $pdf->Line($x - 3, $y, $x - 3 + $cornerSize, $y);
            $pdf->Line($x - 3, $y, $x - 3, $y + $cornerSize);
            // Kanan atas
            $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3 - $cornerSize, $y);
            $pdf->Line($x + $maxWidth + 3, $y, $x + $maxWidth + 3, $y + $cornerSize);
            // Kiri bawah
            $pdf->Line($x - 3, $y + $totalHeight, $x - 3 + $cornerSize, $y + $totalHeight);
            $pdf->Line($x - 3, $y + $totalHeight, $x - 3, $y + $totalHeight - $cornerSize);
            // Kanan bawah
            $pdf->Line($x + $maxWidth + 3, $y + $totalHeight, $x + $maxWidth + 3 - $cornerSize, $y + $totalHeight);
            $pdf->Line($x + $maxWidth + 3, $y + $totalHeight, $x + $maxWidth + 3, $y + $totalHeight - $cornerSize);

            // Tulis label (APPROVED BY)
            $pdf->SetFont('Helvetica', 'B', $fontSize);
            $pdf->SetTextColor(...$textColor);
            $pdf->SetXY($x, $y + 2);
            $pdf->Cell($maxWidth, 4, $label, 0, 1, 'C', false);

            // Tulis semua nama approver dalam satu baris (horizontal)
            $pdf->SetFont('Helvetica', 'B', $fontSize + 1);
            $pdf->SetXY($x, $y + 6);
            $pdf->Cell($maxWidth, 5, $allApproversText, 0, 1, 'C', false);

            // Tulis semua tanggal dengan font kecil
            $pdf->SetFont('Helvetica', '', $smallFontSize);
            $pdf->SetTextColor(100, 100, 100); // abu-abu
            $pdf->SetXY($x, $y + 11);
            $pdf->Cell($maxWidth, 3, $allDatesText, 0, 1, 'C', false);

            // Tambahkan QR Code di sebelah kiri stamp
            try {
                $verifyUrl = route('verification.show', $submission->short_code);
                $qrSvg = QrCode::format('svg')
                    ->size(90)
                    ->margin(1)
                    ->errorCorrection('M')
                    ->generate($verifyUrl);

                // Konversi SVG ke gambar untuk PDF
                $qrTempPath = sys_get_temp_dir() . '/qr_' . $submission->id . '.png';
                $qrPng = QrCode::format('png')
                    ->size(90)
                    ->margin(1)
                    ->errorCorrection('M')
                    ->generate($verifyUrl);
                
                file_put_contents($qrTempPath, $qrPng);
                
                // Posisikan QR code di sebelah kiri stamp
                $qrSize = 35; // 35pt ~ 12.5mm
                $qrX = $x - $qrSize - 15; // 15pt margin dari stamp
                $qrY = $y + ($totalHeight / 2) - ($qrSize / 2); // Center vertical
                
                $pdf->Image($qrTempPath, $qrX, $qrY, $qrSize, $qrSize, 'PNG');
                
                // Hapus file temporary
                if (file_exists($qrTempPath)) {
                    unlink($qrTempPath);
                }
                
                // Tambahkan label QR code
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
