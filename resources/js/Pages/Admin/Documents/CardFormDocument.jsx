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
import React from "react";

export default function CardFormDocument({
    handleSearch,
    search,
    filterDocument,
    setFilterDocument,
    documents,
    filteredDocuments,
    handleEdit,
    openFields,
    handleDelete,
    handleSaveSeries,
    handleResetSeries,
    setIsModalOpen,
    setEditingDocument,
}) {
    return (
        <Card className="p-6" style={{ borderRadius: "15px" }}>
            {/* Filter & Add Button */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                    <Input
                        className="md:w-1/2 text-[0.8rem]"
                        placeholder="Search Document..."
                        value={search}
                        onChange={handleSearch}
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
                    onClick={() => {
                        setEditingDocument(null);
                        setIsModalOpen(true);
                    }}
                    className="md:w-[180px] w-full h-9 text-[0.8rem]"
                    style={{ borderRadius: "15px" }}
                >
                    + Add New Document
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell>{doc.name}</TableCell>
                                <TableCell>{doc.description || "-"}</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                            doc.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {doc.is_active ? "Active" : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openFields(doc)}
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                            >
                                                Manage Fields
                                            </Button>
                                            <Button
                                                variant={
                                                    doc.is_active
                                                        ? "outline"
                                                        : "secondary"
                                                }
                                                size="sm"
                                                onClick={() => {
                                                    const payload = {
                                                        name: doc.name,
                                                        description:
                                                            doc.description ||
                                                            "",
                                                        is_active:
                                                            !doc.is_active,
                                                    };
                                                    router.put(
                                                        route(
                                                            "documents.update",
                                                            doc.id
                                                        ),
                                                        payload,
                                                        {
                                                            onSuccess: () => {
                                                                Swal.fire(
                                                                    "Success",
                                                                    `Document ${
                                                                        !doc.is_active
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
                                                {doc.is_active
                                                    ? "Deactivate"
                                                    : "Activate"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(doc)}
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(doc.id)
                                                }
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>

                                        {/* Name Series Config */}

                                        <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                                            <p className="text-sm font-semibold text-slate-700 mb-3">
                                                Name Series
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                                {/* Pattern */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-slate-600">
                                                        Pattern
                                                    </label>
                                                    <Input
                                                        placeholder="yyyy-mm-####"
                                                        defaultValue={
                                                            doc.name_series
                                                                ?.series_pattern ||
                                                            ""
                                                        }
                                                        data-series-field="pattern"
                                                        className="h-8 text-xs rounded-xl bg-slate-100 border-slate-300 focus:ring-2 focus:ring-blue-400"
                                                    />
                                                </div>

                                                {/* Prefix */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-slate-600">
                                                        Prefix
                                                    </label>
                                                    <Input
                                                        placeholder="SUB-"
                                                        defaultValue={
                                                            doc.name_series
                                                                ?.prefix || ""
                                                        }
                                                        data-series-field="prefix"
                                                        className="h-8 text-xs rounded-xl bg-slate-100 border-slate-300 focus:ring-2 focus:ring-blue-400"
                                                    />
                                                </div>

                                                {/* Reset Type */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-slate-600">
                                                        Reset Type
                                                    </label>
                                                    <select
                                                        defaultValue={
                                                            doc.name_series
                                                                ?.reset_type ||
                                                            "none"
                                                        }
                                                        data-series-field="reset_type"
                                                        className="h-8 text-xs rounded-xl bg-slate-100 border border-slate-300 px-2 focus:ring-2 focus:ring-blue-400"
                                                    >
                                                        <option value="none">
                                                            No Reset
                                                        </option>
                                                        <option value="monthly">
                                                            Monthly
                                                        </option>
                                                        <option value="yearly">
                                                            Yearly
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Current Number */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-slate-600">
                                                        Current Number
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        defaultValue={
                                                            doc.name_series
                                                                ?.current_number ??
                                                            0
                                                        }
                                                        data-series-field="current_number"
                                                        className="h-8 text-xs rounded-xl bg-slate-100 border-slate-300 focus:ring-2 focus:ring-blue-400"
                                                    />
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-xl h-8 text-xs border-slate-300 hover:bg-blue-100 hover:text-blue-700 transition"
                                                    onClick={(e) => {
                                                        const container =
                                                            e.currentTarget.closest(
                                                                "div.p-4.rounded-2xl"
                                                            );
                                                        const getVal = (
                                                            selector
                                                        ) => {
                                                            const el =
                                                                container.querySelector(
                                                                    selector
                                                                );
                                                            return el
                                                                ? el.value
                                                                : "";
                                                        };

                                                        const payload = {
                                                            series_pattern:
                                                                getVal(
                                                                    "[data-series-field='pattern']"
                                                                ),
                                                            prefix: getVal(
                                                                "[data-series-field='prefix']"
                                                            ),
                                                            reset_type: getVal(
                                                                "[data-series-field='reset_type']"
                                                            ),
                                                            current_number:
                                                                Number(
                                                                    getVal(
                                                                        "[data-series-field='current_number']"
                                                                    ) || 0
                                                                ),
                                                        };

                                                        handleSaveSeries(
                                                            doc,
                                                            payload
                                                        );
                                                    }}
                                                >
                                                    Save
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-xl h-8 text-xs border-red-300 text-red-600 hover:bg-red-100 transition"
                                                    onClick={() =>
                                                        handleResetSeries(doc)
                                                    }
                                                >
                                                    Reset Counter
                                                </Button>
                                            </div>
                                        </div>
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
                                No documents found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
