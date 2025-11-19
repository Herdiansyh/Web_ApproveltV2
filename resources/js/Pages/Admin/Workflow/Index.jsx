import React, { useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";

import Swal from "sweetalert2";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { Separator } from "@/Components/ui/separator";
import CardWorkflow from "./CardWorkflow";
import ModalCreate from "./ModalCreate";

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
        is_active: true,
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
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (workflow) => {
        setEditingWorkflow(workflow);
        setData({
            name: workflow.name,
            description: workflow.description || "",
            document_id: workflow.document_id?.toString() || "",
            is_active: !!workflow.is_active,
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
            is_active: !!data.is_active,
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
                                    title: "Workflow Updated",
                                    text: "Workflow has been successfully updated.",
                                    confirmButtonText: "OK",
                                }).then(() => {
                                    router.visit(route("workflows.index"));
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
                        confirmButtonText: "OK",
                    }).then(() => {
                        router.visit(route("workflows.index"));
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
                        <h1 className=" top-5 text-2xl font-bold mb-3">
                            Workflow Management
                        </h1>
                        <CardWorkflow
                            filteredWorkflows={filteredWorkflows}
                            filterText={filterText}
                            setFilterText={setFilterText}
                            filterDocument={filterDocument}
                            setFilterDocument={setFilterDocument}
                            documents={documents}
                            openCreateModal={openCreateModal}
                            goToPermissions={goToPermissions}
                            openEditModal={openEditModal}
                            handleDelete={handleDelete}
                        />
                    </div>
                </div>
            </div>
            {/* Modal Create/Edit */}
            {showModal && (
                <ModalCreate
                    setShowModal={setShowModal}
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    handleSubmit={handleSubmit}
                    documents={documents}
                    divisions={divisions}
                    availableActions={availableActions}
                    addStep={addStep}
                    removeStep={removeStep}
                    updateStepDivision={updateStepDivision}
                    updateStepName={updateStepName}
                    editingWorkflow={editingWorkflow}
                    reset={reset}
                />
            )}{" "}
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
        </AuthenticatedLayout>
    );
}
