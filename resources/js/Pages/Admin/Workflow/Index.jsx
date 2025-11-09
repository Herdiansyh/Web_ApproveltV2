import React, { useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { Edit, Trash2, Plus, ArrowRight, Settings } from "lucide-react";
import Swal from "sweetalert2";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { Separator } from "@/Components/ui/separator";

export default function Index({
    flash,
    auth,
    workflows,
    divisions,
    documents,
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [filterDocument, setFilterDocument] = useState("all");

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: "",
        description: "",
        document_id: "",
        steps: [{ division_id: "", step_name: "" }],
    });

    // Fungsi untuk menampilkan notifikasi error
    const showErrorAlert = (title, text = "") => {
        Swal.fire({
            icon: "error",
            title: title,
            text: text,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc2626",
        });
    };

    // Fungsi untuk menampilkan notifikasi error dari response server
    const showServerErrorAlert = (error) => {
        let errorMessage = "Terjadi kesalahan yang tidak diketahui";

        if (typeof error === "string") {
            errorMessage = error;
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === "object") {
            errorMessage = Object.values(error).flat().join(", ");
        }

        showErrorAlert("Operation Failed", errorMessage);
    };

    // Filter workflows
    const filteredWorkflows = workflows.filter((wf) => {
        const matchText = wf.name
            .toLowerCase()
            .includes(filterText.toLowerCase());
        const matchDocument =
            filterDocument === "all" || wf.document?.name === filterDocument;
        return matchText && matchDocument;
    });

    // Modal handlers
    const openCreateModal = () => {
        setEditingWorkflow(null);
        reset();
        setData({
            name: "",
            description: "",
            document_id: "",
            steps: [{ division_id: "", step_name: "", actions: [] }],
        });
        setShowModal(true);
    };

    const openEditModal = (workflow) => {
        setEditingWorkflow(workflow);
        setData({
            name: workflow.name,
            description: workflow.description || "",
            document_id: workflow.document_id?.toString() || "",
            steps: workflow.steps?.map((s) => {
                // Parse actions jika masih string
                let actionsArray = [];
                if (s.actions) {
                    if (typeof s.actions === "string") {
                        try {
                            actionsArray = JSON.parse(s.actions);
                        } catch (e) {
                            actionsArray = [];
                        }
                    } else if (Array.isArray(s.actions)) {
                        actionsArray = s.actions;
                    }
                }

                // Load existing permissions
                const permissionsArray = (s.permissions || []).map((p) => ({
                    subdivision_id: p.subdivision_id,
                    can_view: p.can_view || false,
                    can_approve: p.can_approve || false,
                    can_reject: p.can_reject || false,
                    can_request_next: p.can_request_next || false,
                }));

                return {
                    division_id: s.division_id?.toString() || "",
                    step_name: s.role || `Step ${s.step_order}`,
                    actions: actionsArray, // Include actions
                    permissions: permissionsArray, // Include permissions
                };
            }) || [
                {
                    division_id: "",
                    step_name: "",
                    actions: [],
                    permissions: [],
                },
            ],
        });
        setShowModal(true);
    };
    // Tambahkan actions statis sementara atau ambil dari props
    const availableActions = ["Request To Next", "Approve", "Reject"];
    // CRUD operations - SAMA PERSIS DENGAN USER MANAGEMENT
    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This workflow will be deleted permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            confirmButtonColor: "#dc2626",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("workflows.destroy", id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Workflow has been deleted.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (error) => {
                        let errorMessage = "Failed to delete workflow";

                        if (error?.message) {
                            errorMessage = error.message;
                        } else if (error?.error) {
                            errorMessage = error.error;
                        }

                        showErrorAlert("Delete Failed", errorMessage);
                    },
                });
            }
        });
    };

    const goToPermissions = (workflowId) => {
        router.get(route("workflow-steps.permissions.index", workflowId));
    };

    // Form submit - SAMA PERSIS DENGAN USER MANAGEMENT
    const handleSubmit = (e) => {
        e.preventDefault();

        const hasEmptySteps = data.steps.some(
            (step) => !step.division_id || !step.step_name
        );
        if (hasEmptySteps) {
            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please select division and enter step name for all steps.",
            });
            return;
        }

        if (!data.document_id) {
            Swal.fire({
                icon: "error",
                title: "Validation Error",
                text: "Please select a document type.",
            });
            return;
        }

        // Siapkan payload - PASTIKAN 'role' ADA (bukan 'step_name')
        const payload = {
            name: data.name,
            description: data.description,
            document_id: parseInt(data.document_id),
            steps: data.steps.map((step, index) => ({
                division_id: parseInt(step.division_id),
                role: step.step_name, // PASTIKAN INI 'role' BUKAN 'step_name'
                actions: step.actions || [], // <--- ini penting
                permissions: step.permissions || [], // Include permissions
            })),
        };

        // SAMA PERSIS DENGAN USER MANAGEMENT
        if (editingWorkflow) {
            // Konfirmasi sebelum update
            Swal.fire({
                title: "Update Workflow?",
                text: "Apakah Anda yakin ingin memperbarui workflow ini? Perubahan akan mempengaruhi workflow yang sudah dibuat.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Ya, Update",
                cancelButtonText: "Batal",
                confirmButtonColor: "#3085d6",
            }).then((result) => {
                if (result.isConfirmed) {
                    put(
                        route("workflows.update", editingWorkflow.id),
                        payload,
                        {
                            onSuccess: () => {
                                setEditingWorkflow(null);
                                reset();
                                Swal.fire({
                                    icon: "success",
                                    title: "Workflow Berhasil Diperbarui!",
                                    text: "Workflow telah berhasil diperbarui.",
                                    confirmButtonText: "OK",
                                    timer: 3000,
                                });
                            },
                            onError: (errors) => {
                                showServerErrorAlert(errors);
                            },
                        }
                    );
                }
            });
        } else {
            post(route("workflows.store"), payload, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    Swal.fire({
                        icon: "success",
                        title: "Workflow created",
                        text: "A new workflow has been successfully created!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    showServerErrorAlert(errors);
                },
            });
        }
    };

    // Step management (tetap sama)
    const addStep = () =>
        setData("steps", [
            ...data.steps,
            { division_id: "", step_name: "", actions: [] },
        ]);

    const removeStep = (index) =>
        setData(
            "steps",
            data.steps.filter((_, i) => i !== index)
        );

    const updateStepDivision = (index, divisionId) => {
        const updatedSteps = [...data.steps];
        updatedSteps[index].division_id = divisionId;
        if (!updatedSteps[index].step_name) {
            const division = divisions.find(
                (d) => d.id.toString() === divisionId
            );
            if (division)
                updatedSteps[index].step_name = `${division.name} Approval`;
        }
        setData("steps", updatedSteps);
    };

    const updateStepName = (index, name) => {
        const updatedSteps = [...data.steps];
        updatedSteps[index].step_name = name;
        setData("steps", updatedSteps);
    };
    useEffect(() => {
        if (flash) {
            Swal.fire({
                icon: "success",
                title: "Success",
                text: flash,
                timer: 2000,
                showConfirmButton: false,
            });
        }
    }, [flash]);
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl">Workflow Management</h2>
            }
        >
            <Head title="Workflow Management" />
            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto p-6 lg:px-8">
                        <Card className="p-6 shadow-sm">
                            {/* Filters & Create Button */}
                            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                                <div className="flex flex-col lg:flex-row gap-2 flex-1">
                                    <Input
                                        placeholder="Search workflows..."
                                        value={filterText}
                                        onChange={(e) =>
                                            setFilterText(e.target.value)
                                        }
                                        className="md:w-64 text-[0.8rem]"
                                        style={{ borderRadius: "15px" }}
                                    />
                                    <Select
                                        value={filterDocument}
                                        onValueChange={setFilterDocument}
                                    >
                                        <SelectTrigger
                                            style={{ borderRadius: "15px" }}
                                            className="md:w-64 text-[0.8rem]"
                                        >
                                            <SelectValue placeholder="Filter by document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Documents
                                            </SelectItem>
                                            {documents.map((doc) => (
                                                <SelectItem
                                                    key={doc.id}
                                                    value={doc.name}
                                                >
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={openCreateModal}
                                    className="md:w-auto"
                                    style={{ borderRadius: "15px" }}
                                >
                                    <Plus className="h-4 w-4 mr-2 text-[0.8rem]" />{" "}
                                    Create Workflow
                                </Button>
                            </div>

                            {/* Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Steps</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWorkflows.length > 0 ? (
                                        filteredWorkflows.map((wf) => (
                                            <TableRow key={wf.id}>
                                                <TableCell className="font-medium">
                                                    {wf.name}
                                                </TableCell>
                                                <TableCell>
                                                    {wf.document?.name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        {wf.steps?.map(
                                                            (step, idx) => (
                                                                <React.Fragment
                                                                    key={idx}
                                                                >
                                                                    <span>
                                                                        {step
                                                                            .division
                                                                            ?.name ||
                                                                            "N/A"}
                                                                    </span>
                                                                    {idx <
                                                                        wf.steps
                                                                            .length -
                                                                            1 && (
                                                                        <ArrowRight className="h-4 w-4 mx-1" />
                                                                    )}
                                                                </React.Fragment>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            wf.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }
                                                        style={{
                                                            borderRadius:
                                                                "15px",
                                                        }}
                                                    >
                                                        {wf.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                goToPermissions(
                                                                    wf.id
                                                                )
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            <Settings className="h-4 w-4 mr-1" />{" "}
                                                            Permissions
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    wf
                                                                )
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />{" "}
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    wf.id
                                                                )
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 " />{" "}
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-gray-500 py-8"
                                            >
                                                No workflows found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            </div>
            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingWorkflow
                                ? "Edit Workflow"
                                : "Create New Workflow"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Workflow Name & Document */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">
                                        Workflow Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        className={
                                            errors.name ? "border-red-500" : ""
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="document_id">
                                        Document Type *
                                    </Label>
                                    <Select
                                        value={data.document_id?.toString()}
                                        onValueChange={(val) =>
                                            setData("document_id", val)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.document_id
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        >
                                            <SelectValue placeholder="Select Document" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documents.map((doc) => (
                                                <SelectItem
                                                    key={doc.id}
                                                    value={doc.id.toString()}
                                                >
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.document_id && (
                                        <p className="text-red-500 text-sm">
                                            {errors.document_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    className="w-full border rounded p-2"
                                    rows={3}
                                />
                            </div>

                            {/* Steps */}
                            <div>
                                <Label>Steps *</Label>
                                {data.steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col gap-2 mb-2 border p-2 rounded"
                                    >
                                        <div className="flex  gap-2 flex-col sm:flex-row">
                                            <Select
                                                value={step.division_id}
                                                onValueChange={(val) =>
                                                    updateStepDivision(
                                                        index,
                                                        val
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full ">
                                                    <SelectValue placeholder="Select Division" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {divisions.map((d) => (
                                                        <SelectItem
                                                            key={d.id}
                                                            value={d.id.toString()}
                                                        >
                                                            {d.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                placeholder="Step Name"
                                                value={step.step_name}
                                                onChange={(e) =>
                                                    updateStepName(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                className="text-sm"
                                            />

                                            {data.steps.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeStep(index)
                                                    }
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>

                                        {/* Actions checkboxes */}
                                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                                            {availableActions.map((action) => (
                                                <label
                                                    key={action}
                                                    className="flex items-center gap-1"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            step.actions?.includes(
                                                                action
                                                            ) || false
                                                        }
                                                        onChange={(e) => {
                                                            const updatedSteps =
                                                                [...data.steps];
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                updatedSteps[
                                                                    index
                                                                ].actions = [
                                                                    ...(step.actions ||
                                                                        []),
                                                                    action,
                                                                ];
                                                            } else {
                                                                updatedSteps[
                                                                    index
                                                                ].actions = (
                                                                    step.actions ||
                                                                    []
                                                                ).filter(
                                                                    (a) =>
                                                                        a !==
                                                                        action
                                                                );
                                                            }
                                                            setData(
                                                                "steps",
                                                                updatedSteps
                                                            );
                                                        }}
                                                    />
                                                    <span className="text-sm">
                                                        {action}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addStep}
                                    style={{ borderRadius: "15px" }}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Step
                                </Button>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingWorkflow(null);
                                        reset();
                                    }}
                                    disabled={processing}
                                    style={{ borderRadius: "15px" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    style={{ borderRadius: "15px" }}
                                >
                                    {processing
                                        ? "Processing..."
                                        : editingWorkflow
                                        ? "Update Workflow"
                                        : "Create Workflow"}
                                </Button>
                            </div>
                        </form>
                    </Card>{" "}
                </div>
            )}{" "}
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
        </AuthenticatedLayout>
    );
}
