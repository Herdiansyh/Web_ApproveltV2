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
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Link } from "@inertiajs/react";

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
    currentPage,
    setCurrentPage,
    isLoadingAll = false,
}) {
    return (
        <Card style={{ borderRadius: "15px" }} className="shadow-xl p-6">
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
                            <SelectItem value="all">All Divisions</SelectItem>
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
            {selectedDivision && selectedDivision !== "all" && (
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

            {/* Loading indicator */}
            {isLoadingAll && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading all users for search...</span>
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
                    {filteredUsers.data && filteredUsers.data.length > 0 ? (
                        filteredUsers.data.map((user) => (
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

            {/* Pagination */}
            {filteredUsers.total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                        Showing {filteredUsers.from} to {filteredUsers.to} of{" "}
                        {filteredUsers.total} users
                    </div>
                    <div className="flex gap-2">
                        {filteredUsers.prev_page_url && (
                            filteredUsers.prev_page_url === '#' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderRadius: "8px" }}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                            ) : (
                                <Link href={filteredUsers.prev_page_url}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        style={{ borderRadius: "8px" }}
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                </Link>
                            )
                        )}

                        {filteredUsers.links &&
                            filteredUsers.links.map((link, index) => {
                                if (link.label === "&laquo; Previous") {
                                    return null;
                                }
                                if (link.label === "Next &raquo;") {
                                    return null;
                                }
                                return (
                                    <div key={index}>
                                        {link.url === '#' ? (
                                            <Button
                                                variant={
                                                    link.active
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                disabled={!link.url}
                                                style={{ borderRadius: "8px" }}
                                                onClick={() => link.url && setCurrentPage(parseInt(link.label))}
                                            >
                                                {link.label}
                                            </Button>
                                        ) : (
                                            <Link href={link.url || "#"}>
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
                                        )}
                                    </div>
                                );
                            })}

                        {filteredUsers.next_page_url && (
                            filteredUsers.next_page_url === '#' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ borderRadius: "8px" }}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Link href={filteredUsers.next_page_url}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        style={{ borderRadius: "8px" }}
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
