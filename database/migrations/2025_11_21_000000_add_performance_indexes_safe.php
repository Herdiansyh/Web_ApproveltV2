<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Menambah indexes untuk optimasi query performance
     * Dengan check apakah index sudah exist
     */
    public function up(): void
    {
        // Helper function untuk safely add indexes
        $addIndexIfNotExists = function ($table, $columns, $indexName = null) {
            try {
                if (is_array($columns)) {
                    // Composite index
                    $table->index($columns, $indexName);
                } else {
                    // Single column index
                    $table->index($columns, $indexName);
                }
            } catch (\Exception $e) {
                // Index mungkin sudah ada, skip
                \Log::warning("Index might already exist: {$indexName}");
            }
        };

        // Submissions table indexes
        Schema::table('submissions', function (Blueprint $table) {
            // Check & add indexes jika belum ada
            $indexes = DB::select("SHOW INDEXES FROM submissions WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_submissions_user_id', $existingIndexNames)) {
                $table->index('user_id', 'idx_submissions_user_id');
            }
            if (!in_array('idx_submissions_division_id', $existingIndexNames)) {
                $table->index('division_id', 'idx_submissions_division_id');
            }
            if (!in_array('idx_submissions_workflow_id', $existingIndexNames)) {
                $table->index('workflow_id', 'idx_submissions_workflow_id');
            }
            if (!in_array('idx_submissions_approved_by', $existingIndexNames)) {
                $table->index('approved_by', 'idx_submissions_approved_by');
            }
            if (!in_array('idx_submissions_document_id', $existingIndexNames)) {
                $table->index('document_id', 'idx_submissions_document_id');
            }
            if (!in_array('idx_submissions_status', $existingIndexNames)) {
                $table->index('status', 'idx_submissions_status');
            }
            if (!in_array('idx_submissions_current_step', $existingIndexNames)) {
                $table->index('current_step', 'idx_submissions_current_step');
            }
            if (!in_array('idx_submissions_user_status', $existingIndexNames)) {
                $table->index(['user_id', 'status'], 'idx_submissions_user_status');
            }
            if (!in_array('idx_submissions_division_status', $existingIndexNames)) {
                $table->index(['division_id', 'status'], 'idx_submissions_division_status');
            }
            if (!in_array('idx_submissions_workflow_step', $existingIndexNames)) {
                $table->index(['workflow_id', 'current_step'], 'idx_submissions_workflow_step');
            }
            if (!in_array('idx_submissions_created_at', $existingIndexNames)) {
                $table->index('created_at', 'idx_submissions_created_at');
            }
        });

        // Users table indexes
        Schema::table('users', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM users WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_users_division_id', $existingIndexNames)) {
                $table->index('division_id', 'idx_users_division_id');
            }
            if (!in_array('idx_users_subdivision_id', $existingIndexNames)) {
                $table->index('subdivision_id', 'idx_users_subdivision_id');
            }
            if (!in_array('idx_users_role', $existingIndexNames)) {
                $table->index('role', 'idx_users_role');
            }
        });

        // Workflows table indexes
        Schema::table('workflows', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM workflows WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_workflows_document_id', $existingIndexNames)) {
                $table->index('document_id', 'idx_workflows_document_id');
            }
            if (!in_array('idx_workflows_is_active', $existingIndexNames)) {
                $table->index('is_active', 'idx_workflows_is_active');
            }
            if (!in_array('idx_workflows_active_document', $existingIndexNames)) {
                $table->index(['is_active', 'document_id'], 'idx_workflows_active_document');
            }
        });

        // WorkflowSteps table indexes
        Schema::table('workflow_steps', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM workflow_steps WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_workflow_steps_workflow_id', $existingIndexNames)) {
                $table->index('workflow_id', 'idx_workflow_steps_workflow_id');
            }
            if (!in_array('idx_workflow_steps_division_id', $existingIndexNames)) {
                $table->index('division_id', 'idx_workflow_steps_division_id');
            }
            if (!in_array('idx_workflow_steps_workflow_order', $existingIndexNames)) {
                $table->index(['workflow_id', 'step_order'], 'idx_workflow_steps_workflow_order');
            }
        });

        // SubmissionWorkflowSteps table indexes
        Schema::table('submission_workflow_steps', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM submission_workflow_steps WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_subm_wf_steps_submission_id', $existingIndexNames)) {
                $table->index('submission_id', 'idx_subm_wf_steps_submission_id');
            }
            if (!in_array('idx_subm_wf_steps_approver_id', $existingIndexNames)) {
                $table->index('approver_id', 'idx_subm_wf_steps_approver_id');
            }
            if (!in_array('idx_subm_wf_steps_step_order', $existingIndexNames)) {
                $table->index('step_order', 'idx_subm_wf_steps_step_order');
            }
            if (!in_array('idx_subm_wf_steps_status', $existingIndexNames)) {
                $table->index('status', 'idx_subm_wf_steps_status');
            }
            if (!in_array('idx_subm_wf_steps_submission_order', $existingIndexNames)) {
                $table->index(['submission_id', 'step_order'], 'idx_subm_wf_steps_submission_order');
            }
            if (!in_array('idx_subm_wf_steps_approver_status', $existingIndexNames)) {
                $table->index(['approver_id', 'status'], 'idx_subm_wf_steps_approver_status');
            }
        });

        // SubdivisionPermissions table indexes
        Schema::table('subdivision_permissions', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM subdivision_permissions WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_subdivision_permissions_subdivision_id', $existingIndexNames)) {
                $table->index('subdivision_id', 'idx_subdivision_permissions_subdivision_id');
            }
        });

        // Documents table indexes
        Schema::table('documents', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM documents WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_documents_is_active', $existingIndexNames)) {
                $table->index('is_active', 'idx_documents_is_active');
            }
        });

        // Divisions table indexes
        Schema::table('divisions', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM divisions WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_divisions_name', $existingIndexNames)) {
                $table->index('name', 'idx_divisions_name');
            }
        });

        // Subdivisions table indexes
        Schema::table('subdivisions', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM subdivisions WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_subdivisions_division_id', $existingIndexNames)) {
                $table->index('division_id', 'idx_subdivisions_division_id');
            }
            if (!in_array('idx_subdivisions_name', $existingIndexNames)) {
                $table->index('name', 'idx_subdivisions_name');
            }
        });

        // Approvals table indexes
        Schema::table('approvals', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM approvals WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_approvals_submission_id', $existingIndexNames)) {
                $table->index('submission_id', 'idx_approvals_submission_id');
            }
            if (!in_array('idx_approvals_actor_id', $existingIndexNames)) {
                $table->index('actor_id', 'idx_approvals_actor_id');
            }
            if (!in_array('idx_approvals_action', $existingIndexNames)) {
                $table->index('action', 'idx_approvals_action');
            }
        });

        // SubmissionFiles table indexes
        Schema::table('submission_files', function (Blueprint $table) {
            $indexes = DB::select("SHOW INDEXES FROM submission_files WHERE Key_name LIKE 'idx_%'");
            $existingIndexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_submission_files_submission_id', $existingIndexNames)) {
                $table->index('submission_id', 'idx_submission_files_submission_id');
            }
        });
    }

    public function down(): void
    {
        // Drop indexes (safe - akan skip jika tidak ada)
        Schema::table('submissions', function (Blueprint $table) {
            if (Schema::hasIndex('submissions', 'idx_submissions_user_id')) {
                $table->dropIndex('idx_submissions_user_id');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_division_id')) {
                $table->dropIndex('idx_submissions_division_id');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_workflow_id')) {
                $table->dropIndex('idx_submissions_workflow_id');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_approved_by')) {
                $table->dropIndex('idx_submissions_approved_by');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_document_id')) {
                $table->dropIndex('idx_submissions_document_id');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_status')) {
                $table->dropIndex('idx_submissions_status');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_current_step')) {
                $table->dropIndex('idx_submissions_current_step');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_user_status')) {
                $table->dropIndex('idx_submissions_user_status');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_division_status')) {
                $table->dropIndex('idx_submissions_division_status');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_workflow_step')) {
                $table->dropIndex('idx_submissions_workflow_step');
            }
            if (Schema::hasIndex('submissions', 'idx_submissions_created_at')) {
                $table->dropIndex('idx_submissions_created_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasIndex('users', 'idx_users_division_id')) {
                $table->dropIndex('idx_users_division_id');
            }
            if (Schema::hasIndex('users', 'idx_users_subdivision_id')) {
                $table->dropIndex('idx_users_subdivision_id');
            }
            if (Schema::hasIndex('users', 'idx_users_role')) {
                $table->dropIndex('idx_users_role');
            }
        });

        Schema::table('workflows', function (Blueprint $table) {
            if (Schema::hasIndex('workflows', 'idx_workflows_document_id')) {
                $table->dropIndex('idx_workflows_document_id');
            }
            if (Schema::hasIndex('workflows', 'idx_workflows_is_active')) {
                $table->dropIndex('idx_workflows_is_active');
            }
            if (Schema::hasIndex('workflows', 'idx_workflows_active_document')) {
                $table->dropIndex('idx_workflows_active_document');
            }
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            if (Schema::hasIndex('workflow_steps', 'idx_workflow_steps_workflow_id')) {
                $table->dropIndex('idx_workflow_steps_workflow_id');
            }
            if (Schema::hasIndex('workflow_steps', 'idx_workflow_steps_division_id')) {
                $table->dropIndex('idx_workflow_steps_division_id');
            }
            if (Schema::hasIndex('workflow_steps', 'idx_workflow_steps_workflow_order')) {
                $table->dropIndex('idx_workflow_steps_workflow_order');
            }
        });

        Schema::table('submission_workflow_steps', function (Blueprint $table) {
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_submission_id')) {
                $table->dropIndex('idx_subm_wf_steps_submission_id');
            }
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_approver_id')) {
                $table->dropIndex('idx_subm_wf_steps_approver_id');
            }
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_step_order')) {
                $table->dropIndex('idx_subm_wf_steps_step_order');
            }
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_status')) {
                $table->dropIndex('idx_subm_wf_steps_status');
            }
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_submission_order')) {
                $table->dropIndex('idx_subm_wf_steps_submission_order');
            }
            if (Schema::hasIndex('submission_workflow_steps', 'idx_subm_wf_steps_approver_status')) {
                $table->dropIndex('idx_subm_wf_steps_approver_status');
            }
        });

        Schema::table('subdivision_permissions', function (Blueprint $table) {
            if (Schema::hasIndex('subdivision_permissions', 'idx_subdivision_permissions_subdivision_id')) {
                $table->dropIndex('idx_subdivision_permissions_subdivision_id');
            }
        });

        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasIndex('documents', 'idx_documents_is_active')) {
                $table->dropIndex('idx_documents_is_active');
            }
        });

        Schema::table('divisions', function (Blueprint $table) {
            if (Schema::hasIndex('divisions', 'idx_divisions_name')) {
                $table->dropIndex('idx_divisions_name');
            }
        });

        Schema::table('subdivisions', function (Blueprint $table) {
            if (Schema::hasIndex('subdivisions', 'idx_subdivisions_division_id')) {
                $table->dropIndex('idx_subdivisions_division_id');
            }
            if (Schema::hasIndex('subdivisions', 'idx_subdivisions_name')) {
                $table->dropIndex('idx_subdivisions_name');
            }
        });

        Schema::table('approvals', function (Blueprint $table) {
            if (Schema::hasIndex('approvals', 'idx_approvals_submission_id')) {
                $table->dropIndex('idx_approvals_submission_id');
            }
            if (Schema::hasIndex('approvals', 'idx_approvals_actor_id')) {
                $table->dropIndex('idx_approvals_actor_id');
            }
            if (Schema::hasIndex('approvals', 'idx_approvals_action')) {
                $table->dropIndex('idx_approvals_action');
            }
        });

        Schema::table('submission_files', function (Blueprint $table) {
            if (Schema::hasIndex('submission_files', 'idx_submission_files_submission_id')) {
                $table->dropIndex('idx_submission_files_submission_id');
            }
        });
    }
};
