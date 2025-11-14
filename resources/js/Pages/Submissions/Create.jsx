import React, { useMemo, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
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

export default function Create({
    auth,
    userDivision,
    workflows,
    templates = [],
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        workflow_id: "",
        title: "",
        description: "",
        file: null,
        template_id: "",
        data: {},
    });

    const [isSaved, setIsSaved] = useState(false);

    const selectedTemplate = useMemo(
        () => templates.find((t) => String(t.id) === String(data.template_id)),
        [templates, data.template_id]
    );

    const selectedWorkflow = useMemo(
        () =>
            workflows.find((w) => String(w.id) === String(data.workflow_id)) ||
            null,
        [workflows, data.workflow_id]
    );

    const documentFields = useMemo(() => {
        const f = selectedWorkflow?.document?.fields || [];
        return Array.isArray(f) ? f : [];
    }, [selectedWorkflow]);

    const activeFields = useMemo(() => {
        if (documentFields.length > 0) return documentFields;
        const f = selectedTemplate?.fields || [];
        return Array.isArray(f) ? f : [];
    }, [documentFields, selectedTemplate]);

    // 🔹 Load data dari localStorage ketika halaman dibuka
    useEffect(() => {
        const savedData = localStorage.getItem("createFormData");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setData(parsed);
                setIsSaved(true);
            } catch (e) {
                console.error("Gagal memuat data dari localStorage:", e);
            }
        }
    }, []);

    // 🔹 Simpan ke localStorage
    const handleSaveLocal = () => {
        try {
            localStorage.setItem("createFormData", JSON.stringify(data));
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
                title: "Pilih workflow terlebih dahulu",
            });
            return;
        }

        if (!data.file) {
            Swal.fire({
                icon: "warning",
                title: "File wajib diunggah",
            });
            return;
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
                post(route("submissions.store"), {
                    forceFormData: true,
                    onSuccess: () => {
                        reset();
                        localStorage.removeItem("createFormData");
                        setIsSaved(false);
                        Swal.fire({
                            icon: "success",
                            title: "Berhasil!",
                            text: "Pengajuan berhasil dikirim.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Buat Pengajuan" />
            <div className="flex min-h-screen bg-background">
                <Header />
                <div className="p-5 w-full">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold text-gray-800">
                                New Pengajuan
                            </h1>
                            <div className="flex items-center gap-4">
                                <span
                                    className={`text-sm font-medium ${
                                        isSaved
                                            ? "text-green-600"
                                            : "text-orange-600"
                                    }`}
                                >
                                    • {isSaved ? "Saved" : "Not Saved"}
                                </span>
                                <Button
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
                                    <div className="grid grid-cols-2 gap-6">
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
                                                    value="SUB-.YYYY.-.MM.-."
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
                                                <Label>Document Type *</Label>
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
                                                        className="w-full mt-1"
                                                    >
                                                        <SelectValue placeholder="-- Pilih Jenis --" />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        style={{
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                    >
                                                        {workflows?.length >
                                                        0 ? (
                                                            workflows.map(
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
                                                                                wf
                                                                                    .document
                                                                                    ?.name
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
                                                                dokumen
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Deskripsi</Label>
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
                                                    Format: PDF, JPG, PNG (maks.
                                                    10MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    {activeFields?.length > 0 && (
                                        <div
                                            className="border-t pt-6 mt-6"
                                            style={{
                                                borderRadius: "10px",
                                            }}
                                        >
                                            <h3 className="text-lg font-semibold mb-4">
                                                Informasi Tambahan
                                            </h3>
                                            <div className="grid grid-cols-2 gap-6">
                                                {activeFields.map((f) => {
                                                    const type = String(
                                                        f.type || "text"
                                                    ).toLowerCase();
                                                    const value =
                                                        data.data?.[f.name] ??
                                                        "";
                                                    const setVal = (v) => {
                                                        setData("data", {
                                                            ...(data.data ||
                                                                {}),
                                                            [f.name]: v,
                                                        });
                                                        setIsSaved(false);
                                                    };

                                                    return (
                                                        <div
                                                            key={f.id || f.name}
                                                        >
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
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

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
