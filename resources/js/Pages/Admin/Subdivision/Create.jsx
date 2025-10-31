import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import Swal from "sweetalert2";

export default function Create({ isOpen, onClose, subdivision, divisions }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
        division_id: "",
    });

    useEffect(() => {
        if (subdivision) {
            setData({
                name: subdivision.name,
                description: subdivision.description || "",
                division_id: subdivision.division_id || "",
            });
        } else {
            reset();
        }
    }, [subdivision]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const action = subdivision
            ? put(route("subdivisions.update", subdivision.id))
            : post(route("subdivisions.store"));

        action.then(() => {
            Swal.fire({
                icon: "success",
                title: subdivision ? "Updated" : "Created",
                text: `Subdivision ${
                    subdivision ? "updated" : "created"
                } successfully!`,
                timer: 2000,
                showConfirmButton: false,
            });
            reset();
            onClose();
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {subdivision
                            ? "Edit Subdivision"
                            : "Create New Subdivision"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="division_id">Division</Label>
                        <Select
                            value={data.division_id}
                            onValueChange={(value) =>
                                setData("division_id", value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a Division" />
                            </SelectTrigger>
                            <SelectContent>
                                {divisions.map((d) => (
                                    <SelectItem
                                        key={d.id}
                                        value={d.id.toString()}
                                    >
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.division_id && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.division_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {subdivision ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
