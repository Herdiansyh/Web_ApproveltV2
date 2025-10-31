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
import { X } from "lucide-react";

export default function StepPermissions({
    auth,
    step,
    permissions,
    subdivisions,
}) {
    const [selectedSubdivision, setSelectedSubdivision] = useState("");
    const { data, setData, post, put, processing, reset } = useForm({
        subdivision_id: "",
        can_read: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,
    });

    // Tambah permission baru
    const handleAdd = () => {
        if (!selectedSubdivision) return;
        post(route("workflow-steps.permissions.store", step.id), {
            data: {
                subdivision_id: selectedSubdivision,
                can_read: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_approve: false,
            },
            onSuccess: () => {
                setSelectedSubdivision("");
                reset();
                Swal.fire({
                    icon: "success",
                    title: "Permission added",
                    timer: 1500,
                    showConfirmButton: false,
                });
            },
        });
    };

    // Bulk update semua checkbox
    const handleBulkUpdate = () => {
        const payload = permissions.map((perm) => ({
            subdivision_id: perm.subdivision_id,
            can_read: perm.can_read,
            can_create: perm.can_create,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
            can_approve: perm.can_approve,
        }));

        put(route("workflow-steps.permissions.bulkUpdate", step.id), {
            data: { permissions: payload },
            onSuccess: () => {
                Swal.fire({
                    icon: "success",
                    title: "Permissions updated",
                    timer: 1500,
                    showConfirmButton: false,
                });
            },
        });
    };

    // Hapus permission
    const handleDelete = (permissionId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This will remove the permission.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    route("workflow-steps.permissions.destroy", permissionId),
                    {
                        onSuccess: () => {
                            Swal.fire(
                                "Deleted!",
                                "Permission has been removed.",
                                "success"
                            );
                        },
                    }
                );
            }
        });
    };

    // Toggle checkbox
    const handleToggle = (perm, field) => {
        perm[field] = !perm[field];
        setData({ ...data, ...perm });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Workflow Step Permissions
                </h2>
            }
        >
            <Head title={`Step Permissions - ${step.name}`} />
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="py-12 w-full overflow-auto relative">
                    <div className="mx-auto p-6 lg:px-8">
                        <h1 className="absolute top-5 text-2xl font-bold">
                            Step: {step.name} (Workflow: {step.workflow.name})
                        </h1>

                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                                <div className="flex gap-2 w-full">
                                    <Select
                                        value={selectedSubdivision}
                                        onValueChange={(value) =>
                                            setSelectedSubdivision(value)
                                        }
                                    >
                                        <SelectTrigger
                                            className="md:w-1/2 border border-gray-300"
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <SelectValue placeholder="Select Subdivision..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subdivisions.map((sub) => (
                                                <SelectItem
                                                    key={sub.id}
                                                    value={sub.id}
                                                >
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleAdd}
                                        className="w-[150px] h-9 text-sm"
                                        style={{ borderRadius: "8px" }}
                                    >
                                        + Add Permission
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleBulkUpdate}
                                    className="w-[180px] h-9 text-sm"
                                    style={{ borderRadius: "8px" }}
                                >
                                    Save All Changes
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subdivision</TableHead>
                                        <TableHead>Read</TableHead>
                                        <TableHead>Create</TableHead>
                                        <TableHead>Edit</TableHead>
                                        <TableHead>Delete</TableHead>
                                        <TableHead>Approve</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.length > 0 ? (
                                        permissions.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    {perm.subdivision.name}
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={perm.can_read}
                                                        onChange={() =>
                                                            handleToggle(
                                                                perm,
                                                                "can_read"
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            perm.can_create
                                                        }
                                                        onChange={() =>
                                                            handleToggle(
                                                                perm,
                                                                "can_create"
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={perm.can_edit}
                                                        onChange={() =>
                                                            handleToggle(
                                                                perm,
                                                                "can_edit"
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            perm.can_delete
                                                        }
                                                        onChange={() =>
                                                            handleToggle(
                                                                perm,
                                                                "can_delete"
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            perm.can_approve
                                                        }
                                                        onChange={() =>
                                                            handleToggle(
                                                                perm,
                                                                "can_approve"
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                perm.id
                                                            )
                                                        }
                                                        style={{
                                                            borderRadius:
                                                                "15px",
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan="7"
                                                className="text-center text-gray-500"
                                            >
                                                No permissions set for this
                                                step.
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
