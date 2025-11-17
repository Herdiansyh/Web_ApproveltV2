<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use Illuminate\Http\Request;

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

        return view('verification.show', [
            'isValid' => $isValid,
            'submission' => $submission,
        ]);
    }
}
