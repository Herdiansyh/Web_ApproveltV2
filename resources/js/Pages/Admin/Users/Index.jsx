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
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";
import { User, X } from "lucide-react";

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
                <Sidebar />
                <div className="py-12 w-full overflow-auto relative">
                    <div className="mx-auto p-6 lg:px-8 ">
                        <h1 className="absolute top-5 text-2xl font-bold">
                            User Management
                        </h1>
                        <Card className="p-6">
                            {/* Filter & Add */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <Input
                                        className="md:w-1/2 text-[0.8rem]"
                                        placeholder="Search User..."
                                        value={search}
                                        onChange={handleSearch}
                                        style={{ borderRadius: "15px" }}
                                    />
                                    <Select
                                        value={selectedDivision}
                                        onValueChange={(value) =>
                                            setSelectedDivision(value)
                                        }
                                    >
                                        <SelectTrigger
                                            style={{ borderRadius: "15px" }}
                                            className="md:w-1/4 border text-[0.8rem] border-gray-300"
                                        >
                                            <SelectValue placeholder="Filter by Division..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisions.map((division) => (
                                                <SelectItem
                                                    key={division.id}
                                                    value={String(division.id)}
                                                >
                                                    {division.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={() => {
                                        setEditingUser(null);
                                        reset();
                                        setShowCreateModal(true);
                                    }}
                                    className="sm:w-[180px] w-full h-9 text-sm"
                                    style={{ borderRadius: "15px" }}
                                >
                                    + Add New User
                                </Button>
                            </div>

                            {/* Active Filter */}
                            {selectedDivision && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">
                                        {
                                            divisions.find(
                                                (d) =>
                                                    String(d.id) ===
                                                    selectedDivision
                                            )?.name
                                        }
                                        <X
                                            size={14}
                                            className="cursor-pointer hover:text-red-500"
                                            onClick={() =>
                                                setSelectedDivision("")
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Subdivision</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    {user.name}
                                                </TableCell>
                                                <TableCell>
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    {user.role
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        user.role.slice(1)}
                                                </TableCell>
                                                <TableCell>
                                                    {user.division?.name ||
                                                        "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {user.subdivision?.name ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(user)
                                                            }
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        {user.id !==
                                                            auth.user.id && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user.id
                                                                    )
                                                                }
                                                                style={{
                                                                    borderRadius:
                                                                        "15px",
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan="6"
                                                className="text-center text-gray-500"
                                            >
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingUser) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingUser ? "Edit User" : "Create New User"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Password</Label>
                                    <Input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Role</Label>
                                    <Select
                                        value={data.role}
                                        onValueChange={(value) =>
                                            setData("role", value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role}
                                                    value={role}
                                                >
                                                    {role
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        role.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Division</Label>
                                    <Select
                                        value={data.division_id}
                                        onValueChange={(value) =>
                                            setData("division_id", value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select division" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisions.map((division) => (
                                                <SelectItem
                                                    key={division.id}
                                                    value={String(division.id)}
                                                >
                                                    {division.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Subdivision</Label>
                                    <Select
                                        value={data.subdivision_id}
                                        onValueChange={(value) =>
                                            setData("subdivision_id", value)
                                        }
                                        disabled={!data.division_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select subdivision" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSubdivisions.length > 0 ? (
                                                filteredSubdivisions.map(
                                                    (sub) => (
                                                        <SelectItem
                                                            key={sub.id}
                                                            value={String(
                                                                sub.id
                                                            )}
                                                        >
                                                            {sub.name}
                                                        </SelectItem>
                                                    )
                                                )
                                            ) : (
                                                <div className="text-gray-500 px-2 py-1 text-sm">
                                                    No subdivision available
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingUser(null);
                                        reset();
                                    }}
                                    style={{ borderRadius: "15px" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    style={{ borderRadius: "15px" }}
                                    disabled={processing}
                                >
                                    {editingUser ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
