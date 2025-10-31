import React, { useState, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";

export default function WorkflowStepPermissionIndex() {
    const { workflowStep, permissions = [], users = [] } = usePage().props;

    const [search, setSearch] = useState("");

    const filteredPermissions = useMemo(() => {
        if (!permissions) return [];
        return permissions.filter((perm) =>
            perm.user.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [permissions, search]);

    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("workflow-steps.permissions.destroy", id), {
                    onSuccess: () => {
                        Swal.fire("Deleted!", "Permission removed.", "success");
                    },
                });
            }
        });
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="py-12 w-full overflow-auto relative p-6">
                <h1 className="text-2xl font-bold mb-4">
                    Workflow Step Permissions - {workflowStep.name}
                </h1>

                <div className="mb-4 flex gap-2 items-center">
                    <Input
                        placeholder="Search user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>No</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPermissions.length > 0 ? (
                            filteredPermissions.map((perm, idx) => (
                                <TableRow key={perm.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{perm.user.name}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.get(
                                                        route(
                                                            "workflow-steps.permissions.edit",
                                                            perm.id
                                                        )
                                                    )
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDelete(perm.id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                    No permissions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="mt-4">
                    <Button
                        onClick={() =>
                            router.get(
                                route(
                                    "workflow-steps.permissions.create",
                                    workflowStep.id
                                )
                            )
                        }
                    >
                        + Add Permission
                    </Button>
                </div>
            </div>
        </div>
    );
}
