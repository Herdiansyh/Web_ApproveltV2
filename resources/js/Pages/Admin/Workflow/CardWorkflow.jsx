import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { router } from "@inertiajs/react";
import { ArrowRight, Edit, Plus, Settings, Trash2 } from "lucide-react";
import React from "react";
export default function CardWorkflow({
    filteredWorkflows,
    filterText,
    setFilterText,
    filterDocument,
    setFilterDocument,
    documents,
    openCreateModal,
    goToPermissions,
    openEditModal,
    handleDelete,
}) {
    return (
        <Card style={{ borderRadius: "15px" }} className="p-6 shadow-sm">
            {/* Filters & Create Button */}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex flex-col lg:flex-row gap-2 flex-1">
                    <Input
                        placeholder="Search workflows..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="md:w-64 text-[0.8rem]"
                        style={{ borderRadius: "15px" }}
                    />
                    <Select
                        value={filterDocument}
                        onValueChange={setFilterDocument}
                    >
                        <SelectTrigger
                            style={{ borderRadius: "15px" }}
                            className="md:w-64 text-[0.8rem]"
                        >
                            <SelectValue placeholder="Filter by document type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Documents</SelectItem>
                            {documents.map((doc) => (
                                <SelectItem key={doc.id} value={doc.name}>
                                    {doc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="md:w-auto"
                    style={{ borderRadius: "15px" }}
                >
                    <Plus className="h-4 w-4 mr-2 text-[0.8rem]" /> Create
                    Workflow
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Steps</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredWorkflows.length > 0 ? (
                        filteredWorkflows.map((wf) => (
                            <TableRow key={wf.id}>
                                <TableCell className="font-medium">
                                    {wf.name}
                                </TableCell>
                                <TableCell>
                                    {wf.document?.name || "-"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center text-sm text-gray-600">
                                        {wf.steps?.map((step, idx) => (
                                            <React.Fragment key={idx}>
                                                <span>
                                                    {step.division?.name ||
                                                        "N/A"}
                                                </span>
                                                {idx < wf.steps.length - 1 && (
                                                    <ArrowRight className="h-4 w-4 mx-1" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            wf.is_active
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                        }
                                        style={{
                                            borderRadius: "15px",
                                        }}
                                    >
                                        {wf.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                goToPermissions(wf.id)
                                            }
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            <Settings className="h-4 w-4 mr-1" />{" "}
                                            Permissions
                                        </Button>
                                        <Button
                                            variant={
                                                wf.is_active
                                                    ? "outline"
                                                    : "secondary"
                                            }
                                            size="sm"
                                            onClick={() => {
                                                const payload = {
                                                    name: wf.name,
                                                    description:
                                                        wf.description || "",
                                                    document_id: wf.document_id,
                                                    is_active: !wf.is_active,
                                                };
                                                router.put(
                                                    route(
                                                        "workflows.update",
                                                        wf.id
                                                    ),
                                                    payload,
                                                    {
                                                        onSuccess: () => {
                                                            Swal.fire(
                                                                "Success",
                                                                `Workflow ${
                                                                    !wf.is_active
                                                                        ? "activated"
                                                                        : "deactivated"
                                                                }`,
                                                                "success"
                                                            );
                                                        },
                                                    }
                                                );
                                            }}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            {wf.is_active
                                                ? "Deactivate"
                                                : "Activate"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(wf)}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />{" "}
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(wf.id)}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 " />{" "}
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center text-gray-500 py-8"
                            >
                                No workflows found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
