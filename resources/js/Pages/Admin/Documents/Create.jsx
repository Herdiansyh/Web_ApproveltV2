import React, { useEffect, useState } from "react";
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
        enable_data_tables: false,
        default_columns: [
            {
                name: "No",
                key: "no",
                type: "text",
                required: false,
                options: [],
            },
            {
                name: "Title",
                key: "title",
                type: "text",
                required: true,
                options: [],
            },
            {
                name: "Description",
                key: "description",
                type: "text",
                required: false,
                options: [],
            },
        ],
    });

    // Initialize form data when editing document
    useEffect(() => {
        if (document) {
            setData({
                name: document.name || "",
                description: document.description || "",
                is_active: document.is_active ?? true,
                enable_data_tables: document.enable_data_tables ?? false,
                default_columns: document.default_columns || [
                    {
                        name: "No",
                        key: "no",
                        type: "text",
                        required: false,
                        options: [],
                    },
                    {
                        name: "Title",
                        key: "title",
                        type: "text",
                        required: true,
                        options: [],
                    },
                    {
                        name: "Description",
                        key: "description",
                        type: "text",
                        required: false,
                        options: [],
                    },
                ],
            });
        } else {
            reset();
        }
    }, [document]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const action = document ? "PUT" : "POST";
        const url = document ? `/documents/${document.id}` : "/documents";

        const submitData = {
            ...data,
            default_columns: data.default_columns,
        };

        if (document) {
            put(url, submitData, {
                onSuccess: () => {
                    onClose();
                },
                onError: (errors) => {
                    // Handle errors silently
                },
            });
        } else {
            post(url, submitData, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
                onError: (errors) => {
                    // Handle errors silently
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {document ? "Edit Document Type" : "Create New Document Type"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Document Name */}
                    <div>
                        <Label htmlFor="name">Document Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) =>
                                setData("name", e.target.value)
                            }
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Document Description */}
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

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData("is_active", e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>

                    {/* Enable Data Tables Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="enable_data_tables"
                            checked={data.enable_data_tables}
                            onChange={(e) => setData("enable_data_tables", e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="enable_data_tables" className="text-sm font-medium text-gray-700">
                            Enable Data Tables (Wajib isi saat pengajuan)
                        </label>
                    </div>

                    {/* Default Columns */}
                    <div>
                        <DefaultColumnsManager
                            defaultColumns={data.default_columns || []}
                            onChange={(columns) =>
                                setData("default_columns", columns)
                            }
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? "Processing..."
                                : document
                                ? "Update Document Type"
                                : "Create Document Type"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
