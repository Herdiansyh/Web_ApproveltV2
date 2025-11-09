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

export default function Index({ auth, documents, divisions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [search, setSearch] = useState("");
    const [filterDocument, setFilterDocument] = useState("all");
    const handleSearch = (e) => setSearch(e.target.value);

    const handleEdit = (doc) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
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
                <div className="py-12 w-full overflow-auto relative">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="text-2xl font-bold absolute top-5">
                            Documents Type
                        </h1>

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
        </AuthenticatedLayout>
    );
}
