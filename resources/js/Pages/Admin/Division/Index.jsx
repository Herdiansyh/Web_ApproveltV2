import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
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
import DivisionModal from "./Create.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";

import Header from "@/Components/Header.jsx";
import CardDivision from "./CardDivision.jsx";
import { X } from "lucide-react";
import { Separator } from "@/Components/ui/separator.jsx";
import Footer from "@/Components/Footer.jsx";

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
                <Header className="z-50 relative" />
                <div className="pl-2 py-12 w-full overflow-auto">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="text-2xl font-bold  mb-3">Divisions</h1>

                        <CardDivision
                            divisions={divisions}
                            handleSearch={handleSearch}
                            search={search}
                            selectedDivision={selectedDivision}
                            setSelectedDivision={setSelectedDivision}
                            filteredDivisions={filteredDivisions}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            setIsModalOpen={setIsModalOpen}
                            setEditingDivision={setEditingDivision}
                            setSelectedDivisionForSub={
                                setSelectedDivisionForSub
                            }
                        />
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
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
