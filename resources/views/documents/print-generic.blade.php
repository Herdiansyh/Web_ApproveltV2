<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumen</title>
    <style>
        @page {
            margin: 32pt;
        }

        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            font-size: 11pt;
            color: #111827;
            line-height: 1.45;
        }

        /* Header */
        .doc-header {
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 10pt;
            margin-bottom: 20pt;
        }

        .doc-title {
            font-size: 20pt;
            font-weight: 700;
            margin: 0;
        }

        .doc-meta {
            font-size: 10pt;
            color: #6b7280;
            margin-top: 4pt;
        }

        /* Section layout */
        .section {
            margin-bottom: 20pt;
        }

        /* Grid untuk isi dokumen */
        .fields-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
        }

        .fields-table td {
            padding: 6pt 4pt;
            vertical-align: top;
        }

        .fields-table td.label {
            width: 180pt;
            font-weight: 600;
            color: #374151;
        }

        .fields-table td.value {
            font-weight: 500;
            color: #111827;
            white-space: pre-wrap;
        }

        .fields-table tr:nth-child(even) {
            background: #f9fafb;
        }

        /* Footer dokumen */
        .doc-footer {
            margin-top: 28pt;
            padding-top: 10pt;
            border-top: 1px solid #d1d5db;
            font-size: 10pt;
            color: #6b7280;
        }

        /* Approval stamp */
        .approval-stamp {
            position: fixed;
            right: 32pt;
            bottom: 32pt;
            font-size: 10pt;
            color: #065f46;
            border: 1px solid #10b981;
            padding: 8pt 12pt;
            border-radius: 6pt;
            background: #ecfdf5;
        }

        .approval-stamp .label {
            font-weight: 700;
            margin-right: 4pt;
        }

        /* Print toolbar (hide on print) */
        .preview-toolbar {
            position: sticky;
            top: 0;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 8pt 0;
            margin-bottom: 12pt;
        }

        .preview-toolbar .btn {
            display: inline-block;
            padding: 6pt 10pt;
            border: 1px solid #111827;
            border-radius: 6pt;
            font-size: 10pt;
            text-decoration: none;
            color: #111827;
        }

        .preview-toolbar .btn:hover {
            background: #f3f4f6;
        }

        @media print {
            .preview-toolbar {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div class="preview-toolbar">
        <a href="#" class="btn" onclick="window.print(); return false;">🖨 Cetak</a>
    </div>

    <!-- HEADER -->
    <div class="doc-header">
        <h1 class="doc-title">
            {{ $submission->workflow?->document?->name ?? 'Dokumen' }}
        </h1>
        <div class="doc-meta">
            Submission #{{ $submission->id }} • {{ now()->format('d M Y H:i') }}
        </div>
    </div>

    <!-- DATA FIELDS -->
    <div class="section">
        <table class="fields-table">
            @foreach ($fields ?? [] as $f)
                <tr>
                    <td class="label">{{ $f->label }}</td>
                    <td class="value">{{ data_get($data, $f->name, '-') }}</td>
                </tr>
            @endforeach
        </table>
    </div>

    <!-- FOOTER -->
    <div class="doc-footer">
        Dokumen: {{ $submission->workflow?->document?->name ?? '-' }}
    </div>

    <!-- APPROVAL BADGE -->
    @if (!empty($approvedBy))
        <div class="approval-stamp">
            <span class="label">Approved by</span>
            <span>{{ $approvedBy }}</span>
            @if (!empty($approvedAt))
                <span>• {{ $approvedAt }}</span>
            @endif
        </div>
    @endif

</body>

</html>
