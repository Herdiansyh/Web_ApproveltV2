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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import React from "react";

export default function CardDivision({
    divisions,
    handleSearch,
    search,
    selectedDivision,
    setSelectedDivision,
    filteredDivisions,
    handleEdit,
    handleDelete,
    setIsModalOpen,
    setSelectedDivisionForSub,
    setEditingDivision,
}) {
    return (
        <Card className="p-6 shadow-xl" style={{ borderRadius: "15px" }}>
            {/* Filter & Add Button */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <div className="flex flex-col lg:flex-row gap-2 w-full">
                    <Input
                        className="lg:w-1/3"
                        placeholder="Search Division..."
                        value={search}
                        onChange={handleSearch}
                        style={{
                            borderRadius: "15px",
                        }}
                    />
                    <Select
                        value={selectedDivision}
                        onValueChange={(value) => setSelectedDivision(value)}
                    >
                        <SelectTrigger
                            style={{
                                borderRadius: "15px",
                            }}
                            className="lg:w-1/4 text-[0.8rem]"
                        >
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {" "}
                                {/* ✅ UBAH DARI "" KE "all" */} All Divisions
                            </SelectItem>
                            {(divisions?.data || []).map((d) => (
                                <SelectItem
                                    key={d.id}
                                    value={d.name.toLowerCase()} // ✅ PASTIKAN VALUE TIDAK KOSONG
                                >
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={() => {
                        setEditingDivision(null);
                        setIsModalOpen(true);
                    }}
                    className="md:w-[180px] w-full  h-9 text-sm "
                    style={{
                        borderRadius: "15px",
                    }}
                >
                    + Add New Division
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDivisions &&
                    filteredDivisions.data &&
                    filteredDivisions.data.length > 0 ? (
                        filteredDivisions.data.map((division) => (
                            <TableRow key={division.id}>
                                <TableCell>
                                    <button
                                        onClick={() =>
                                            setSelectedDivisionForSub(division)
                                        }
                                        className="text-blue-600 hover:underline"
                                    >
                                        {division.name}
                                    </button>
                                </TableCell>
                                <TableCell>
                                    {division.description || "-"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(division)}
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
                                                handleDelete(division.id)
                                            }
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={3}
                                className="text-center text-gray-500"
                            >
                                No divisions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {filteredDivisions && filteredDivisions.total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                        Showing {filteredDivisions.from} to{" "}
                        {filteredDivisions.to} of {filteredDivisions.total}{" "}
                        divisions
                    </div>
                    <div className="flex gap-2">
                        {filteredDivisions.prev_page_url && (
                            <Link href={filteredDivisions.prev_page_url}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderRadius: "8px" }}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                            </Link>
                        )}

                        {filteredDivisions.links &&
                            filteredDivisions.links.map((link, index) => {
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

                        {filteredDivisions.next_page_url && (
                            <Link href={filteredDivisions.next_page_url}>
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
