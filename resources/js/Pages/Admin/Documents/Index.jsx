import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
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
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";
import DocumentModal from "./Create.jsx";
import { Input } from "@/Components/ui/input.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select.jsx";
import Header from "@/Components/Header.jsx";
import { Textarea } from "@/Components/ui/textarea.jsx";

export default function Index({ auth, documents, divisions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [isFieldsOpen, setIsFieldsOpen] = useState(false);
    const [fieldDoc, setFieldDoc] = useState(null);
    const emptyField = {
        id: null,
        name: "",
        label: "",
        type: "text",
        required: false,
        order: 0,
        optionsText: "",
    };
    const [fieldForm, setFieldForm] = useState(emptyField);
    const [search, setSearch] = useState("");
    const [filterDocument, setFilterDocument] = useState("all");
    const handleSearch = (e) => setSearch(e.target.value);

    const handleEdit = (doc) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const openFields = (doc) => {
        setFieldDoc(doc);
        setFieldForm(emptyField);
        setIsFieldsOpen(true);
    };

    const closeFields = () => {
        setIsFieldsOpen(false);
        setFieldDoc(null);
        setFieldForm(emptyField);
    };

    const parseOptions = (text) => {
        if (!text) return [];
        const raw = text
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean);
        // de-dup
        return Array.from(new Set(raw));
    };

    const startCreateField = () => setFieldForm(emptyField);
    const startEditField = (f) => {
        setFieldForm({
            id: f.id,
            name: f.name,
            label: f.label || "",
            type: f.type || "text",
            required: !!f.required,
            order: Number(f.order || 0),
            optionsText: (f.options || []).join("\n"),
        });
    };

    const saveField = () => {
        if (!fieldDoc) return;
        const docId = fieldDoc.id;
        const payload = {
            name: fieldForm.name,
            label: fieldForm.label,
            type: fieldForm.type,
            required: !!fieldForm.required,
            order: Number(fieldForm.order || 0),
            options:
                fieldForm.type === "select"
                    ? parseOptions(fieldForm.optionsText)
                    : [],
        };

        if (!fieldForm.id) {
            // create
            router.post(route("documents.fields.store", docId), payload, {
                onSuccess: () =>
                    Swal.fire("Success", "Field created", "success"),
            });
        } else {
            const url = route("documents.fields.update", {
                document: docId,
                field: fieldForm.id,
            });
            const update = { ...payload };
            delete update.name; // name immutable on update
            router.put(url, update, {
                onSuccess: () =>
                    Swal.fire("Success", "Field updated", "success"),
            });
        }
    };

    const deleteField = (f) => {
        if (!fieldDoc) return;
        Swal.fire({
            title: "Delete field?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then((res) => {
            if (res.isConfirmed) {
                router.delete(
                    route("documents.fields.destroy", {
                        document: fieldDoc.id,
                        field: f.id,
                    }),
                    {
                        onSuccess: () =>
                            Swal.fire("Deleted", "Field deleted", "success"),
                    }
                );
            }
        });
    };

    const filteredDocuments = documents.filter((doc) => {
        const matchText = doc.name.toLowerCase().includes(search.toLowerCase());
        const matchDocument =
            filterDocument === "all" || doc.name === filterDocument;
        return matchText && matchDocument;
    });

    const handleDelete = (docId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("documents.destroy", docId), {
                    onSuccess: () => {
                        Swal.fire("Deleted!", "Document deleted.", "success");
                    },
                    onError: () => {
                        Swal.fire(
                            "Error",
                            "Failed to delete document.",
                            "error"
                        );
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Document Management
                </h2>
            }
        >
            <Head title="Document Management" />

            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="py-12 w-full overflow-auto ">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="text-2xl font-bold  ">Documents Type</h1>

                        <Card className="p-6">
                            {/* Filter & Add Button */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <Input
                                        className="md:w-1/2 text-[0.8rem]"
                                        placeholder="Search Document..."
                                        value={search}
                                        onChange={handleSearch}
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
                                    onClick={() => {
                                        setEditingDocument(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="md:w-[180px] w-full h-9 text-[0.8rem]"
                                    style={{ borderRadius: "15px" }}
                                >
                                    + Add New Document
                                </Button>
                            </div>

                            {/* Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.length > 0 ? (
                                        filteredDocuments.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>
                                                    {doc.name}
                                                </TableCell>
                                                <TableCell>
                                                    {doc.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {doc.division?.name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openFields(doc)
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            Manage Fields
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(doc)
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    doc.id
                                                                )
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
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
                                                colSpan={4}
                                                className="text-center text-gray-500"
                                            >
                                                No documents found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Add/Edit Document */}
            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDocument(null);
                }}
                document={editingDocument}
                divisions={divisions}
            />

            {/* Fields Modal */}
            {isFieldsOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-3xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">
                                Manage Fields — {fieldDoc?.name}
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={closeFields}
                            >
                                Close
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium mb-2">
                                    Existing Fields
                                </h4>
                                <div className="space-y-2 max-h-80 overflow-auto pr-2">
                                    {(fieldDoc?.fields || [])
                                        .sort(
                                            (a, b) =>
                                                (a.order ?? 0) - (b.order ?? 0)
                                        )
                                        .map((f) => (
                                            <div
                                                key={f.id}
                                                className="border rounded-md p-2 flex items-start justify-between gap-2"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {f.label}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({f.name})
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {f.type}
                                                        {f.required
                                                            ? " • required"
                                                            : ""}{" "}
                                                        • order {f.order ?? 0}
                                                    </div>
                                                    {Array.isArray(f.options) &&
                                                        f.options.length >
                                                            0 && (
                                                            <div className="text-xs mt-1">
                                                                Options:{" "}
                                                                {f.options.join(
                                                                    ", "
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            startEditField(f)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            deleteField(f)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    {(fieldDoc?.fields || []).length === 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            No fields yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">
                                    {fieldForm.id ? "Edit Field" : "Add Field"}
                                </h4>
                                <div className="space-y-2">
                                    {!fieldForm.id && (
                                        <div>
                                            <label className="text-sm">
                                                Name
                                            </label>
                                            <Input
                                                value={fieldForm.name}
                                                onChange={(e) =>
                                                    setFieldForm({
                                                        ...fieldForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. tanggal_mulai"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm">Label</label>
                                        <Input
                                            value={fieldForm.label}
                                            onChange={(e) =>
                                                setFieldForm({
                                                    ...fieldForm,
                                                    label: e.target.value,
                                                })
                                            }
                                            placeholder="Tanggal Mulai"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm">Type</label>
                                        <select
                                            className="w-full border rounded-md p-2"
                                            value={fieldForm.type}
                                            onChange={(e) =>
                                                setFieldForm({
                                                    ...fieldForm,
                                                    type: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="text">text</option>
                                            <option value="textarea">
                                                textarea
                                            </option>
                                            <option value="number">
                                                number
                                            </option>
                                            <option value="date">date</option>
                                            <option value="select">
                                                select
                                            </option>
                                            <option value="file">file</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm">Order</label>
                                        <Input
                                            type="number"
                                            value={fieldForm.order}
                                            onChange={(e) =>
                                                setFieldForm({
                                                    ...fieldForm,
                                                    order: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="req"
                                            type="checkbox"
                                            checked={!!fieldForm.required}
                                            onChange={(e) =>
                                                setFieldForm({
                                                    ...fieldForm,
                                                    required: e.target.checked,
                                                })
                                            }
                                        />
                                        <label
                                            htmlFor="req"
                                            className="text-sm"
                                        >
                                            Required
                                        </label>
                                    </div>
                                    {fieldForm.type === "select" && (
                                        <div>
                                            <label className="text-sm">
                                                Options (comma or newline
                                                separated)
                                            </label>
                                            <Textarea
                                                rows={4}
                                                value={fieldForm.optionsText}
                                                onChange={(e) =>
                                                    setFieldForm({
                                                        ...fieldForm,
                                                        optionsText:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button onClick={saveField}>
                                            {fieldForm.id
                                                ? "Update Field"
                                                : "Create Field"}
                                        </Button>
                                        {!fieldForm.id && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={startCreateField}
                                            >
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
