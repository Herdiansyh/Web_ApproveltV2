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
import { X } from "lucide-react";
import React from "react";

export default function CardUsers({
    auth,
    divisions,
    filteredUsers,
    search,
    handleSearch,
    selectedDivision,
    setSelectedDivision,
    handleEdit,
    handleDelete,
    setEditingUser,
    reset,
    setShowCreateModal,
}) {
    return (
        <Card style={{ borderRadius: "15px" }} className="p-6">
            {/* Filter & Add */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                    <Input
                        className="md:w-1/2 text-[0.8rem]"
                        placeholder="Search User..."
                        value={search}
                        onChange={handleSearch}
                        style={{ borderRadius: "15px" }}
                    />
                    <Select
                        value={selectedDivision}
                        onValueChange={(value) => setSelectedDivision(value)}
                    >
                        <SelectTrigger
                            style={{ borderRadius: "15px" }}
                            className="md:w-1/4 border text-[0.8rem] border-gray-300"
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
                    className="sm:w-[180px] w-full h-9 text-sm"
                    style={{ borderRadius: "15px" }}
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
                                (d) => String(d.id) === selectedDivision
                            )?.name
                        }
                        <X
                            size={14}
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => setSelectedDivision("")}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Subdivision</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    {user.role.charAt(0).toUpperCase() +
                                        user.role.slice(1)}
                                </TableCell>
                                <TableCell>
                                    {user.division?.name || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {user.subdivision?.name || "-"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(user)}
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        {user.id !== auth.user.id && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(user.id)
                                                }
                                                style={{
                                                    borderRadius: "15px",
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
                                colSpan="6"
                                className="text-center text-gray-500"
                            >
                                No users found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
