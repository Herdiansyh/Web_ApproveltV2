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
import DivisionModal from "./Create.jsx";
import { Input } from "@/Components/ui/input.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select.jsx";

export default function Index({ auth, divisions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("all");
    const [selectedDivisionForSub, setSelectedDivisionForSub] = useState(null); // ⬅️ for subdivision modal

    const handleSearch = (e) => setSearch(e.target.value);

    const filteredDivisions = divisions.filter((division) => {
        const matchSearch = division.name
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchSelect =
            selectedDivision === "all" ||
            division.name.toLowerCase() === selectedDivision.toLowerCase();
        return matchSearch && matchSelect;
    });

    const handleEdit = (division) => {
        setEditingDivision(division);
        setIsModalOpen(true);
    };

    const handleDelete = (divisionId) => {
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
                router.delete(route("divisions.destroy", divisionId), {
                    onSuccess: () => {
                        Swal.fire("Deleted!", "Division deleted.", "success");
                    },
                    onError: () => {
                        Swal.fire(
                            "Error",
                            "Failed to delete division.",
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
                    Division Management
                </h2>
            }
        >
            <Head title="Division Management" />

            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="py-12 w-full overflow-auto relative">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="text-2xl font-bold absolute top-5">
                            Divisions
                        </h1>

                        <Card className="p-6">
                            {/* Filter & Add Button */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col lg:flex-row gap-2 w-full">
                                    <Input
                                        className="lg:w-1/3"
                                        placeholder="Search Division..."
                                        value={search}
                                        onChange={handleSearch}
                                        style={{
                                            borderRadius: "15px",
                                        }}
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
                                                {" "}
                                                {/* ✅ UBAH DARI "" KE "all" */}{" "}
                                                All Divisions
                                            </SelectItem>
                                            {divisions.map((d) => (
                                                <SelectItem
                                                    key={d.id}
                                                    value={d.name.toLowerCase()} // ✅ PASTIKAN VALUE TIDAK KOSONG
                                                >
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={() => {
                                        setEditingDivision(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="md:w-[180px] w-full  h-9 text-sm "
                                    style={{
                                        borderRadius: "15px",
                                    }}
                                >
                                    + Add New Division
                                </Button>
                            </div>

                            {/* Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDivisions.length > 0 ? (
                                        filteredDivisions.map((division) => (
                                            <TableRow key={division.id}>
                                                <TableCell>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedDivisionForSub(
                                                                division
                                                            )
                                                        }
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {division.name}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    {division.description ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    division
                                                                )
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
                                                                    division.id
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
                                                colSpan={3}
                                                className="text-center text-gray-500"
                                            >
                                                No divisions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Add/Edit Division */}
            <DivisionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDivision(null);
                }}
                division={editingDivision}
            />

            {/* 🔹 Modal List Subdivisions */}
            <Dialog
                open={!!selectedDivisionForSub}
                onOpenChange={() => setSelectedDivisionForSub(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Subdivisions in {selectedDivisionForSub?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                        {selectedDivisionForSub?.subdivisions?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedDivisionForSub.subdivisions.map(
                                        (sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    {sub.name}
                                                </TableCell>
                                                <TableCell>
                                                    {sub.description || "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-gray-500 text-center py-6">
                                No subdivisions found.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setSelectedDivisionForSub(null);
                            }}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
