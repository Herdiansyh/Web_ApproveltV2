<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifikasi Dokumen</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background: #f9fafb; margin:0; padding:0; }
        .container { max-width: 720px; margin: 40px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
        .title { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
        .muted { color: #6b7280; font-size: 14px; }
        .badge { display:inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight:600; }
        .badge.ok { background:#ecfdf5; color:#065f46; border:1px solid #10b981; }
        .badge.fail { background:#fef2f2; color:#991b1b; border:1px solid #ef4444; }
        .grid { display: grid; grid-template-columns: 160px 1fr; gap: 8px 12px; margin-top: 16px; }
        .label { color:#374151; font-weight:600; }
        .value { color:#111827; font-weight:500; }
        .footer { margin-top: 20px; color:#6b7280; font-size: 13px; }
        a.btn { display:inline-block; margin-top:16px; padding:8px 12px; border:1px solid #111827; border-radius:8px; color:#111827; text-decoration:none; }
        a.btn:hover{ background:#f3f4f6; }
    </style>
</head>
<body>
    <div class="container">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div>
                <div class="title">Verifikasi Dokumen</div>
                <div class="muted">Pemeriksaan keaslian melalui QR Code</div>
            </div>
            @if($isValid)
                <span class="badge ok">Dokumen Valid</span>
            @else
                <span class="badge fail">Dokumen Tidak Valid</span>
            @endif
        </div>

        @if(!$isValid)
            <p style="margin-top:16px;">Token verifikasi tidak ditemukan atau tidak sesuai. Silakan hubungi penerbit dokumen.</p>
            <div class="footer">© {{ date('Y') }} E-Approval</div>
        @else
            <div class="grid">
                <div class="label">Submission ID</div>
                <div class="value">#{{ $submission->id }}</div>

                <div class="label">Dokumen</div>
                <div class="value">{{ $submission->workflow?->document?->name ?? '-' }}</div>

                <div class="label">Judul</div>
                <div class="value">{{ $submission->title ?? '-' }}</div>

                <div class="label">Series Code</div>
                <div class="value">{{ $submission->series_code ?? '-' }}</div>

                <div class="label">Status</div>
                <div class="value">{{ $submission->status ?? '-' }}</div>

                <div class="label">Dibuat oleh</div>
                <div class="value">{{ $submission->user?->name ?? '-' }} ({{ $submission->user?->division?->name ?? '-' }})</div>

                <div class="label">Dibuat pada</div>
                <div class="value">{{ $submission->created_at?->format('d M Y H:i') }}</div>
            </div>

            @if(!empty($submission->qr_code_path))
                <div style="margin-top:16px;" class="muted">QR Code penyusun dokumen:</div>
                <img alt="QR Code" src="{{ asset('storage/'.$submission->qr_code_path) }}" style="width:140px; height:140px; border:1px solid #e5e7eb; border-radius:8px;" />
            @endif

            <a class="btn" href="{{ route('submissions.printDocument', $submission->id) }}" target="_blank">Lihat Halaman Cetak</a>

            <div class="footer">© {{ date('Y') }} E-Approval</div>
        @endif
    </div>
</body>
</html>
