<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class VerificationController extends Controller
{
    /**
     * Halaman verifikasi publik berdasarkan token.
     */
    public function show(string $token)
    {
        $submission = Submission::with(['user.division', 'workflow.document'])
            ->where('verification_token', $token)
            ->first();

        $isValid = (bool) $submission;

        $qrSvg = null;
        if ($submission) {
            // Pastikan file QR tersimpan di storage publik untuk akses via <img>
            if (empty($submission->qr_code_path)) {
                $dir = 'qrcodes/submissions';
                $filename = $submission->id . '.svg';
                $relativePath = $dir . '/' . $filename;

                if (!Storage::disk('public')->exists($dir)) {
                    Storage::disk('public')->makeDirectory($dir);
                }

                $verifyUrl = route('verification.show', $token);
                $svg = QrCode::format('svg')
                    ->size(200)
                    ->margin(1)
                    ->errorCorrection('M')
                    ->generate($verifyUrl);

                Storage::disk('public')->put($relativePath, $svg);
                $submission->qr_code_path = $relativePath;
                $submission->save();

                $qrSvg = $svg;
            } else {
                // Selalu siapkan inline SVG sebagai fallback agar tampil meski tag <img> gagal merender SVG
                $verifyUrl = route('verification.show', $token);
                $qrSvg = QrCode::format('svg')
                    ->size(200)
                    ->margin(1)
                    ->errorCorrection('M')
                    ->generate($verifyUrl);
            }
        }

        return view('verification.show', [
            'isValid' => $isValid,
            'submission' => $submission,
            'qrSvg' => $qrSvg,
        ]);
    }
}
