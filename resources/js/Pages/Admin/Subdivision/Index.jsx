import React, { useState, useEffect, useMemo } from "react";
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
import { Separator } from "@/Components/ui/separator.jsx";
import Footer from "@/Components/Footer.jsx";

export default function Index({ auth, subdivisions, divisions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubdivision, setEditingSubdivision] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedDivision, setSelectedDivision] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page saat search atau filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDivision]);

    // State untuk menyimpan semua data saat search
    const [allSubdivisions, setAllSubdivisions] = useState(null);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    // Fetch semua data saat search/filter aktif
    useEffect(() => {
        if (search || (selectedDivision && selectedDivision !== "all")) {
            const fetchAllSubdivisions = async () => {
                setIsLoadingAll(true);
                try {
                    const response = await fetch("/subdivisions/all");
                    const data = await response.json();
                    setAllSubdivisions(data.data);
                } catch (error) {
                    console.error("Error fetching all subdivisions:", error);
                } finally {
                    setIsLoadingAll(false);
                }
            };
            fetchAllSubdivisions();
        } else {
            setAllSubdivisions(null); // Reset saat tidak ada filter
        }
    }, [search, selectedDivision]);

    // Gunakan pagination backend yang sudah ada dengan client-side filtering
    const subdivisionsArray = Array.isArray(subdivisions)
        ? subdivisions
        : subdivisions?.data || [];
    const searchArray = allSubdivisions || subdivisionsArray; // Gunakan allSubdivisions saat ada search/filter

    const filteredSubdivisions = searchArray.filter((subdivision) => {
        const matchText =
            !search ||
            subdivision.name.toLowerCase().includes(search.toLowerCase()) ||
            (subdivision.description &&
                subdivision.description
                    .toLowerCase()
                    .includes(search.toLowerCase()));
        const matchDivision =
            selectedDivision === "all" ||
            selectedDivision === "" ||
            (subdivision.division &&
                subdivision.division.name &&
                subdivision.division.name.toLowerCase() ===
                    selectedDivision.toLowerCase());
        return matchText && matchDivision;
    });

    // Buat pagination object yang menggunakan backend pagination tapi dengan filtered data
    const paginationData = useMemo(() => {
        // Jika ada search/filter, gunakan client-side pagination
        if (search || (selectedDivision && selectedDivision !== "all")) {
            const itemsPerPage = 10;
            const totalPages = Math.ceil(
                filteredSubdivisions.length / itemsPerPage
            );
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedSubdivisions = filteredSubdivisions.slice(
                startIndex,
                endIndex
            );

            return {
                data: paginatedSubdivisions,
                current_page: currentPage,
                from: filteredSubdivisions.length > 0 ? startIndex + 1 : 0,
                to: Math.min(endIndex, filteredSubdivisions.length),
                total: filteredSubdivisions.length,
                last_page: totalPages,
                prev_page_url: currentPage > 1 ? "#" : null,
                next_page_url: currentPage < totalPages ? "#" : null,
                links: Array.from({ length: totalPages }, (_, i) => ({
                    label: String(i + 1),
                    url: i + 1 === currentPage ? null : "#",
                    active: i + 1 === currentPage,
                })),
            };
        } else {
            return subdivisions;
        }
    }, [
        filteredSubdivisions,
        currentPage,
        search,
        selectedDivision,
        subdivisions,
        allSubdivisions,
    ]);

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
                            filteredSubdivisions={paginationData}
                            search={search}
                            setSearch={setSearch}
                            selectedDivision={selectedDivision}
                            setSelectedDivision={setSelectedDivision}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            setIsModalOpen={setIsModalOpen}
                            setEditingSubdivision={setEditingSubdivision}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            isLoadingAll={isLoadingAll}
                        />
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />

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
