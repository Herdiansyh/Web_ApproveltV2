import React, { useState, useEffect } from "react";
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
import FieldsModal from "./FieldsModal.jsx";
import CardFormDocument from "./CardFormDocument.jsx";
import { Separator } from "@/Components/ui/separator.jsx";
import Footer from "@/Components/Footer.jsx";

export default function Index({ auth, documents }) {
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
                onSuccess: () => {
                    router.reload({
                        only: ["documents"],
                        preserveScroll: true,
                    });
                    Swal.fire("Success", "Field created", "success");
                    setFieldForm(emptyField);
                },
            });
        } else {
            const url = route("documents.fields.update", {
                document: docId,
                field: fieldForm.id,
            });
            const update = { ...payload };
            delete update.name; // name immutable on update
            router.put(url, update, {
                onSuccess: () => {
                    router.reload({
                        only: ["documents"],
                        preserveScroll: true,
                    });
                    Swal.fire("Success", "Field updated", "success");
                },
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
                        onSuccess: () => {
                            router.reload({
                                only: ["documents"],
                                preserveScroll: true,
                            });
                            Swal.fire("Deleted", "Field deleted", "success");
                        },
                    }
                );
            }
        });
    };

    // Keep fieldDoc in sync with latest documents after reloads
    useEffect(() => {
        if (!fieldDoc) return;
        const updated = (documents || []).find((d) => d.id === fieldDoc.id);
        if (updated) setFieldDoc(updated);
    }, [documents]);

    const filteredDocuments = documents.filter((doc) => {
        const matchText = doc.name.toLowerCase().includes(search.toLowerCase());
        const matchDocument =
            filterDocument === "all" || doc.name === filterDocument;
        return matchText && matchDocument;
    });

    const handleSaveSeries = (doc, payload) => {
        router.post(route("documents.nameSeries.update", doc.id), payload, {
            onSuccess: () =>
                Swal.fire("Success", "Name Series updated", "success"),
        });
    };

    const handleResetSeries = (doc) => {
        Swal.fire({
            title: "Reset counter?",
            text: "Counter akan di-reset ke 0.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, reset",
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(
                    route("documents.nameSeries.reset", doc.id),
                    {},
                    {
                        onSuccess: () =>
                            Swal.fire("Reset", "Counter reset to 0", "success"),
                    }
                );
            }
        });
    };

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
                    onSuccess: (page) => {
                        Swal.fire(
                            "Deleted!",
                            page.props.flash?.message || "Document deleted.",
                            "success"
                        );
                    },
                    onError: (errors) => {
                        Swal.fire(
                            "Tidak bisa dihapus",
                            errors.message ||
                                "Dokumen tidak dapat dihapus karena sudah digunakan.",
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

                        <CardFormDocument
                            handleSearch={handleSearch}
                            filterDocument={filterDocument}
                            setFilterDocument={setFilterDocument}
                            documents={documents}
                            setEditingDocument={setEditingDocument}
                            setIsModalOpen={setIsModalOpen}
                            filteredDocuments={filteredDocuments}
                            handleEdit={handleEdit}
                            openFields={openFields}
                            handleSaveSeries={handleSaveSeries}
                            handleResetSeries={handleResetSeries}
                            handleDelete={handleDelete}
                        />
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
            {/* Modal Add/Edit Document */}
            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDocument(null);
                }}
                document={editingDocument}
            />

            {/* Fields Modal */}
            {isFieldsOpen && (
                <FieldsModal
                    fieldDoc={fieldDoc}
                    closeFields={closeFields}
                    startEditField={startEditField}
                    deleteField={deleteField}
                    fieldForm={fieldForm}
                    setFieldForm={setFieldForm}
                    saveField={saveField}
                    startCreateField={startCreateField}
                />
            )}
        </AuthenticatedLayout>
    );
}
