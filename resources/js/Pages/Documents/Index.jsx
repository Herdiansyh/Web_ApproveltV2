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
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { X } from "lucide-react";

export default function Index({ auth, documents }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [filterText, setFilterText] = useState("");
    const [filterSelect, setFilterSelect] = useState("");

    // handle search input
    const handleFilterChange = (e) => {
        setFilterText(e.target.value);
    };

    // handle select filter
    const handleSelectChange = (value) => {
        setFilterSelect(value);
    };

    // hapus filter select
    const clearSelectFilter = () => {
        setFilterSelect("");
    };

    // gabungan filter
    const filteredDocuments = documents.filter((document) => {
        const matchText = document.name
            .toLowerCase()
            .includes(filterText.toLowerCase());
        const matchSelect = !filterSelect || document.name === filterSelect;
        return matchText && matchSelect;
    });

    const handleEdit = (document) => {
        setEditingDocument(document);
        setIsModalOpen(true);
    };

    const handleDelete = (documentId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This document type will be deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("documents.destroy", documentId), {
                    onSuccess: () => {
                        Swal.fire(
                            "Deleted!",
                            "The document type has been deleted.",
                            "success"
                        );
                    },
                });
            }
        });
    };
    const HandleResetSelect = () => {
        filterSelect("");
    };
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Document Management
                </h2>
            }
        >
            <Head title="Document Management" />
            <div className="flex min-h-screen bg-background relative">
                <Sidebar />
                <div className="py-12 w-full overflow-auto">
                    <div className="flex flex-col gap-3 absolute top-5 ml-6">
                        <h3 className="text-xl font-semibold">Documents</h3>
                    </div>

                    <div className="mx-auto p-6 lg:px-8">
                        <Card className="p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row w-full justify-between gap-3 mb-4">
                                {/* Filter Section */}
                                <div className="flex flex-col md:flex-row w-full gap-2">
                                    <Input
                                        placeholder="Search documents..."
                                        value={filterText}
                                        onChange={handleFilterChange}
                                        className="md:w-1/3 border border-gray-300"
                                        style={{ borderRadius: "8px" }}
                                    />

                                    <Select
                                        value={filterSelect}
                                        onValueChange={handleSelectChange}
                                    >
                                        <SelectTrigger
                                            className="md:w-1/5 border border-gray-300"
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <SelectValue placeholder="Filter..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem disabled value="Filter">
                                                Filter...
                                            </SelectItem>
                                            {documents.map((document) => (
                                                <SelectItem
                                                    key={document.id}
                                                    value={document.name}
                                                >
                                                    {document.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Add Button */}
                                <Button
                                    onClick={() => {
                                        setEditingDocument(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="w-[180px] h-9 text-sm"
                                    style={{
                                        borderRadius: "8px",
                                    }}
                                >
                                    + Add New Document
                                </Button>
                            </div>

                            {/* Filter Tags */}
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
                                                onClick={() =>
                                                    setFilterText("")
                                                }
                                            />
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Table Section */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.length > 0 ? (
                                        filteredDocuments.map((document) => (
                                            <TableRow key={document.id}>
                                                <TableCell>
                                                    {document.name}
                                                </TableCell>
                                                <TableCell>
                                                    {document.description ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    document
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
                                                                    document.id
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
                                                colSpan={3}
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

            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDocument(null);
                }}
                document={editingDocument}
            />
        </AuthenticatedLayout>
    );
}
