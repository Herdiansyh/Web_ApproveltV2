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
import { X } from "lucide-react";
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";

export default function Index({ auth, workflows, divisions, documents }) {
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [filterSelect, setFilterSelect] = useState("");

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
        document_id: documents[0]?.id || "",
        steps: [{ division_id: "" }],
    });

    // === Filter handling ===
    const handleFilterText = (e) => setFilterText(e.target.value);
    const handleFilterSelect = (value) => setFilterSelect(value);
    const clearSelectFilter = () => setFilterSelect("");
    const clearTextFilter = () => setFilterText("");

    const filteredWorkflows = workflows.filter((wf) => {
        const matchText = wf.name
            .toLowerCase()
            .includes(filterText.toLowerCase());
        const matchSelect = !filterSelect || wf.document?.name === filterSelect;
        return matchText && matchSelect;
    });

    // === CRUD functions ===
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
            })) || [{ division_id: "" }],
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
                    onSuccess: () => {
                        Swal.fire(
                            "Deleted!",
                            "Workflow has been removed.",
                            "success"
                        );
                    },
                });
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.document_id) return;

        const action = editingWorkflow
            ? route("workflows.update", editingWorkflow.id)
            : route("workflows.store");

        const request = editingWorkflow ? put : post;
        request(action, {
            ...data,
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

    // === Steps handling ===
    const addStep = () =>
        setData("steps", [...data.steps, { division_id: "" }]);
    const removeStep = (index) => {
        const newSteps = data.steps.filter((_, i) => i !== index);
        setData("steps", newSteps);
    };

    // === UI ===
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Workflow Management
                </h2>
            }
        >
            <Head title="Workflow Management" />

            <div className="flex min-h-screen bg-background relative">
                <Sidebar />

                <div className="py-12 w-full overflow-auto">
                    <div className="flex flex-col gap-3 absolute top-5 ml-6">
                        <h3 className="text-xl font-semibold">Workflows</h3>
                    </div>

                    <div className="mx-auto p-6 lg:px-8">
                        <Card className="p-6 shadow-sm">
                            {/* Filter & Add */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <Input
                                        placeholder="Search workflows..."
                                        value={filterText}
                                        onChange={handleFilterText}
                                        className="md:w-1/3 border border-gray-300"
                                        style={{ borderRadius: "8px" }}
                                    />

                                    <Select
                                        value={filterSelect}
                                        onValueChange={handleFilterSelect}
                                    >
                                        <SelectTrigger
                                            className="md:w-1/5 border border-gray-300"
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <SelectValue placeholder="Filter by document..." />
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

                                <Button
                                    onClick={openCreateModal}
                                    className="w-[180px] h-9 text-sm"
                                    style={{ borderRadius: "8px" }}
                                >
                                    + Add New Workflow
                                </Button>
                            </div>

                            {/* Active Filters */}
                            {(filterSelect || filterText) && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {filterSelect && (
                                        <Badge
                                            variant="secondary"
                                            className="flex items-center gap-1 px-2 py-1 text-sm"
                                        >
                                            {filterSelect}
                                            <X
                                                size={14}
                                                className="cursor-pointer hover:text-red-500"
                                                onClick={clearSelectFilter}
                                            />
                                        </Badge>
                                    )}
                                    {filterText && (
                                        <Badge
                                            variant="secondary"
                                            className="flex items-center gap-1 px-2 py-1 text-sm"
                                        >
                                            Search: {filterText}
                                            <X
                                                size={14}
                                                className="cursor-pointer hover:text-red-500"
                                                onClick={clearTextFilter}
                                            />
                                        </Badge>
                                    )}
                                </div>
                            )}

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
                                                            style={{
                                                                borderRadius:
                                                                    "10px",
                                                            }}
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
                                                            style={{
                                                                borderRadius:
                                                                    "10px",
                                                            }}
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

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingWorkflow
                                ? "Edit Workflow"
                                : "Create New Workflow"}
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
                                    {errors.name && (
                                        <p className="text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
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
                                    {data.steps.map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 mb-2"
                                        >
                                            <Select
                                                value={
                                                    step.division_id?.toString() ||
                                                    ""
                                                }
                                                onValueChange={(value) => {
                                                    const updated = [
                                                        ...data.steps,
                                                    ];
                                                    updated[i].division_id =
                                                        parseInt(value);
                                                    setData("steps", updated);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select division" />
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
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeStep(i)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
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
