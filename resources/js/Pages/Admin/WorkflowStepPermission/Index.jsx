import React, { useMemo } from "react";
import { Head, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import Swal from "sweetalert2";
import Header from "@/Components/Header";

export default function WorkflowStepPermissionIndex({
    workflow,
    steps = [],
    subdivisions = [],
}) {
    // inisialisasi permissions untuk SEMUA subdivisi pada setiap step
    const initialPermissions = useMemo(() => {
        const perms = [];
        (steps || []).forEach((step) => {
            (subdivisions || []).forEach((sub) => {
                const existing =
                    (step.permissions || []).find(
                        (p) => p.subdivision_id === sub.id
                    ) || {};
                perms.push({
                    workflow_step_id: step.id,
                    subdivision_id: sub.id,
                    can_view: !!existing.can_view,
                    can_approve: !!existing.can_approve,
                    can_reject: !!existing.can_reject,
                    can_request_next: !!existing.can_request_next,
                    can_edit: !!existing.can_edit,
                    can_delete: !!existing.can_delete,
                });
            });
        });
        return perms;
    }, [steps, subdivisions]);

    const { data, setData, post, processing } = useForm({
        permissions: initialPermissions,
    });

    // helper: get perm object for step+sub
    const findPerm = (stepId, subId) =>
        data.permissions.find(
            (p) => p.workflow_step_id === stepId && p.subdivision_id === subId
        );

    const togglePermission = (stepId, subId, field) => {
        const updated = data.permissions.map((perm) => {
            if (
                perm.workflow_step_id === stepId &&
                perm.subdivision_id === subId
            ) {
                return { ...perm, [field]: !perm[field] };
            }
            return perm;
        });
        setData("permissions", updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("workflow-steps.permissions.store", workflow.id), {
            onSuccess: () => {
                Swal.fire({
                    title: "Success",
                    text: "Permissions updated!",
                    icon: "success",
                }).then(() => {
                    // redirect setelah tombol OK atau otomatis
                    window.location.href = route("workflows.index");
                });
            },
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Header />
            <div className="flex-1 p-8">
                <Head title={`Workflow Permissions - ${workflow.name}`} />
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Workflow: {workflow.name}
                    </h2>

                    {!steps || steps.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">
                            Belum ada step dalam workflow ini.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <table className="w-full border-collapse border text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left w-48">
                                            Step
                                        </th>
                                        <th className="border p-2 text-left">
                                            Subdivisi (semua subdivisi)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {steps.map((step) => {
                                        const stepName =
                                            step.role ||
                                            `Step ${
                                                step.step_order || step.id
                                            }`;
                                        return (
                                            <tr
                                                key={step.id}
                                                className="align-top"
                                            >
                                                <td className="border p-2 font-medium bg-gray-50">
                                                    {stepName}
                                                </td>
                                                <td className="border p-2">
                                                    {(subdivisions || [])
                                                        .length === 0 ? (
                                                        <div className="text-sm text-gray-500">
                                                            Tidak ada subdivisi
                                                            yang terdaftar.
                                                        </div>
                                                    ) : (
                                                        (
                                                            subdivisions || []
                                                        ).map((sub) => {
                                                            const perm =
                                                                findPerm(
                                                                    step.id,
                                                                    sub.id
                                                                ) || {};
                                                            return (
                                                                <div
                                                                    key={sub.id}
                                                                    className="mb-3"
                                                                >
                                                                    <div className="font-medium">
                                                                        {
                                                                            sub.name
                                                                        }
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_view
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_view"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                View
                                                                            </span>
                                                                        </label>
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_approve
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_approve"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                Approve
                                                                            </span>
                                                                        </label>
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_reject
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_reject"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                Reject
                                                                            </span>
                                                                        </label>
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_request_next
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_request_next"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                Request
                                                                                Next
                                                                            </span>
                                                                        </label>
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_edit
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_edit"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                Edit
                                                                            </span>
                                                                        </label>
                                                                        <label className="inline-flex items-center gap-2">
                                                                            <Checkbox
                                                                                style={{
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                }}
                                                                                checked={
                                                                                    !!perm.can_delete
                                                                                }
                                                                                onCheckedChange={() =>
                                                                                    togglePermission(
                                                                                        step.id,
                                                                                        sub.id,
                                                                                        "can_delete"
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="text-sm">
                                                                                Delete
                                                                            </span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="flex justify-end mt-6">
                                <Button
                                    type="submit"
                                    style={{ borderRadius: "15px" }}
                                    disabled={processing}
                                >
                                    {processing ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
