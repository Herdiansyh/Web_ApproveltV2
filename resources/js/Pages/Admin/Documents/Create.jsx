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

export default function Create({ isOpen, onClose, document, divisions }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
        division_id: "",
    });

    useEffect(() => {
        if (document) {
            setData({
                name: document.name,
                description: document.description || "",
                division_id: document.division_id || "",
            });
        } else {
            reset();
        }
    }, [document]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (document) {
            put(route("documents.update", document.id), {
                onSuccess: () => {
                    Swal.fire({
                        icon: "success",
                        title: "Document updated",
                        text: "The document has been successfully updated!",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    reset();
                    onClose();
                },
            });
        } else {
            post(route("documents.store"), {
                onSuccess: () => {
                    Swal.fire({
                        icon: "success",
                        title: "Document created",
                        text: "A new document has been successfully created!",
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {document ? "Edit Document" : "Create New Document"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="name">Document Name</Label>
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

                    <div>
                        <Label htmlFor="division">Division</Label>
                        <select
                            id="division"
                            className="w-full border rounded-md p-2"
                            value={data.division_id}
                            onChange={(e) =>
                                setData("division_id", e.target.value)
                            }
                        >
                            <option value="">Select Division</option>
                            {divisions.map((div) => (
                                <option key={div.id} value={div.id}>
                                    {div.name}
                                </option>
                            ))}
                        </select>
                        {errors.division_id && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.division_id}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="flex justify-end space-x-2">
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
                            {document ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
