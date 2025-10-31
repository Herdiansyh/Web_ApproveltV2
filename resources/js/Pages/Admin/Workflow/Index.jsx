import React, { useState } from "react";
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
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";

export default function Index({ auth, workflows, divisions, documents }) {
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [filterSelect, setFilterSelect] = useState("");

    const { data, setData, post, put, processing, reset } = useForm({
        name: "",
        description: "",
        document_id: documents[0]?.id || "",
        steps: [{ division_id: "", actions: [] }],
    });

    // === FILTER HANDLING ===
    const filteredWorkflows = workflows.filter((wf) => {
        const matchText = wf.name
            .toLowerCase()
            .includes(filterText.toLowerCase());
        const matchSelect = !filterSelect || wf.document?.name === filterSelect;
        return matchText && matchSelect;
    });

    // === CRUD ===
    const openCreateModal = () => {
        setEditingWorkflow(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (workflow) => {
        setEditingWorkflow(workflow);
        setData({
            name: workflow.name,
            description: workflow.description || "",
            document_id: workflow.document_id || documents[0]?.id || "",
            steps: workflow.steps?.map((s) => ({
                id: s.id,
                division_id: s.division?.id || "",
                actions: Array.isArray(s.actions)
                    ? s.actions
                    : JSON.parse(s.actions || "[]"),
            })) || [{ division_id: "", actions: [] }],
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This workflow will be deleted permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("workflows.destroy", id), {
                    onSuccess: () =>
                        Swal.fire("Deleted!", "Workflow removed.", "success"),
                });
            }
        });
    };

    // === HANDLE SUBMIT ===
    const handleSubmit = (e) => {
        e.preventDefault();

        const stepsWithDynamicActions = data.steps.map((step, i) => {
            const nextStep = data.steps[i + 1];
            const finalActions = [];

            // Tambahkan action sesuai pilihan
            if (step.actions.includes("approve")) finalActions.push("approve");
            if (step.actions.includes("reject")) finalActions.push("reject");

            // Jika ada request dan ada step berikutnya, ubah jadi “request to [divisi berikutnya]”
            if (step.actions.includes("request") && nextStep) {
                const nextDivision = divisions.find(
                    (d) => d.id === parseInt(nextStep.division_id)
                );
                if (nextDivision) {
                    finalActions.push(`request to ${nextDivision.name}`);
                } else {
                    finalActions.push("request to next step");
                }
            }

            return { ...step, actions: finalActions };
        });

        const payload = { ...data, steps: stepsWithDynamicActions };
        const action = editingWorkflow
            ? route("workflows.update", editingWorkflow.id)
            : route("workflows.store");
        const request = editingWorkflow ? put : post;

        request(action, {
            data: payload,
            onSuccess: () => {
                setShowModal(false);
                setEditingWorkflow(null);
                reset();
                Swal.fire({
                    icon: "success",
                    title: editingWorkflow
                        ? "Workflow updated"
                        : "Workflow created",
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    // === HANDLE STEPS ===
    const addStep = () =>
        setData("steps", [...data.steps, { division_id: "", actions: [] }]);

    const removeStep = (index) => {
        setData(
            "steps",
            data.steps.filter((_, i) => i !== index)
        );
    };

    // === UI ===
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl">Workflow Management</h2>
            }
        >
            <Head title="Workflow Management" />
            <div className="flex min-h-screen bg-background relative">
                <Sidebar />
                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto p-6 lg:px-8">
                        <Card className="p-6 shadow-sm">
                            {/* Filter */}
                            <div className="flex flex-col md:flex-row justify-between mb-4 gap-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search workflows..."
                                        value={filterText}
                                        onChange={(e) =>
                                            setFilterText(e.target.value)
                                        }
                                        className="border border-gray-300"
                                        style={{ borderRadius: "8px" }}
                                    />
                                    <Select
                                        value={filterSelect}
                                        onValueChange={setFilterSelect}
                                    >
                                        <SelectTrigger
                                            style={{ borderRadius: "8px" }}
                                            className="border border-gray-300"
                                        >
                                            <SelectValue placeholder="Filter by document" />
                                        </SelectTrigger>
                                        <SelectContent>
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

                                <Button onClick={openCreateModal}>
                                    + Add Workflow
                                </Button>
                            </div>

                            {/* Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Steps</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWorkflows.length > 0 ? (
                                        filteredWorkflows.map((wf) => (
                                            <TableRow key={wf.id}>
                                                <TableCell>{wf.name}</TableCell>
                                                <TableCell>
                                                    {wf.document?.name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {wf.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {wf.steps
                                                        ?.map(
                                                            (s) =>
                                                                s.division
                                                                    ?.name ||
                                                                "-"
                                                        )
                                                        .join(" → ")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    wf
                                                                )
                                                            }
                                                        >
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
                                                        >
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
                                                className="text-center text-gray-500"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingWorkflow
                                ? "Edit Workflow"
                                : "Create Workflow"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Document</Label>
                                    <Select
                                        value={
                                            data.document_id?.toString() || ""
                                        }
                                        onValueChange={(value) =>
                                            setData(
                                                "document_id",
                                                parseInt(value)
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select document" />
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
                                </div>

                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Steps</Label>
                                    {data.steps.map((step, i) => {
                                        const nextDivisionName = data.steps[
                                            i + 1
                                        ]?.division_id
                                            ? divisions.find(
                                                  (d) =>
                                                      d.id ===
                                                      parseInt(
                                                          data.steps[i + 1]
                                                              .division_id
                                                      )
                                              )?.name
                                            : "next step";

                                        return (
                                            <div
                                                key={i}
                                                className="flex flex-col gap-2 mb-4 border p-3 rounded-md"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={
                                                            step.division_id?.toString() ||
                                                            ""
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) => {
                                                            const updated = [
                                                                ...data.steps,
                                                            ];
                                                            updated[
                                                                i
                                                            ].division_id =
                                                                parseInt(value);
                                                            setData(
                                                                "steps",
                                                                updated
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select division" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {divisions.map(
                                                                (d) => (
                                                                    <SelectItem
                                                                        key={
                                                                            d.id
                                                                        }
                                                                        value={d.id.toString()}
                                                                    >
                                                                        {d.name}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeStep(i)
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>

                                                <div>
                                                    <div className="flex gap-4">
                                                        {[
                                                            "approve",
                                                            "reject",
                                                            "request_to",
                                                        ].map((action) => (
                                                            <label
                                                                key={action}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={step.actions.includes(
                                                                        action
                                                                    )}
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        const updatedSteps =
                                                                            [
                                                                                ...data.steps,
                                                                            ];
                                                                        if (
                                                                            e
                                                                                .target
                                                                                .checked
                                                                        ) {
                                                                            updatedSteps[
                                                                                i
                                                                            ].actions.push(
                                                                                action
                                                                            );
                                                                        } else {
                                                                            updatedSteps[
                                                                                i
                                                                            ].actions =
                                                                                updatedSteps[
                                                                                    i
                                                                                ].actions.filter(
                                                                                    (
                                                                                        a
                                                                                    ) =>
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
                                                                {action ===
                                                                "request_to"
                                                                    ? "Request To Next Step"
                                                                    : action
                                                                          .charAt(
                                                                              0
                                                                          )
                                                                          .toUpperCase() +
                                                                      action.slice(
                                                                          1
                                                                      )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addStep}
                                    >
                                        + Add Step
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingWorkflow(null);
                                        reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingWorkflow ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
