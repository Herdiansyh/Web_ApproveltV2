import React, { useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
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

    // Fungsi untuk menampilkan notifikasi error
    const showErrorAlert = (title, text = "") => {
        Swal.fire({
            icon: "error",
            title: title,
            text: text,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc2626",
        });
    };

    // Fungsi untuk menampilkan notifikasi error dari response server
    const showServerErrorAlert = (error) => {
        let errorMessage = "Terjadi kesalahan yang tidak diketahui";

        if (typeof error === "string") {
            errorMessage = error;
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === "object") {
            errorMessage = Object.values(error).flat().join(", ");
        }

        showErrorAlert("Operation Failed", errorMessage);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (subdivision) {
            put(route("subdivisions.update", subdivision.id), {
                onSuccess: () => {
                    reset();
                    onClose();
                    Swal.fire({
                        icon: "success",
                        title: "Subdivision updated",
                        text: "The subdivision has been successfully updated!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    showServerErrorAlert(errors);
                },
            });
        } else {
            post(route("subdivisions.store"), {
                onSuccess: () => {
                    reset();
                    onClose();
                    Swal.fire({
                        icon: "success",
                        title: "Subdivision created",
                        text: "A new subdivision has been successfully created!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    showServerErrorAlert(errors);
                },
            });
        }
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
                            className={errors.name ? "border-red-500" : ""}
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
                            <SelectTrigger
                                className={`w-full ${
                                    errors.division_id ? "border-red-500" : ""
                                }`}
                            >
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

                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
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
                            className="hover:bg-gray-800"
                        >
                            {processing
                                ? "Processing..."
                                : subdivision
                                ? "Update"
                                : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
