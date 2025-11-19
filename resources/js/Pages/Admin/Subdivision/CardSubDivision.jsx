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

export default function CardSubDivision({
    divisions,
    filteredSubdivisions,
    search,
    setSearch,
    selectedDivision,
    setSelectedDivision,
    handleEdit,
    handleDelete,
    setIsModalOpen,
    setEditingSubdivision,
}) {
    return (
        <Card style={{ borderRadius: "15px" }} className="p-6">
            {/* Filter dan tombol tambah */}
            <div className="flex  md:flex-row justify-between gap-3 mb-4">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                    <div className="flex lg:flex-row flex-col w-full gap-2">
                        <Input
                            className="lg:w-1/3 text-[0.8rem]"
                            placeholder="Search Subdivision..."
                            style={{
                                borderRadius: "15px",
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Select
                            value={selectedDivision}
                            onValueChange={(value) =>
                                setSelectedDivision(value)
                            }
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
                                    All Divisions
                                </SelectItem>
                                {divisions.map((d) => (
                                    <SelectItem
                                        key={d.id}
                                        value={d.name.toLowerCase()}
                                    >
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingSubdivision(null);
                            setIsModalOpen(true);
                        }}
                        className="md:w-[200px] w-full h-9 text-[0.8rem] sm:text-sm"
                        style={{
                            borderRadius: "15px",
                        }}
                    >
                        + Add New Subdivision
                    </Button>
                </div>
            </div>

            {/* Tabel Subdivisions */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSubdivisions.length > 0 ? (
                        filteredSubdivisions.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell>{sub.name}</TableCell>
                                <TableCell>
                                    {sub.division?.name || "-"}
                                </TableCell>
                                <TableCell>{sub.description || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(sub)}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(sub.id)}
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
                                colSpan={4}
                                className="text-center text-gray-500"
                            >
                                No subdivisions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
