<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumen Pengajuan</title>

    <style>
        @page {
            margin: 32pt;
        }

        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            font-size: 11pt;
            color: #111827;
            line-height: 1;
        }

        /* Header */
        .doc-header {
            padding-bottom: 14pt;
            margin-bottom: 24pt;
            border-bottom: 2px solid #d1d5db;
        }

        .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8pt;
        }

        .doc-title {
            font-size: 22pt;
            font-weight: 700;
            margin: 0;
        }

        .series-box {
            text-align: right;
            font-size: 11pt;
            padding: 6pt 10pt;
            border: 1px solid #d1d5db;
            border-radius: 6pt;
            background: #f9fafb;
            min-width: 120pt;
        }

        .doc-meta {
            font-size: 10pt;
            color: #4b5563;
            margin-top: 4pt;
        }

        /* Sections */
        .section-title {
            font-size: 12pt;
            font-weight: 700;
            margin-bottom: 8pt;
            color: #374151;
        }

        .section {
            margin-bottom: 22pt;
        }

        /* Table layout */
        .fields-table {
            width: 100%;
            border-collapse: collapse;
        }

        .fields-table td {
            padding: 7pt 6pt;
            vertical-align: top;
        }

        .fields-table td.label {
            width: 180pt;
            font-weight: 600;
            color: #374151;
            background: #f3f4f6;
        }

        .fields-table td.value {
            font-weight: 500;
            color: #111827;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
        }

        /* Footer */
        .doc-footer {
            margin-top: 32pt;
            padding-top: 12pt;
            border-top: 1.5px solid #d1d5db;
            font-size: 10pt;
            color: #6b7280;
        }

        /* QR Code */
        .qr-block {
            margin-top: 20pt;
            display: flex;
            align-items: center;
            gap: 12pt;
        }

        .qr-block .qr-svg,
        .qr-block img {
            width: 90pt;
            height: 90pt;
            border: 1.5px solid #d1d5db;
            border-radius: 6pt;
        }

        .qr-block .qr-svg svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        .qr-note {
            font-size: 9pt;
            color: #6b7280;
        }

        /* Approval */
        .approval-stamp {
            position: fixed;
            right: 32pt;
            bottom: 32pt;
            padding: 10pt 14pt;
            border-radius: 6pt;
            border: 1.5px solid #10b981;
            background: #ecfdf5;
            color: #065f46;
            font-size: 10pt;
        }

        .approval-stamp .label {
            font-weight: 700;
        }

        /* Print toolbar */
        .preview-toolbar {
            position: sticky;
            top: 0;
            background: #ffffff;
            border-bottom: 1.5px solid #e5e7eb;
            padding: 10pt 0;
            margin-bottom: 14pt;
        }

        .preview-toolbar .btn {
            padding: 6pt 10pt;
            border: 1.5px solid #111827;
            border-radius: 6pt;
            font-size: 10pt;
            text-decoration: none;
            color: #111827;
        }

        @media print {
            .preview-toolbar {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <!-- PRINT BUTTON -->
    <div class="preview-toolbar">
        <a href="#" class="btn" onclick="window.print(); return false;">🖨 Cetak</a>
    </div>

    <!-- HEADER -->
    <div class="doc-header">

        <div class="header-row">
            <!-- Title -->
            <h1 class="doc-title">
                {{ $submission->workflow?->document?->name ?? 'Dokumen Pengajuan' }}
            </h1>

            <!-- Series -->
            @if (!empty($submission->series_code))
                <div class="series-box">
                    <strong>{{ $submission->series_code }}</strong>
                </div>
            @endif
        </div>

        <div class="doc-meta">
            Nomor Pengajuan: <strong>#{{ $submission->id }}</strong>
            &nbsp;•&nbsp;
            Tanggal: {{ now()->format('d M Y, H:i') }}
        </div>

        @if (!empty($submission->title))
            <div class="doc-meta">
                Judul: <strong>{{ $submission->title }}</strong>
            </div>
        @endif

        @if (!empty($submission->description))
            <div class="doc-meta">
                Deskripsi: {{ $submission->description }}
            </div>
        @endif
    </div>

    <!-- IDENTITAS PENGAJU -->
    <div class="section">
        <div class="section-title">Data Pemohon</div>
        <table class="fields-table">
            <tr>
                <td class="label">Nama</td>
                <td class="value">{{ $submission->user?->name ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Divisi</td>
                <td class="value">{{ $submission->user?->division?->name ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <!-- DETAIL PENGAJUAN -->
    <div class="section">
        <div class="section-title">Detail Pengajuan</div>
        <table class="fields-table">
            @foreach (($fields ?? [])->sortBy('order') as $f)
                @if ($f->type === 'label')
                    <tr>
                        <td colspan="2" style="padding: 8pt 0;">
                            <div
                                style="font-size: 14pt; font-weight: 700; color: #1f2937; border-bottom: 2px solid #374151; padding-bottom: 4pt; margin-bottom: 8pt;">
                                {{ $f->label }}
                            </div>
                        </td>
                    </tr>
                @else
                    <tr>
                        <td class="label">{{ $f->label }}</td>
                        <td class="value">{{ data_get($data, $f->name, '-') }}</td>
                    </tr>
                @endif
            @endforeach
        </table>
    </div>

    <!-- DATA TABEL DINAMIS -->
    @if (!empty($data['tableData']) && !empty($data['tableColumns']) && count($data['tableData']) > 0)
        <div class="section">
            <div class="section-title">Data Tabel</div>

            <table class="dynamic-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20pt;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        @foreach ($data['tableColumns'] as $column)
                            <th
                                style="border: 1px solid #d1d5db; padding: 8pt; text-align: left; font-weight: 600; font-size: 10pt;">
                                {{ $column['name'] }}
                            </th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach ($data['tableData'] as $row)
                        <tr>
                            @foreach ($data['tableColumns'] as $column)
                                <td
                                    style="border: 1px solid #d1d5db; padding: 6pt; font-size: 9pt; vertical-align: top;">
                                    {{ $row[$column['key']] ?? '-' }}
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="font-size: 8pt; color: #6b7280; margin-top: 4pt;">
                Total {{ count($data['tableData']) }} baris
            </div>
        </div>
    @endif

    <!-- FOOTER -->
    <div class="doc-footer">
        Dokumen: {{ $submission->workflow?->document?->name ?? '-' }}
    </div>

    <!-- QR CODE -->
    @if (!empty($qrSvg) || !empty($submission->qr_code_path))
        <div class="qr-block">

            @if (!empty($qrSvg))
                <div class="qr-svg">{!! $qrSvg !!}</div>
            @else
                @php
                    $qrPath = $submission->qr_code_path ?? null;
                    $svgContent = null;

                    if ($qrPath && strtolower(pathinfo($qrPath, PATHINFO_EXTENSION)) === 'svg') {
                        try {
                            $full = public_path('storage/' . $qrPath);
                            if (file_exists($full)) {
                                $svgContent = file_get_contents($full);
                            }
                        } catch (\Throwable $e) {
                        }
                    }
                @endphp

                @if ($svgContent)
                    <div class="qr-svg">{!! $svgContent !!}</div>
                @else
                    <img src="{{ asset('storage/' . $submission->qr_code_path) }}" alt="QR Code" />
                @endif
            @endif

        </div>
    @endif

    <!-- APPROVAL -->
    @if (!empty($approvedBy))
        <div class="approval-stamp">
            <span class="label">Approved by:</span>
            {{ $approvedBy }}
            @if (!empty($approvedAt))
                • {{ $approvedAt }}
            @endif
        </div>
    @endif

</body>

</html>
