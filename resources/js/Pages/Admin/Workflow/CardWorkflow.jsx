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
import { router, Link } from "@inertiajs/react";
import {
    ArrowRight,
    Edit,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import React from "react";
import Swal from "sweetalert2";
export default function CardWorkflow({
    filteredWorkflows,
    filterText,
    setFilterText,
    filterDocument,
    setFilterDocument,
    documents,
    workflows,
    openCreateModal,
    openEditModal,
    handleDelete,
}) {
    console.log(workflows);
    return (
        <Card style={{ borderRadius: "15px" }} className="p-6 shadow-xl">
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
                        <TableHead>Divisions</TableHead>
                        <TableHead>Subdivisions</TableHead>
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
                                    <div className="flex flex-wrap gap-1">
                                        {wf?.all_division ? (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                                style={{ borderRadius: "10px" }}
                                            >
                                                All Divisions
                                            </Badge>
                                        ) : wf?.divisions?.length > 0 ? (
                                            wf.divisions.map((division) => (
                                                <Badge
                                                    key={division.id}
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                >
                                                    {division.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                No divisions
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {wf?.all_division ? (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                                style={{ borderRadius: "10px" }}
                                            >
                                                All Divisions
                                            </Badge>
                                        ) : wf?.subdivisions?.length > 0 ? (
                                            wf.subdivisions.map(
                                                (subdivision) => (
                                                    <Badge
                                                        key={subdivision.id}
                                                        variant="outline"
                                                        className="text-xs"
                                                        style={{
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                    >
                                                        {subdivision.name}
                                                    </Badge>
                                                )
                                            )
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                No divisions
                                            </span>
                                        )}
                                    </div>
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
                                        {/* Deprecated: Per-step permissions (hidden) */}
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
                                colSpan={7}
                                className="text-center text-gray-500 py-8"
                            >
                                No workflows found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {workflows && workflows.total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                        Showing {workflows.from} to {workflows.to} of{" "}
                        {workflows.total} workflows
                    </div>
                    <div className="flex gap-2">
                        {workflows.prev_page_url && (
                            <Link href={workflows.prev_page_url}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderRadius: "8px" }}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                            </Link>
                        )}

                        {workflows.links &&
                            workflows.links.map((link, index) => {
                                if (link.label === "&laquo; Previous") {
                                    return null;
                                }
                                if (link.label === "Next &raquo;") {
                                    return null;
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        only={[]}
                                    >
                                        <Button
                                            variant={
                                                link.active
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="sm"
                                            disabled={!link.url}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            {link.label}
                                        </Button>
                                    </Link>
                                );
                            })}

                        {workflows.next_page_url && (
                            <Link href={workflows.next_page_url}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderRadius: "8px" }}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
