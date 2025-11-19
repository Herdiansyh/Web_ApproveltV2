import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import React from "react";

export default function CardCreate({
    data,
    setData,
    handleSubmit,
    processing,
    errors,
    divisions,
    roles,
    filteredSubdivisions,
    editingUser,
    setShowCreateModal,
    reset,
    setEditingUser,
}) {
    return (
        <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
                {editingUser ? "Edit User" : "Create New User"}
            </h3>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <Label>Name</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <Label>Role</Label>
                        <Select
                            value={data.role}
                            onValueChange={(value) => setData("role", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role.charAt(0).toUpperCase() +
                                            role.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Division</Label>
                        <Select
                            value={data.division_id}
                            onValueChange={(value) =>
                                setData("division_id", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select division" />
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

                    <div>
                        <Label>Subdivision</Label>
                        <Select
                            value={data.subdivision_id}
                            onValueChange={(value) =>
                                setData("subdivision_id", value)
                            }
                            disabled={!data.division_id}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select subdivision" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredSubdivisions.length > 0 ? (
                                    filteredSubdivisions.map((sub) => (
                                        <SelectItem
                                            key={sub.id}
                                            value={String(sub.id)}
                                        >
                                            {sub.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="text-gray-500 px-2 py-1 text-sm">
                                        No subdivision available
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setShowCreateModal(false);
                            setEditingUser(null);
                            reset();
                        }}
                        style={{ borderRadius: "15px" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        style={{ borderRadius: "15px" }}
                        disabled={processing}
                    >
                        {editingUser ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
