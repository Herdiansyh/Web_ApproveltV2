import React, { useState, useEffect, useMemo } from "react";
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
import Swal from "sweetalert2";
import { X } from "lucide-react";
import Header from "@/Components/Header";
import CardUsers from "./CardUsers";
import { set } from "zod";
import CardCreate from "./CardCreate";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";

export default function Index({ auth, users, divisions, subdivisions, roles }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedDivision, setSelectedDivision] = useState("all");
    const [search, setSearch] = useState("");
    const [filteredSubdivisions, setFilteredSubdivisions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        role: "",
        division_id: "",
        subdivision_id: "",
    });

    // Fungsi untuk menampilkan notifikasi error
    const showErrorAlert = (title, text = "") => {
        Swal.fire({
            icon: "error",
            title: title,
            text: text,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc2626",
        });
    };

    // Fungsi untuk menampilkan notifikasi error dari response server
    const showServerErrorAlert = (error) => {
        let errorMessage = "Terjadi kesalahan yang tidak diketahui";

        if (typeof error === "string") {
            errorMessage = error;
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === "object") {
            // Jika error berupa object, kita gabungkan semua pesan error
            errorMessage = Object.values(error).flat().join(", ");
        }

        showErrorAlert("Operation Failed", errorMessage);
    };

    // Reset page saat search atau filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDivision]);

    const handleSearch = (e) => setSearch(e.target.value);

    // Filter subdiv berdasarkan division yang dipilih di form
    useEffect(() => {
        if (data.division_id) {
            const filtered = subdivisions.filter(
                (sub) => String(sub.division_id) === String(data.division_id)
            );
            setFilteredSubdivisions(filtered);
        } else {
            setFilteredSubdivisions([]);
        }
    }, [data.division_id, subdivisions]);

    // State untuk menyimpan semua data saat search
    const [allUsers, setAllUsers] = useState(null);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    // Fetch semua data saat search/filter aktif
    useEffect(() => {
        if (search || (selectedDivision && selectedDivision !== "all")) {
            const fetchAllUsers = async () => {
                setIsLoadingAll(true);
                try {
                    const response = await fetch("/users/all");
                    const data = await response.json();
                    setAllUsers(data.data);
                } catch (error) {
                    console.error("Error fetching all users:", error);
                } finally {
                    setIsLoadingAll(false);
                }
            };
            fetchAllUsers();
        } else {
            setAllUsers(null); // Reset saat tidak ada filter
        }
    }, [search, selectedDivision]);

    // Gunakan pagination backend yang sudah ada dengan client-side filtering
    const usersArray = Array.isArray(users) ? users : users?.data || [];
    const searchArray = allUsers || usersArray; // Gunakan allUsers saat ada search/filter

    const filteredUsers = searchArray.filter((user) => {
        const matchText =
            !search ||
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchDivision =
            selectedDivision === "all" ||
            selectedDivision === "" ||
            String(user.division_id) === selectedDivision;
        return matchText && matchDivision;
    });

    // Buat pagination object yang menggunakan backend pagination tapi dengan filtered data
    const paginationData = useMemo(() => {
        // Jika ada search/filter, gunakan client-side pagination
        if (search || (selectedDivision && selectedDivision !== "all")) {
            const itemsPerPage = 10;
            const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return {
                data: paginatedUsers,
                current_page: currentPage,
                from: filteredUsers.length > 0 ? startIndex + 1 : 0,
                to: Math.min(endIndex, filteredUsers.length),
                total: filteredUsers.length,
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
            return users;
        }
    }, [filteredUsers, currentPage, search, selectedDivision, users, allUsers]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const action = editingUser
            ? put(route("users.update", editingUser.id), {
                  onSuccess: () => {
                      setEditingUser(null);
                      reset();
                      Swal.fire({
                          icon: "success",
                          title: "User updated",
                          text: "The user has been successfully updated!",
                          timer: 2000,
                          showConfirmButton: false,
                      });
                  },
                  onError: (errors) => {
                      showServerErrorAlert(errors);
                  },
              })
            : post(route("users.store"), {
                  onSuccess: () => {
                      setShowCreateModal(false);
                      reset();
                      Swal.fire({
                          icon: "success",
                          title: "User created",
                          text: "A new user has been successfully created!",
                          timer: 2000,
                          showConfirmButton: false,
                      });
                  },
                  onError: (errors) => {
                      showServerErrorAlert(errors);
                  },
              });
    };

    const handleEdit = (user) => {
        setEditingUser(user);

        // Set data user sekaligus - React akan handle urutan rendering dengan benar
        setData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            division_id: user.division_id,
            subdivision_id: user.subdivision_id,
        });
    };

    const handleDelete = (userId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            confirmButtonColor: "#dc2626",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("users.destroy", userId), {
                    onSuccess: () => {
                        Swal.fire({
                            title: "Deleted!",
                            text: "User has been deleted.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (error) => {
                        let errorMessage = "Failed to delete user";

                        if (error?.message) {
                            errorMessage = error.message;
                        } else if (error?.error) {
                            errorMessage = error.error;
                        }

                        showErrorAlert("Delete Failed", errorMessage);
                    },
                });
            }
        });
    };

    // Handle network errors atau unexpected errors
    useEffect(() => {
        const handleGlobalError = (event) => {
            // Tangkap error global yang tidak tertangani
            showErrorAlert(
                "System Error",
                "An unexpected error occurred. Please try again."
            );
        };

        window.addEventListener("error", handleGlobalError);

        return () => {
            window.removeEventListener("error", handleGlobalError);
        };
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl">User Management</h2>}
        >
            <Head title="User Management" />
            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="py-12 w-full overflow-auto ">
                    <div className="mx-auto p-6 lg:px-8 ">
                        <h1 className=" top-5 text-2xl font-bold">
                            User Management
                        </h1>
                        <CardUsers
                            auth={auth}
                            divisions={divisions}
                            filteredUsers={paginationData}
                            search={search}
                            handleSearch={handleSearch}
                            selectedDivision={selectedDivision}
                            setSelectedDivision={setSelectedDivision}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            setEditingUser={setEditingUser}
                            reset={reset}
                            setShowCreateModal={setShowCreateModal}
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
            {/* Create/Edit Modal */}
            {(showCreateModal || editingUser) && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[50]">
                        <CardCreate
                            data={data}
                            setData={setData}
                            handleSubmit={handleSubmit}
                            processing={processing}
                            errors={errors}
                            divisions={divisions}
                            roles={roles}
                            filteredSubdivisions={filteredSubdivisions}
                            editingUser={editingUser}
                            setShowCreateModal={setShowCreateModal}
                            setEditingUser={setEditingUser}
                            reset={reset}
                        />
                    </div>
                    <style jsx global>{`
                        aside {
                            pointer-events: none !important;
                        }
                        aside * {
                            pointer-events: none !important;
                        }
                    `}</style>
                </>
            )}
        </AuthenticatedLayout>
    );
}
