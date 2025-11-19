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
import CardSubDivision from "./CardSubDivision.jsx";

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

                        <CardSubDivision
                            divisions={divisions}
                            filteredSubdivisions={filteredSubdivisions}
                            search={search}
                            setSearch={setSearch}
                            selectedDivision={selectedDivision}
                            setSelectedDivision={setSelectedDivision}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            setIsModalOpen={setIsModalOpen}
                            setEditingSubdivision={setEditingSubdivision}
                        />
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
