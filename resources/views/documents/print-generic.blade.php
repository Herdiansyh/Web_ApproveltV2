<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumen</title>
    <style>
        @page { margin: 24pt; }
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 12pt; color: #111827; }
        h1 { font-size: 18pt; margin: 0 0 8pt; }
        .muted { color: #6b7280; }
        .section { margin-bottom: 16pt; }
        .grid { display: grid; grid-template-columns: 180pt 1fr; gap: 6pt 12pt; }
        .label { color: #374151; }
        .value { font-weight: 600; white-space: pre-wrap; }
        .hr { height: 1px; background: #e5e7eb; margin: 10pt 0; }
        .small { font-size: 10pt; }
        .preview-toolbar { position: sticky; top: 0; background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 8pt 0; margin-bottom: 12pt; }
        .preview-toolbar .btn { display: inline-block; padding: 6pt 10pt; border: 1px solid #111827; border-radius: 6pt; font-size: 10pt; text-decoration: none; color: #111827; }
        .preview-toolbar .btn:hover { background: #f3f4f6; }
        .approval-stamp { position: fixed; right: 24pt; bottom: 24pt; font-size: 10pt; color: #065f46; border: 1px solid #10b981; padding: 6pt 10pt; border-radius: 6pt; background: #ecfdf5; }
        .approval-stamp .label { font-weight: 700; margin-right: 6pt; }
        @media print { .preview-toolbar { display: none !important; } }
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <a href="#" class="btn" onclick="window.print(); return false;">🖨 Cetak</a>
    </div>

    <div class="section">
        <h1>{{ $submission->workflow?->document?->name ?? 'Dokumen' }}</h1>
        <div class="muted small">Submission #{{ $submission->id }} • {{ now()->format('d M Y H:i') }}</div>
        <div class="hr"></div>
    </div>

    <div class="section">
        <div class="grid">
            @foreach(($fields ?? []) as $f)
                <div class="label">{{ $f->label }}</div>
                <div class="value">{{ data_get($data, $f->name, '-') }}</div>
            @endforeach
        </div>
    </div>

    <div class="section small muted">
        <div class="hr"></div>
        <div>Dokumen: {{ $submission->workflow?->document?->name ?? '-' }}</div>
    </div>

    @if(!empty($approvedBy))
        <div class="approval-stamp">
            <span class="label">Approved by</span>
            <span>{{ $approvedBy }}</span>
            @if(!empty($approvedAt))
                <span>• {{ $approvedAt }}</span>
            @endif
        </div>
    @endif
</body>
</html>
