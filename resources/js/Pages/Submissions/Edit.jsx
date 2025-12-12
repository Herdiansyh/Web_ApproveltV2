import React, { useMemo, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Header from "@/Components/Header";
import Swal from "sweetalert2";
import { useLoading } from "@/Components/GlobalLoading";
import { fetchWithCsrf } from "@/utils/csrfToken";
import TableExcel from "./TableExcel";
import DynamicFields from "./DynamicFields";

export default function Edit({ auth, submission, documentFields = [] }) {
    const { showLoading, hideLoading } = useLoading();
    
    // Extract existing table data from submission
    const existingData = submission.data_json || {};
    const existingTableData = existingData.tableData || [];
    const existingTableColumns = existingData.tableColumns || [];
    const existingUseTableData = existingData.useTableData || false;
    
    // Default columns configuration
    const getDefaultColumns = () => {
        // If there are existing table columns, use them
        if (existingTableColumns.length > 0) {
            return existingTableColumns;
        }
        
        // Get default columns from document configuration
        if (submission?.workflow?.document?.default_columns) {
            return submission.workflow.document.default_columns.map(
                (col, index) => ({
                    id: index + 1,
                    name: col.name || `Column ${index + 1}`,
                    key: col.key || `col_${index + 1}`,
                    type: col.type || 'text',
                    required: col.required || false,
                    options: col.options || []
                })
            );
        }
        
        // Fallback to hardcoded defaults
        return [
            { id: 1, name: "Item", key: "item", type: "text", required: false, options: [] },
            { id: 2, name: "Jumlah", key: "jumlah", type: "number", required: true, options: [] },
            { id: 3, name: "Keterangan", key: "keterangan", type: "text", required: false, options: [] },
        ];
    };
    
    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            title: submission.title || "",
            description: submission.description || "",
            file: null,
            data: existingData,
            useTableData: existingUseTableData,
            tableData: existingTableData,
            tableColumns: existingTableColumns.length > 0 ? existingTableColumns : getDefaultColumns(),
        });
    
    // Initialize table states
    const [nextId, setNextId] = useState(() => {
        if (existingTableData.length > 0) {
            return Math.max(...existingTableData.map(r => r.id)) + 1;
        }
        return (existingTableData.length || 0) + 1;
    });
    
    const [nextColumnId, setNextColumnId] = useState(() => {
        if (existingTableColumns.length > 0) {
            return Math.max(...existingTableColumns.map(c => c.id)) + 1;
        }
        return 4;
    });
    
    const [newColumnName, setNewColumnName] = useState("");
    const [editingColumn, setEditingColumn] = useState(null);
    const [isSaved, setIsSaved] = useState(true); // Start as true since data is loaded
    
    // Initialize tableData with default columns if empty
    useEffect(() => {
        if (data.tableData?.length === 0 && data.tableColumns?.length > 0) {
            const initialData = [{ id: 1 }, { id: 2 }, { id: 3 }].map((row) => {
                data.tableColumns.forEach((col) => {
                    row[col.key] = "";
                });
                return row;
            });
            setData("tableData", initialData);
        }
    }, [data.tableColumns]);
    
    // Auto-enable table data if there's existing table data
    useEffect(() => {
        if (existingTableData.length > 0 && !data.useTableData) {
            setData("useTableData", true);
        }
    }, [existingTableData.length]);
    
    // Initialize default columns when checkbox is checked and no existing columns
    useEffect(() => {
        if (data.useTableData && data.tableColumns.length === 0) {
            const defaultCols = getDefaultColumns();
            setData("tableColumns", defaultCols);
        }
    }, [data.useTableData]);
    
    // Table functions
    const addRow = () => {
        const newRow = { id: nextId };
        data.tableColumns.forEach((col) => {
            newRow[col.key] = "";
        });
        setData("tableData", [...data.tableData, newRow]);
        setNextId(nextId + 1);
        setIsSaved(false);
    };
    
    const deleteRow = (id) => {
        if (data.tableData.length > 1) {
            setData("tableData", data.tableData.filter((row) => row.id !== id));
            setIsSaved(false);
        }
    };
    
    const addColumn = () => {
        if (newColumnName.trim()) {
            const newKey = newColumnName.toLowerCase().replace(/\s+/g, "_");
            const newColumn = {
                id: nextColumnId,
                name: newColumnName,
                key: newKey,
                type: "text",
                required: false,
                options: []
            };
            
            setData("tableColumns", [...data.tableColumns, newColumn]);
            
            // Add new column data to existing rows
            const updatedData = data.tableData.map((row) => ({
                ...row,
                [newKey]: "",
            }));
            setData("tableData", updatedData);
            
            setNewColumnName("");
            setNextColumnId(nextColumnId + 1);
            setIsSaved(false);
        }
    };
    
    const deleteColumn = (columnId) => {
        if (data.tableColumns.length > 1) {
            const columnToDelete = data.tableColumns.find(
                (col) => col.id === columnId
            );
            const updatedColumns = data.tableColumns.filter(
                (col) => col.id !== columnId
            );
            
            setData("tableColumns", updatedColumns);
            
            // Remove column data from all rows
            const updatedData = data.tableData.map((row) => {
                const { [columnToDelete.key]: removed, ...rest } = row;
                return rest;
            });
            setData("tableData", updatedData);
            
            setIsSaved(false);
        }
    };
    
    const updateCellData = (rowId, columnKey, value) => {
        setData("tableData", data.tableData.map((row) =>
            row.id === rowId ? { ...row, [columnKey]: value } : row
        ));
        setIsSaved(false);
    };
    
    const updateColumnName = (columnId, newName) => {
        const column = data.tableColumns.find((col) => col.id === columnId);
        const newKey = newName.toLowerCase().replace(/\s+/g, "_");
        const oldKey = column.key;
        
        // Update column name and key
        const updatedColumns = data.tableColumns.map((col) =>
            col.id === columnId ? { ...col, name: newName, key: newKey } : col
        );
        setData("tableColumns", updatedColumns);
        
        // Update all row data with new key
        const updatedData = data.tableData.map((row) => {
            const { [oldKey]: oldValue, ...rest } = row;
            return { ...rest, [newKey]: oldValue };
        });
        setData("tableData", updatedData);
        setEditingColumn(null);
        setIsSaved(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData("file", file);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!data.title || !data.title.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Perhatian",
                text: "Judul wajib diisi.",
            });
            return;
        }
        // Show custom loading animation
        showLoading("Memperbarui pengajuan...");
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', (data.title || "").trim());
        formData.append('description', data.description || '');
        
        if (data.file instanceof File) {
            formData.append('file', data.file);
        }
        
        // Add data object if it exists
        if (data.data || data.tableData || data.tableColumns) {
            
            // Prepare data for submission - merge all data
            const dataToSend = {
                ...data.data,
                useTableData: data.useTableData,
            };
            
            // Only include table data if useTableData is true
            if (data.useTableData) {
                dataToSend.tableData = data.tableData || [];
                dataToSend.tableColumns = data.tableColumns || [];
            } else {
                // Explicitly remove table data when unchecked
                delete dataToSend.tableData;
                delete dataToSend.tableColumns;
            }
            
            formData.append('data', JSON.stringify(dataToSend));
        }
        
        for (let [key, value] of formData.entries()) {
        }
        
        // Get CSRF token and set up headers manually for FormData
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        fetch(route("submissions.update", submission.id), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: formData
        })
        .then(response => {
            
            if (!response.ok) {
                // Handle HTTP errors
                if (response.status === 422) {
                    return response.json().then(data => {
                        const errorMessage = data.message || 'Validation failed';
                        const errors = data.errors || {};
                        const errorText = Object.values(errors).join(', ') || errorMessage;
                        throw new Error(errorText);
                    });
                } else if (response.status === 419) {
                    throw new Error('CSRF token mismatch. Silakan refresh halaman.');
                } else if (response.status === 403) {
                    throw new Error('Anda tidak memiliki izin untuk mengubah pengajuan ini.');
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
            
            return response.json();
        })
        .then(responseData => {
            hideLoading(responseData.success); // Hide loading animation with success status
            if (responseData.success) {
                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengajuan berhasil diperbarui.",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    // Redirect back to show submission
                    window.location.href = route("submissions.show", submission.id);
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal!",
                    text: responseData.message || "Gagal memperbarui pengajuan.",
                    confirmButtonText: "OK",
                });
            }
        })
        .catch(error => {
            console.error("Update error:", error);
            hideLoading(false); // Hide loading animation on error
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error.message || "Terjadi kesalahan jaringan. Silakan coba lagi.",
                confirmButtonText: "OK",
            });
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    Edit Pengajuan
                </h2>
            }
        >
            <Head title="Edit Pengajuan" />
            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="p-5 w-full">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        <Card
                            style={{ borderRadius: "15px" }}
                            className="p-6 mt-6 shadow-md"
                        >
                            <form
                                onSubmit={onSubmit}
                                encType="multipart/form-data"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <Label>Judul Pengajuan</Label>
                                        <Input
                                            name="title"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData("title", e.target.value)
                                            }
                                            placeholder="Masukkan judul pengajuan"
                                            style={{ borderRadius: "10px" }}
                                        />
                                        {errors.title && (
                                            <p className="text-red-600 text-sm">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Deskripsi</Label>
                                        <Textarea
                                            style={{ borderRadius: "10px" }}
                                            name="description"
                                            value={data.description || ""}
                                            onChange={(e) =>
                                                setData(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <p className="text-red-600 text-sm">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Dokumen saat ini</Label>
                                        <div className="mt-2 text-sm">
                                            <a
                                                href={route(
                                                    "submissions.file",
                                                    submission.id
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline"
                                                style={{ borderRadius: "10px" }}
                                            >
                                                Lihat Dokumen Saat Ini
                                            </a>
                                            {submission.file_path && (
                                                <div className="text-muted-foreground mt-1 truncate">
                                                    {submission.file_path
                                                        .split("/")
                                                        .pop()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Ganti Dokumen (opsional)</Label>
                                        <Input
                                            style={{ borderRadius: "10px" }}
                                            name="file"
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {errors.file && (
                                            <p className="text-red-600 text-sm">
                                                {errors.file}
                                            </p>
                                        )}
                                    </div>

                                    {Array.isArray(documentFields) &&
                                        documentFields.length > 0 && (
                                            <div className="border-t pt-4 mt-4">
                                                <h3 className="font-semibold mb-3">
                                                    Data Dokumen
                                                </h3>
                                                <div className="grid  grid-cols-1 md:grid-cols-2 gap-4">
                                                    {documentFields.map((f) => {
                                                        const type = String(
                                                            f.type || "text"
                                                        ).toLowerCase();
                                                        const value =
                                                            data.data?.[
                                                                f.name
                                                            ] ?? "";
                                                        const setVal = (v) => {
                                                            setData("data", {
                                                                ...(data.data ||
                                                                    {}),
                                                                [f.name]: v,
                                                            });
                                                        };

                                                        return (
                                                            <div
                                                                key={
                                                                    f.id ||
                                                                    f.name
                                                                }
                                                            >
                                                                {type === "label" ? (
                                                                    // For label type, only show the label as a separator
                                                                    <div className="col-span-full">
                                                                        <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
                                                                        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mt-2">
                                                                            {f.label}
                                                                        </h4>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <Label>
                                                                            {f.label}
                                                                        </Label>
                                                                        {type ===
                                                                        "textarea" ? (
                                                                    <Textarea
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        value={
                                                                            value
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setVal(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        rows={3}
                                                                        className="mt-1"
                                                                    />
                                                                ) : type ===
                                                                  "date" ? (
                                                                    <Input
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        type="date"
                                                                        value={
                                                                            value
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setVal(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="mt-1"
                                                                    />
                                                                ) : type ===
                                                                  "select" ? (
                                                                    <select
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        className="w-full border rounded px-2 py-1 mt-1"
                                                                        value={
                                                                            value ??
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setVal(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option
                                                                            value=""
                                                                            disabled
                                                                        >
                                                                            Pilih{" "}
                                                                            {
                                                                                f.label
                                                                            }
                                                                        </option>
                                                                        {(Array.isArray(
                                                                            f.options
                                                                        )
                                                                            ? f.options
                                                                            : []
                                                                        ).map(
                                                                            (
                                                                                opt,
                                                                                idx
                                                                            ) => {
                                                                                if (
                                                                                    opt &&
                                                                                    typeof opt ===
                                                                                        "object"
                                                                                ) {
                                                                                    const val =
                                                                                        String(
                                                                                            opt.value ??
                                                                                                opt.id ??
                                                                                                ""
                                                                                        );
                                                                                    const label =
                                                                                        opt.label ??
                                                                                        String(
                                                                                            opt.name ??
                                                                                                val
                                                                                        );
                                                                                    return (
                                                                                        <option
                                                                                            key={
                                                                                                val ||
                                                                                                idx
                                                                                            }
                                                                                            value={
                                                                                                val
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                label
                                                                                            }
                                                                                        </option>
                                                                                    );
                                                                                }
                                                                                const val =
                                                                                    String(
                                                                                        opt ??
                                                                                            ""
                                                                                    );
                                                                                return (
                                                                                    <option
                                                                                        key={
                                                                                            val ||
                                                                                            idx
                                                                                        }
                                                                                        value={
                                                                                            val
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            val
                                                                                        }
                                                                                    </option>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </select>
                                                                ) : type ===
                                                                  "number" ? (
                                                                    <Input
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        type="number"
                                                                        value={
                                                                            value
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setVal(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="mt-1"
                                                                    />
                                                                ) : type ===
                                                                  "file" ? (
                                                                    <Input
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        type="file"
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            const file =
                                                                                e
                                                                                    .target
                                                                                    .files &&
                                                                                e
                                                                                    .target
                                                                                    .files[0];
                                                                            setVal(
                                                                                file
                                                                                    ? file.name
                                                                                    : ""
                                                                            );
                                                                        }}
                                                                        className="mt-1"
                                                                    />
                                                                ) : (
                                                                    <Input
                                                                        style={{
                                                                            borderRadius:
                                                                                "10px",
                                                                        }}
                                                                        value={
                                                                            value
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setVal(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="mt-1"
                                                                    />
                                                                )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    {/* Dynamic Table Component */}
                                    <TableExcel
                                        data={data}
                                        setData={setData}
                                        setIsSaved={setIsSaved}
                                        newColumnName={newColumnName}
                                        setNewColumnName={setNewColumnName}
                                        addColumn={addColumn}
                                        editingColumn={editingColumn}
                                        setEditingColumn={setEditingColumn}
                                        updateColumnName={updateColumnName}
                                        deleteColumn={deleteColumn}
                                        addRow={addRow}
                                        deleteRow={deleteRow}
                                        updateCellData={updateCellData}
                                        existingTableData={existingTableData}
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            style={{ borderRadius: "15px" }}
                                            onClick={() =>
                                                (window.location.href =
                                                    route("submissions.show", submission.id))
                                            }
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-primary text-primary-foreground"
                                            style={{ borderRadius: "15px" }}
                                        >
                                            {processing
                                                ? "Menyimpan..."
                                                : submission.original_submission_id && submission.original_submission_id !== null
                                                    ? "Kirim Ulang" 
                                                    : "Simpan Perubahan"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
