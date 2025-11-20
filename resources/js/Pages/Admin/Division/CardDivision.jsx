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
        <Card className="p-6" style={{ borderRadius: "15px" }}>
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
                            {divisions.map((d) => (
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
                    {filteredDivisions.length > 0 ? (
                        filteredDivisions.map((division) => (
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
        </Card>
    );
}
