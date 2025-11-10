<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Submission;
use App\Models\StampedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;

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
        $submission = Submission::with('template')
            ->findOrFail($this->submissionId);

        $inputPath = null;
        if ($submission->generated_pdf_path) {
            $inputPath = storage_path('app/private/' . $submission->generated_pdf_path);
        } elseif ($submission->file_path) {
            $origAbs = Storage::disk('private')->path($submission->file_path);
            if (strtolower(pathinfo($origAbs, PATHINFO_EXTENSION)) === 'pdf' && File::exists($origAbs)) {
                $inputPath = $origAbs;
            }
        }
        if (!$inputPath || !File::exists($inputPath)) return;

        $config = $submission->template?->config_json ?? [];
        $pos = data_get($config, 'status_positions.' . $this->status);

        $dirRel = 'submission/' . $submission->id;
        $outRel = $dirRel . '/stamped_' . $this->status . '.pdf';
        $outAbs = storage_path('app/private/' . $outRel);
        File::ensureDirectoryExists(dirname($outAbs));

        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($inputPath);

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $tplId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($tplId);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplId);

            // Status stamp text
            $label = $this->status === 'approved' ? 'Approved by ' : 'Rejected by ';
            $text = $label . $this->by . ' • ' . $this->at;

            // Default top-right if no position configured
            $x = data_get($pos, 'x', $size['width'] - 160);
            $y = data_get($pos, 'y', 20);
            $font = data_get($pos, 'font', 'Helvetica');
            $sizePt = data_get($pos, 'size', 12);
            $color = data_get($pos, 'color', $this->status === 'approved' ? '#0E9F6E' : '#DC2626');
            [$r, $g, $b] = $this->hexToRgb($color);

            $pdf->SetFont($font, '', $sizePt);
            $pdf->SetTextColor($r, $g, $b);
            $pdf->SetXY($x, $y);
            $pdf->Cell(150, 8, $text, 0, 0, 'L');
        }

        $pdf->Output($outAbs, 'F');

        $hash = @hash_file('sha256', $outAbs) ?: null;
        StampedFile::updateOrCreate(
            ['submission_id' => $submission->id, 'status' => $this->status],
            [
                'stamped_pdf_path' => $outRel,
                'stamped_pdf_hash' => $hash,
                'stamped_generated_at' => now(),
            ]
        );
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
}
