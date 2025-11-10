<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
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

        Browsershot::html($html)
            ->format($pageSize)
            ->margins($margins['top'] ?? 24, $margins['right'] ?? 24, $margins['bottom'] ?? 24, $margins['left'] ?? 24)
            ->showBackground()
            ->savePdf($abs);

        $hash = @hash_file('sha256', $abs) ?: null;

        $submission->generated_pdf_path = $fileRel;
        $submission->generated_pdf_hash = $hash;
        $submission->save();
    }
}
