import React, { useMemo, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Swal from "sweetalert2";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import Header from "@/Components/Header";
import TableExcel from "./TableExcel";
import DynamicFields from "./DynamicFields";
import { useLoading } from "@/Components/GlobalLoading";

export default function Create({ auth, userDivision, workflows }) {
    const { showLoading, hideLoading } = useLoading();
    const { data, setData, processing, errors, setError } = useForm({
        workflow_id: "",
        title: "",
        description: "",
        file: null,
        data: {},
        useTableData: false,
        tableData: [
            { id: 1, item: "", jumlah: "", keterangan: "" },
            { id: 2, item: "", jumlah: "", keterangan: "" },
            { id: 3, item: "", jumlah: "", keterangan: "" },
        ],
        tableColumns: [
            { id: 1, name: "Item", key: "item" },
            { id: 2, name: "Jumlah", key: "jumlah" },
            { id: 3, name: "Keterangan", key: "keterangan" },
        ],
    });

    // Use form data instead of local state for table
    const [nextId, setNextId] = useState(4);
    const [nextColumnId, setNextColumnId] = useState(4);
    const [newColumnName, setNewColumnName] = useState("");
    const [editingColumn, setEditingColumn] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    // Fungsi untuk menyimpan data ke localStorage
    const handleSaveLocal = () => {
        try {
            // Include table data in saved data
            const dataToSave = {
                ...data,
                tableData: data.tableData,
                tableColumns: data.tableColumns,
            };
            localStorage.setItem("createFormData", JSON.stringify(dataToSave));
            setIsSaved(true);
            Swal.fire({
                icon: "success",
                title: "Tersimpan!",
                text: "Data berhasil disimpan secara lokal.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Gagal Menyimpan",
                text: "Terjadi kesalahan saat menyimpan data lokal.",
            });
        }
    };

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
            setData(
                "tableData",
                data.tableData.filter((row) => row.id !== id)
            );
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
        setData(
            "tableData",
            data.tableData.map((row) =>
                row.id === rowId ? { ...row, [columnKey]: value } : row
            )
        );
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

    const selectedWorkflow = useMemo(
        () =>
            workflows.find((w) => String(w.id) === String(data.workflow_id)) ||
            null,
        [workflows, data.workflow_id]
    );

    const availableWorkflows = useMemo(() => {
        return (workflows || []).filter(
            (w) => w?.is_active && w?.document && w.document?.is_active
        );
    }, [workflows]);

    useEffect(() => {
        if (
            data.workflow_id &&
            !availableWorkflows.some(
                (w) => String(w.id) === String(data.workflow_id)
            )
        ) {
            setData("workflow_id", "");
        }
    }, [availableWorkflows]);

    // Pattern series dari Document Type (Name Series)
    const selectedSeriesPattern = useMemo(() => {
        const doc = selectedWorkflow?.document;
        if (!doc) return "";

        // Inertia biasanya mengirim relasi hasOne sebagai name_series
        const ns = doc.name_series || doc.nameSeries || null;
        if (!ns) return "";

        const pattern = ns.series_pattern || "yyyy-mm-####";
        const prefix = ns.prefix || "";
        return `${prefix}${pattern}`;
    }, [selectedWorkflow]);

    const documentFields = useMemo(() => {
        const f = selectedWorkflow?.document?.fields || [];
        return Array.isArray(f) ? f : [];
    }, [selectedWorkflow]);

    const activeFields = useMemo(() => {
        return documentFields;
    }, [documentFields]);

    // 🔹 Load data dari localStorage ketika halaman dibuka
    useEffect(() => {
        const savedData = localStorage.getItem("createFormData");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setData(parsed);

                // Load table data if exists
                if (parsed.tableData) {
                    setNextId(
                        Math.max(...parsed.tableData.map((r) => r.id)) + 1
                    );
                }
                if (parsed.tableColumns) {
                    setNextColumnId(
                        Math.max(...parsed.tableColumns.map((c) => c.id)) + 1
                    );
                }

                setIsSaved(true);
            } catch (e) {
                console.error("Gagal memuat data dari localStorage:", e);
            }
        }
    }, []);

    // 🔹 Simpan ke localStorage
    useEffect(() => {
        // Auto-save functionality disabled for now
        // Can be re-enabled later if needed
    }, [data]);

    // 🔹 Auto-calc lama_cuti
    useEffect(() => {
        if (!activeFields || activeFields.length === 0) return;
        const fieldNames = activeFields.map((f) => String(f.name));
        if (
            fieldNames.includes("tanggal_mulai") &&
            fieldNames.includes("tanggal_selesai")
        ) {
            const start = data?.data?.tanggal_mulai;
            const end = data?.data?.tanggal_selesai;
            if (start && end) {
                try {
                    const d1 = new Date(start);
                    const d2 = new Date(end);
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        const diffMs =
                            d2.setHours(12, 0, 0, 0) - d1.setHours(12, 0, 0, 0);
                        const days =
                            Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
                        if (days > 0) {
                            setData("data", {
                                ...(data.data || {}),
                                lama_cuti: String(days),
                            });
                        }
                    }
                } catch (_) {}
            }
        }
    }, [data?.data?.tanggal_mulai, data?.data?.tanggal_selesai, activeFields]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: "warning",
                title: "File terlalu besar",
                text: "Ukuran maksimal file adalah 10MB.",
            });
            return;
        }
        setData("file", file);
        setIsSaved(false);
    };

    const submit = (e) => {
        if (e) e.preventDefault();

        if (!data.workflow_id) {
            Swal.fire({
                icon: "warning",
                title: "Validation Error",
                text: "Document Type wajib dipilih sebelum mengirim pengajuan.",
            });
            return;
        }

        if (!data.title || data.title.trim() === "") {
            Swal.fire({
                icon: "warning",
                title: "Validation Error",
                text: "Judul wajib diisi sebelum mengirim pengajuan.",
            });
            return;
        }

        // Validate required dynamic fields
        const requiredFields = documentFields.filter(
            (field) => field.required && field.type !== "label"
        );
        const missingFields = [];

        for (const field of requiredFields) {
            const value = data.data?.[field.name];
            if (!value || (typeof value === "string" && value.trim() === "")) {
                missingFields.push(field.label);
            }
        }

        if (missingFields.length > 0) {
            Swal.fire({
                icon: "warning",
                title: "Validation Error",
                text: `Field berikut wajib diisi: ${missingFields.join(", ")}`,
            });
            return;
        }

        // Include table data in form submission only if useTableData is true
        let tableDataFiltered = [];
        if (data.useTableData && data.tableData && data.tableData.length > 0) {
            tableDataFiltered = data.tableData.map((row) => {
                // Convert all values to strings to ensure proper serialization
                const cleanedRow = {};
                Object.keys(row).forEach((key) => {
                    if (key === "id") {
                        cleanedRow[key] = row[key];
                    } else {
                        cleanedRow[key] = String(row[key] || "");
                    }
                });
                return cleanedRow;
            });
        }

        Swal.fire({
            title: "Kirim Pengajuan?",
            text: "Pastikan data sudah benar sebelum dikirim.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Kirim",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                // Test data dengan table information
                const testData = {
                    workflow_id: data.workflow_id,
                    title: data.title,
                    description: data.description,
                    file: data.file,
                    data: data.data,
                };

                // Add table data only if useTableData is true and data exists
                if (
                    data.useTableData &&
                    tableDataFiltered &&
                    tableDataFiltered.length > 0
                ) {
                    testData.tableData = tableDataFiltered;
                }
                if (
                    data.useTableData &&
                    data.tableColumns &&
                    data.tableColumns.length > 0
                ) {
                    testData.tableColumns = data.tableColumns;
                }

                try {
                    // Show custom loading animation
                    showLoading("Mengirim pengajuan...");

                    // Manual fetch request
                    const csrfToken = document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content");
                    if (!csrfToken) {
                        console.error("Create.jsx - CSRF token not found!");
                        hideLoading(false); // Hide loading animation on CSRF error
                        Swal.fire({
                            icon: "error",
                            title: "Error!",
                            text: "CSRF token tidak ditemukan. Silakan refresh halaman.",
                            confirmButtonText: "OK",
                        });
                        return;
                    }

                    fetch(route("submissions.store"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                        body: JSON.stringify(testData),
                    })
                        .then((response) => {
                            if (!response.ok) {
                                // Handle HTTP errors
                                if (response.status === 422) {
                                    return response.json().then((data) => {
                                        // Set validation errors from server
                                        if (data.errors) {
                                            // Use Inertia's setError to display field errors
                                            Object.keys(data.errors).forEach(
                                                (key) => {
                                                    setError(
                                                        key,
                                                        data.errors[key][0] ||
                                                            data.errors[key]
                                                    );
                                                }
                                            );
                                        }
                                        throw new Error(
                                            data.message || "Validation failed"
                                        );
                                    });
                                } else if (response.status === 419) {
                                    throw new Error(
                                        "CSRF token mismatch. Silakan refresh halaman."
                                    );
                                } else {
                                    throw new Error(
                                        `Server error: ${response.status}`
                                    );
                                }
                            }

                            return response.json();
                        })
                        .then((data) => {
                            hideLoading(data.success); // Hide loading animation with success status
                            if (data.success) {
                                // Success alert
                                Swal.fire({
                                    icon: "success",
                                    title: "Berhasil!",
                                    text: "Pengajuan berhasil dikirim.",
                                    timer: 2000,
                                    showConfirmButton: false,
                                }).then(() => {
                                    // Redirect ke fordivision menggunakan URL dari response
                                    const redirectUrl =
                                        data.redirect_url ||
                                        route("submissions.forDivision");
                                    window.location.href = redirectUrl;
                                });
                            } else {
                                // Error alert - check if it's a validation error
                                if (
                                    data.errors &&
                                    Object.keys(data.errors).length > 0
                                ) {
                                    // Validation errors are already set on fields, show general message
                                    Swal.fire({
                                        icon: "warning",
                                        title: "Validation Error",
                                        text:
                                            data.message ||
                                            "Mohon periksa kembali field yang wajib diisi.",
                                        confirmButtonText: "OK",
                                    });
                                } else {
                                    // General error
                                    Swal.fire({
                                        icon: "error",
                                        title: "Gagal!",
                                        text:
                                            data.message ||
                                            "Terjadi kesalahan saat mengirim pengajuan.",
                                        confirmButtonText: "OK",
                                    });
                                }
                            }
                        })
                        .catch((error) => {
                            console.error("Create.jsx - fetch error:", error);
                            hideLoading(false); // Hide loading animation on error
                            Swal.fire({
                                icon: "error",
                                title: "Error!",
                                text: "Terjadi kesalahan jaringan. Silakan coba lagi.",
                                confirmButtonText: "OK",
                            });
                        });
                } catch (error) {
                    console.error(
                        "Create.jsx - error during manual post:",
                        error
                    );
                    hideLoading(false); // Hide loading animation on exception
                    alert(
                        "Terjadi kesalahan saat mengirim pengajuan: " +
                            error.message
                    );
                }
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    📁 Create Submission
                </h2>
            }
        >
            <Head title="Buat Pengajuan" />
            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="p-5 w-full">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="md:text-2xl ml-2 text-sm mt-5 font-semibold text-gray-800">
                                New Pengajuan
                            </h1>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`md:text-sm text-xs font-medium ${
                                        isSaved
                                            ? "text-green-600"
                                            : "text-orange-600"
                                    }`}
                                >
                                    • {isSaved ? "Saved" : "Not Saved"}
                                </span>
                                <Button
                                    type="button"
                                    onClick={handleSaveLocal}
                                    disabled={processing}
                                    style={{ borderRadius: "10px" }}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs text-white p-2"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>

                        <Card
                            className="p-8 shadow-sm "
                            style={{ borderRadius: "15px" }}
                        >
                            <form
                                onSubmit={submit}
                                encType="multipart/form-data"
                            >
                                <div className="space-y-6">
                                    {/* Grid 2 kolom utama */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Kiri */}
                                        <div className="space-y-6">
                                            <div
                                                style={{ borderRadius: "15px" }}
                                            >
                                                <Label>Series</Label>
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    value={
                                                        selectedSeriesPattern ||
                                                        "yyyy-mm-####"
                                                    }
                                                    disabled
                                                    className="mt-1 bg-gray-50"
                                                />
                                            </div>

                                            <div>
                                                <Label>Employee Name</Label>
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    value={
                                                        auth.user?.name || ""
                                                    }
                                                    disabled
                                                    className="mt-1 bg-gray-50"
                                                />
                                            </div>

                                            <div>
                                                <Label>Department</Label>
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    value={
                                                        userDivision?.name ||
                                                        "-"
                                                    }
                                                    disabled
                                                    className="mt-1 bg-gray-50"
                                                />
                                            </div>
                                        </div>

                                        {/* Kanan */}
                                        <div className="space-y-6">
                                            <div>
                                                <Label>Posting Date</Label>
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    type="date"
                                                    value={
                                                        new Date()
                                                            .toISOString()
                                                            .split("T")[0]
                                                    }
                                                    disabled
                                                    className="mt-1 bg-gray-50"
                                                />
                                            </div>

                                            <div>
                                                <Label>
                                                    Document Type{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={data.workflow_id}
                                                    onValueChange={(value) => {
                                                        setData(
                                                            "workflow_id",
                                                            value
                                                        );
                                                        setIsSaved(false);
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        style={{
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                        className={`w-full mt-1 ${
                                                            !data.workflow_id &&
                                                            errors.workflow_id
                                                                ? "border-red-500"
                                                                : ""
                                                        }`}
                                                    >
                                                        <SelectValue placeholder="-- Pilih Jenis --" />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        style={{
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                    >
                                                        {availableWorkflows?.length >
                                                        0 ? (
                                                            availableWorkflows.map(
                                                                (wf) =>
                                                                    wf.id && (
                                                                        <SelectItem
                                                                            key={
                                                                                wf.id
                                                                            }
                                                                            value={String(
                                                                                wf.id
                                                                            )}
                                                                        >
                                                                            {
                                                                                wf.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                            )
                                                        ) : (
                                                            <SelectItem
                                                                disabled
                                                                value="wd"
                                                            >
                                                                Tidak ada
                                                                workflow yang
                                                                tersedia. Minta
                                                                admin
                                                                mengaktifkan
                                                                Document
                                                                Type/Workflow.
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {errors.workflow_id && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors.workflow_id}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Judul *</Label>
                                                <Textarea
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    value={data.title}
                                                    onChange={(e) => {
                                                        setData(
                                                            "title",
                                                            e.target.value
                                                        );
                                                        setIsSaved(false);
                                                    }}
                                                    rows={2}
                                                    className="mt-1"
                                                    placeholder="Masukan judul pengajuan..."
                                                />
                                            </div>

                                            <div>
                                                <Label>
                                                    Deskripsi Pengajuan (Opsional)
                                                </Label>
                                                <Textarea
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    value={data.description}
                                                    onChange={(e) => {
                                                        setData(
                                                            "description",
                                                            e.target.value
                                                        );
                                                        setIsSaved(false);
                                                    }}
                                                    rows={4}
                                                    className="mt-1"
                                                    placeholder="Masukan deskripsi..."
                                                />
                                            </div>

                                            <div>
                                                <Label>Dokumen Pendukung</Label>
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="mt-1"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Opsional. Format: PDF, JPG,
                                                    PNG (maks. 10MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    {activeFields?.length > 0 && (
                                        <DynamicFields
                                            activeFields={activeFields}
                                            data={data}
                                            setData={setData}
                                            errors={errors}
                                            setIsSaved={setIsSaved}
                                        />
                                    )}
                                    {/* Dynamic Excel-like Table */}
                                    <TableExcel
                                        data={data}
                                        setData={setData}
                                        setIsSaved={setIsSaved}
                                        newColumnName={newColumnName}
                                        setNewColumnName={setNewColumnName}
                                        addColumn={addColumn}
                                        editingColumn={editingColumn}
                                        setEditingColumn={setEditingColumn}
                                        updateCellData={updateCellData}
                                        updateColumnName={updateColumnName}
                                        deleteColumn={deleteColumn}
                                        addRow={addRow}
                                        deleteRow={deleteRow}
                                    />

                                    {/* Submit */}
                                    <div className="flex items-center justify-end gap-4 mt-4">
                                        <Button
                                            style={{
                                                borderRadius: "10px",
                                            }}
                                            type="submit"
                                            disabled={processing}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                        >
                                            {processing
                                                ? "Mengirim..."
                                                : "Kirim Pengajuan"}
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
