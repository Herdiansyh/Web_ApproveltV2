import React, { useState, useEffect } from "react";
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

export default function Index({ auth, users, divisions, subdivisions, roles }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedDivision, setSelectedDivision] = useState("");
    const [search, setSearch] = useState("");
    const [filteredSubdivisions, setFilteredSubdivisions] = useState([]);

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

    const handleSearch = (e) => setSearch(e.target.value);

    // Filter subdiv berdasarkan division yang dipilih di form
    useEffect(() => {
        if (data.division_id) {
            const filtered = subdivisions.filter(
                (sub) => sub.division_id === parseInt(data.division_id)
            );
            setFilteredSubdivisions(filtered);
        } else {
            setFilteredSubdivisions([]);
        }
    }, [data.division_id, subdivisions]);

    const filteredUsers = users.data.filter((user) => {
        const matchesDivision = selectedDivision
            ? String(user.division_id) === String(selectedDivision)
            : true;
        const matchesSearch = search
            ? user.name.toLowerCase().includes(search.toLowerCase())
            : true;
        return matchesDivision && matchesSearch;
    });

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
        // Set semua data user dulu, tapi kosongkan subdivision_id sementara
        setTimeout(() => {
            setData({
                name: user.name,
                email: user.email,
                password: "",
                role: user.role,
                division_id: user.division_id,
                subdivision_id: user.subdivision_id,
            });
        }, 0);
        // Setelah filteredSubdivisions sudah kebentuk (karena division_id berubah),
        // baru set subdivision_id supaya dropdown bisa nemu datanya
        setTimeout(() => {
            setData((prev) => ({
                ...prev,
                subdivision_id: user.subdivision_id,
            }));
        }, 100);
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
            console.error("Global error caught:", event.error);
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
    console.log(users.subdivision?.name);
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
                            filteredUsers={filteredUsers}
                            search={search}
                            handleSearch={handleSearch}
                            selectedDivision={selectedDivision}
                            setSelectedDivision={setSelectedDivision}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            setEditingUser={setEditingUser}
                            reset={reset}
                            setShowCreateModal={setShowCreateModal}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingUser) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
            )}
        </AuthenticatedLayout>
    );
}
