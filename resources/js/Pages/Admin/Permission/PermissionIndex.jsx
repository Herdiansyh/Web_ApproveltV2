import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import Header from "@/Components/Header";

export default function PermissionIndex({ auth }) {
    const { users = [], documents = [] } = usePage().props;

    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    // Filter users berdasarkan search
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((user) =>
            user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    const handleSearch = (e) => setSearch(e.target.value);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Permissions
                </h2>
            }
        >
            <Head title="Permissions" />
            <div className="flex min-h-screen bg-background">
                <Header />

                <div className="py-12 w-full overflow-auto relative">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="absolute top-5 text-2xl font-bold">
                            Permissions
                        </h1>
                        <Card className="p-6">
                            {/* Search Input */}
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <Input
                                    className="md:w-1/2"
                                    placeholder="Search User..."
                                    value={search}
                                    onChange={handleSearch}
                                    style={{ borderRadius: "8px" }}
                                />
                            </div>

                            {/* Tabel Users */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user, idx) => (
                                            <TableRow key={user.id}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    {user.name}
                                                </TableCell>
                                                <TableCell>
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/documents/${user.id}/permissions`}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                style={{
                                                                    borderRadius:
                                                                        "15px",
                                                                }}
                                                            >
                                                                Edit Permissions
                                                            </Button>
                                                        </Link>
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
        </AuthenticatedLayout>
    );
}
