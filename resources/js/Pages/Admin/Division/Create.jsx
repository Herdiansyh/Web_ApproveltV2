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
import Swal from "sweetalert2";

export default function Create({ isOpen, onClose, division }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
    });

    useEffect(() => {
        if (division) {
            setData({
                name: division.name,
                description: division.description || "",
            });
        } else {
            reset();
        }
    }, [division]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (division) {
            put(route("divisions.update", division.id), {
                onSuccess: () => {
                    Swal.fire({
                        icon: "success",
                        title: "Division updated",
                        text: "The division has been successfully updated!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    reset();
                    onClose();
                },
            });
        } else {
            post(route("divisions.store"), {
                onSuccess: () => {
                    Swal.fire({
                        icon: "success",
                        title: "Division created",
                        text: "A new division has been successfully created!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md ">
                <DialogHeader>
                    <DialogTitle>
                        {division ? "Edit Division" : "Create New Division"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
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
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            type="text"
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

                    <DialogFooter className="flex justify-center sm:justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            style={{
                                borderRadius: "15px",
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            style={{
                                borderRadius: "15px",
                            }}
                        >
                            {division ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
