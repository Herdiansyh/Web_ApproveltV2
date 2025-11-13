<!DOCTYPE html>
<html lang="id">
<head>
    <!-- TEMPLATE_SCHEMA {
      "fields": [
        {"name": "jenis_cuti", "label": "Jenis Cuti", "type": "select", "required": true, "options": ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Cuti Menikah", "Cuti Lainnya"]},
        {"name": "tanggal_mulai", "label": "Tanggal Mulai", "type": "date", "required": true},
        {"name": "tanggal_selesai", "label": "Tanggal Selesai", "type": "date", "required": true},
        {"name": "lama_cuti", "label": "Lama Cuti (hari)", "type": "number", "required": false},
        {"name": "alasan_cuti", "label": "Alasan Cuti", "type": "textarea", "required": true},
        {"name": "kontak_selama_cuti", "label": "Kontak Selama Cuti", "type": "textarea", "required": false}
      ]
    } -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengajuan Cuti</title>
    <style>
        @page {
            margin: 24pt;
        }

        body {
            font-family: "DejaVu Sans", Helvetica, Arial, sans-serif;
            font-size: 12pt;
            color: #111827;
            line-height: 1.5;
            background-color: #ffffff;
        }

        h1 {
            font-size: 20pt;
            margin: 0 0 6pt;
            color: #111827;
        }

        .muted {
            color: #6b7280;
        }

        .small {
            font-size: 10pt;
        }

        .section {
            margin-bottom: 18pt;
        }

        .grid {
            display: grid;
            grid-template-columns: 160pt 1fr;
            row-gap: 8pt;
            column-gap: 12pt;
        }

        .label {
            font-weight: 500;
            color: #374151;
        }

        .value {
            font-weight: 600;
            color: #1f2937;
        }

        .hr {
            height: 1px;
            background-color: #e5e7eb;
            margin: 10pt 0;
            border: none;
        }

        .no-print {
            display: block;
        }

        /* Toolbar (untuk mode preview) */
        .preview-toolbar {
            position: sticky;
            top: 0;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            text-align: right;
        }

        .btn {
            display: inline-block;
            padding: 6pt 12pt;
            font-size: 10pt;
            border: 1px solid #111827;
            border-radius: 6pt;
            text-decoration: none;
            color: #111827;
            background: #f9fafb;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn:hover {
            background: #f3f4f6;
        }

        /* Stempel Approval */
        .approval-stamp {
            position: fixed;
            right: 24pt;
            bottom: 24pt;
            font-size: 10pt;
            border: 1px solid #10b981;
            border-radius: 6pt;
            background: #ecfdf5;
            color: #065f46;
            padding: 8pt 12pt;
        }

        .approval-stamp .label {
            font-weight: 700;
            margin-right: 4pt;
        }

        @media print {

            .no-print,
            .preview-toolbar {
                display: none !important;
            }

            body {
                background: #fff;
            }
        }
    </style>
</head>

<body>
    @if (!empty($preview))
        <div class="preview-toolbar no-print">
            <a href="#" class="btn" onclick="window.print(); return false;">🖨 Cetak</a>
        </div>
    @endif

    <!-- Judul -->
    <div class="section">
        <h1>Pengajuan Cuti</h1>
        <div class="muted small">Generated for submission #{{ $submission->id }} • {{ now()->format('d M Y H:i') }}</div>
        <div class="hr"></div>
    </div>

    <!-- Informasi Karyawan -->
    <div class="section">
        <div class="grid">
            <div class="label">Jenis Cuti</div>
            <div class="value">{{ data_get($data, 'jenis_cuti', '-') }}</div>

            <div class="label">Tanggal Mulai</div>
            <div class="value">{{ data_get($data, 'tanggal_mulai', '-') }}</div>

            <div class="label">Tanggal Selesai</div>
            <div class="value">{{ data_get($data, 'tanggal_selesai', '-') }}</div>

            <div class="label">Lama Cuti (hari)</div>
            <div class="value">{{ data_get($data, 'lama_cuti', '-') }}</div>

            <div class="label">Divisi</div>
            <div class="value">{{ optional($submission->user->division)->name ?? '-' }}</div>

            <div class="label">Dibuat Oleh</div>
            <div class="value">{{ $submission->user->name }}</div>
        </div>
    </div>

    <!-- Alasan Cuti -->
    <div class="section">
        <div class="label" style="margin-bottom:6pt;">Alasan Cuti</div>
        <div style="white-space: pre-wrap; line-height: 1.4;">{{ data_get($data, 'alasan_cuti', '-') }}</div>
    </div>

    <div class="section">
        <div class="label" style="margin-bottom:6pt;">Kontak Selama Cuti</div>
        <div style="white-space: pre-wrap; line-height: 1.4;">{{ data_get($data, 'kontak_selama_cuti', '-') }}</div>
    </div>

    <!-- Footer Info -->
    <div class="section small muted">
        <div class="hr"></div>
        <div>
            Template: {{ $submission->template->name ?? 'Pengajuan Cuti' }}
            v{{ $submission->template->version ?? 1 }}
        </div>
    </div>

    <!-- Approved Info -->
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
