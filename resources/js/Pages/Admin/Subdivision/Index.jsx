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
import Swal from "sweetalert2";
import SubdivisionModal from "./Create.jsx";
import { Input } from "@/Components/ui/input.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select.jsx";
import Header from "@/Components/Header.jsx";

export default function Index({ auth, subdivisions, divisions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubdivision, setEditingSubdivision] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("all");

    const filteredSubdivisions = subdivisions.filter((sub) => {
        const matchSearch =
            sub.name.toLowerCase().includes(search.toLowerCase()) ||
            (sub.description
                ? sub.description.toLowerCase().includes(search.toLowerCase())
                : false);
        const matchSelect =
            selectedDivision === "all" ||
            sub.division?.name?.toLowerCase() ===
                selectedDivision.toLowerCase();
        return matchSearch && matchSelect;
    });

    const handleEdit = (subdivision) => {
        setEditingSubdivision(subdivision);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
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
                router.delete(route("subdivisions.destroy", id), {
                    onSuccess: () => {
                        Swal.fire(
                            "Deleted!",
                            "Subdivision deleted.",
                            "success"
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
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Subdivision Management
                </h2>
            }
        >
            <Head title="Subdivision Management" />

            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="py-12 w-full overflow-auto ">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="text-2xl font-bold ">Subdivisions</h1>

                        <Card style={{ borderRadius: "15px" }} className="p-6">
                            {/* Filter dan tombol tambah */}
                            <div className="flex  md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <div className="flex lg:flex-row flex-col w-full gap-2">
                                        <Input
                                            className="lg:w-1/3 text-[0.8rem]"
                                            placeholder="Search Subdivision..."
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                        />
                                        <Select
                                            value={selectedDivision}
                                            onValueChange={(value) =>
                                                setSelectedDivision(value)
                                            }
                                        >
                                            <SelectTrigger
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                                className="lg:w-1/4 text-[0.8rem]"
                                            >
                                                <SelectValue placeholder="Filter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    All Divisions
                                                </SelectItem>
                                                {divisions.map((d) => (
                                                    <SelectItem
                                                        key={d.id}
                                                        value={d.name.toLowerCase()}
                                                    >
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setEditingSubdivision(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="md:w-[200px] w-full h-9 text-[0.8rem] sm:text-sm"
                                        style={{
                                            borderRadius: "15px",
                                        }}
                                    >
                                        + Add New Subdivision
                                    </Button>
                                </div>
                            </div>

                            {/* Tabel Subdivisions */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubdivisions.length > 0 ? (
                                        filteredSubdivisions.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    {sub.name}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.division?.name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(sub)
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
                                                                    sub.id
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
                                                No subdivisions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            </div>

            <SubdivisionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingSubdivision(null);
                }}
                subdivision={editingSubdivision}
                divisions={divisions}
            />
        </AuthenticatedLayout>
    );
}
