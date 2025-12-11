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
import DefaultColumnsManager from "@/Components/DefaultColumnsManager";

export default function Create({ isOpen, onClose, document }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
        is_active: true,
        default_columns: [
            { 
                name: "Item", 
                key: "item", 
                type: "text", 
                required: false, 
                options: [] 
            },
            { 
                name: "Jumlah", 
                key: "jumlah", 
                type: "number", 
                required: true, 
                options: [] 
            },
            { 
                name: "Keterangan", 
                key: "keterangan", 
                type: "text", 
                required: false, 
                options: [] 
            },
        ],
    });

    useEffect(() => {
        if (document) {
            // Handle backward compatibility for old format
            const defaultColumns = document.default_columns || [];
            const enhancedColumns = defaultColumns.map(col => ({
                name: col.name || '',
                key: col.key || '',
                type: col.type || 'text',
                required: col.required || false,
                options: col.options || []
            }));

            setData({
                name: document.name,
                description: document.description || "",
                is_active: typeof document.is_active === "boolean" ? document.is_active : true,
                default_columns: enhancedColumns.length > 0 ? enhancedColumns : [
                    { 
                        name: "Item", 
                        key: "item", 
                        type: "text", 
                        required: false, 
                        options: [] 
                    },
                    { 
                        name: "Jumlah", 
                        key: "jumlah", 
                        type: "number", 
                        required: true, 
                        options: [] 
                    },
                    { 
                        name: "Keterangan", 
                        key: "keterangan", 
                        type: "text", 
                        required: false, 
                        options: [] 
                    },
                ],
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
                onError: (errors) => {
                    // Handle validation errors from backend
                    let errorMessage = "Terjadi kesalahan saat memperbarui dokumen.";
                    
                    if (errors.prefix) {
                        errorMessage = errors.prefix;
                    } else if (errors.name) {
                        errorMessage = errors.name;
                    } else if (errors.description) {
                        errorMessage = errors.description;
                    }
                    
                    Swal.fire("Error", errorMessage, "error");
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
                onError: (errors) => {
                    // Handle validation errors from backend
                    let errorMessage = "Terjadi kesalahan saat membuat dokumen.";
                    
                    if (errors.prefix) {
                        errorMessage = errors.prefix;
                    } else if (errors.name) {
                        errorMessage = errors.name;
                    } else if (errors.description) {
                        errorMessage = errors.description;
                    }
                    
                    Swal.fire("Error", errorMessage, "error");
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {document ? "Edit Document" : "Create New Document"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={!!data.is_active}
                            onChange={(e) => setData("is_active", e.target.checked)}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>

                    <DefaultColumnsManager
                        defaultColumns={data.default_columns || []}
                        onChange={(columns) => setData("default_columns", columns)}
                    />

                    <DialogFooter className="flex justify-end gap-2">
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
