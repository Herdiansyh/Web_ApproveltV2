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
import { useForm } from "@inertiajs/react";
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
import { X } from "lucide-react"; // untuk ikon hapus filter

export default function Index({ auth, users, divisions, roles }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedDivision, setSelectedDivision] = useState(""); // filter divisi

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        role: "",
        division_id: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingUser) {
            put(route("users.update", editingUser.id), {
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
            });
        } else {
            post(route("users.store"), {
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
            });
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            division_id: user.division_id,
        });
    };

    const handleDelete = (userId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("users.destroy", userId), {
                    onSuccess: () => {
                        Swal.fire(
                            "Deleted!",
                            "The user has been deleted.",
                            "success"
                        );
                    },
                });
            }
        });
    };

    // Filter user berdasarkan division
    const filteredUsers = selectedDivision
        ? users.data.filter(
              (user) => String(user.division_id) === String(selectedDivision)
          )
        : users.data;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    User Management
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="flex min-h-screen bg-background">
                <Sidebar />

                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto p-6 lg:px-8">
                        <Card className="p-6">
                            {/* Header dan Filter */}
                            {/* Filter & Add */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <Select
                                        value={selectedDivision}
                                        onValueChange={(value) =>
                                            setSelectedDivision(value)
                                        }
                                    >
                                        <SelectTrigger
                                            className="md:w-1/4 border border-gray-300"
                                            style={{ borderRadius: "8px" }}
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
                                    className="w-[180px] h-9 text-sm"
                                    style={{ borderRadius: "8px" }}
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

                            {/* Tabel Users */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Division</TableHead>
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
                                                colSpan="5"
                                                className="text-center text-gray-500"
                                            >
                                                No users found for this
                                                division.
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
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="password">
                                        {editingUser
                                            ? "Password (leave blank to keep current)"
                                            : "Password"}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="role">Role</Label>
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
                                    {errors.role && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="division">Division</Label>
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
                                                    value={division.id}
                                                >
                                                    {division.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.division_id && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.division_id}
                                        </p>
                                    )}
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
                                    style={{
                                        borderRadius: "15px",
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    style={{
                                        borderRadius: "15px",
                                    }}
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
