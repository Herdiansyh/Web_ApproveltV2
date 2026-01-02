<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminActivityController extends Controller
{
    /**
     * Get recent activities with pagination and search
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $page = $request->get('page', 1);
        $perPage = 10;

        $query = Submission::with(['user:id,name', 'workflow.document:id,name'])
            ->select([
                'id', 
                'title', 
                'user_id', 
                'workflow_id',
                'status', 
                'created_at', 
                'updated_at'
            ])
            ->whereHas('user') // Hanya submission yang memiliki user
            ->whereHas('workflow'); // Hanya submission yang memiliki workflow

        // Search by user name or submission title
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($subQuery) use ($search) {
                    $subQuery->where('name', 'LIKE', '%' . $search . '%');
                })
                ->orWhere('title', 'LIKE', '%' . $search . '%');
            });
        }

        $submissions = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        // Transform data for frontend
        $activities = $submissions->getCollection()->map(function ($submission) {
            return [
                'id' => $submission->id,
                'user' => $submission->user->name ?? 'Pengguna Tidak Diketahui',
                'title' => $submission->title ?: 'Tanpa Judul',
                'document_type' => $submission->workflow->document ? $submission->workflow->document->name : 'Tidak Ada Tipe Dokumen',
                'status' => $submission->status,
                'action' => $this->getActionDescription($submission),
                'time' => $submission->created_at->translatedFormat('d M Y H:i'),
                'relative_time' => $submission->created_at->diffForHumans(),
                'show_url' => route('submissions.show', $submission->id),
            ];
        });

        return response()->json([
            'activities' => $activities,
            'pagination' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
                'from' => $submissions->firstItem(),
                'to' => $submissions->lastItem(),
            ],
            'search' => $search,
        ]);
    }

    /**
     * Generate action description based on submission status
     */
    private function getActionDescription($submission)
    {
        $status = strtolower($submission->status);
        $title = $submission->title ?: 'dokumen tanpa judul';
        
        if (str_contains($status, 'approved')) {
            return 'mengajuan "' . $title . '" yang telah disetujui';
        } elseif (str_contains($status, 'rejected')) {
            return 'mengajuan "' . $title . '" yang ditolak';
        } elseif (str_contains($status, 'cancelled')) {
            return 'membatalkan pengajuan "' . $title . '"';
        } elseif (str_contains($status, 'pending')) {
            return 'mengajukan "' . $title . '"';
        } else {
            return 'mengajukan "' . $title . '"';
        }
    }
}
