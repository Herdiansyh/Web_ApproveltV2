import React, { useMemo, useEffect } from "react";
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
        // optional template payload
        template_id: "",
        data: {},
    });

    const selectedTemplate = useMemo(
        () => templates.find((t) => String(t.id) === String(data.template_id)),
        [templates, data.template_id]
    );

    const selectedWorkflow = useMemo(
        () => workflows.find((w) => String(w.id) === String(data.workflow_id)) || null,
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

    // Init data when workflow changes (Document Fields)
    useEffect(() => {
        if (documentFields.length > 0) {
            const initial = Object.fromEntries(documentFields.map((f) => [f.name, ""]));
            setData("data", initial);
            if (!data.title && selectedWorkflow?.document?.name) setData("title", selectedWorkflow.document.name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWorkflow]);

    // Auto-calc lama_cuti jika field tersedia dan tanggal valid (berlaku untuk activeFields)
    useEffect(() => {
        if (!activeFields || activeFields.length === 0) return;
        const fieldNames = activeFields.map((f) => String(f.name));
        if (fieldNames.includes("tanggal_mulai") && fieldNames.includes("tanggal_selesai")) {
            const start = data?.data?.tanggal_mulai;
            const end = data?.data?.tanggal_selesai;
            if (start && end) {
                try {
                    const d1 = new Date(start);
                    const d2 = new Date(end);
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        const diffMs = d2.setHours(12,0,0,0) - d1.setHours(12,0,0,0);
                        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inklusif
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.data?.tanggal_mulai, data?.data?.tanggal_selesai, activeFields]);

    const handlePreviewTemplate = (e) => {
        e.preventDefault();
        if (!data.template_id) return;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("submissions.previewTemplate");
        form.target = "_blank";
        const csrf = document.head.querySelector(
            'meta[name="csrf-token"]'
        )?.content;
        if (csrf) {
            const t = document.createElement("input");
            t.type = "hidden";
            t.name = "_token";
            t.value = csrf;
            form.appendChild(t);
        }
        const fields = {
            template_id: data.template_id,
            title: data.title || "",
            description: data.description || "",
        };
        Object.entries(fields).forEach(([k, v]) => {
            const inp = document.createElement("input");
            inp.type = "hidden";
            inp.name = k;
            inp.value = v;
            form.appendChild(inp);
        });
        // Append data[field] values
        if (selectedTemplate && selectedTemplate.fields?.length) {
            selectedTemplate.fields.forEach((f) => {
                const name = `data[${f.name}]`;
                const inp = document.createElement("input");
                inp.type = "hidden";
                inp.name = name;
                inp.value = data.data?.[f.name] ?? "";
                form.appendChild(inp);
            });
        }
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

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
    };

    const submit = (e) => {
        e.preventDefault();

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
                        Swal.fire({
                            icon: "success",
                            title: "Berhasil!",
                            text: "Pengajuan berhasil dikirim.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                    onError: (err) => {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal",
                            text:
                                err?.workflow || err?.template_id || err?.data
                                    ? err.workflow ||
                                      err.template_id ||
                                      "Periksa field template yang wajib diisi"
                                    : "Terjadi kesalahan saat mengirim pengajuan.",
                        });
                    },
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800">
                    Buat Pengajuan Baru
                </h2>
            }
        >
            <Head title="Buat Pengajuan" />
            <div className="flex min-h-screen bg-background ">
                <Header />
                <div className="p-5 w-full">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        <Card className="p-6 shadow-md">
                            <form
                                onSubmit={submit}
                                encType="multipart/form-data"
                            >
                                <div className="space-y-6">
                                    {/* Buat dari Template Dokumen (opsional). Disembunyikan jika Document Fields tersedia */}
                                    {documentFields.length === 0 && (
                                        <div>
                                            <Label>
                                                Template Dokumen (Opsional)
                                            </Label>
                                            <Select
                                                value={data.template_id}
                                                onValueChange={(value) => {
                                                    setData("template_id", value);
                                                    const tpl = templates.find((t) => String(t.id) === String(value));
                                                    const initial = Object.fromEntries((tpl?.fields || []).map((f) => [f.name, ""]));
                                                    setData("data", initial);
                                                    if (!data.title && tpl?.name) setData("title", tpl.name);
                                                }}
                                            >
                                                <SelectTrigger className="w-full mt-1">
                                                    <SelectValue placeholder="-- Pilih Template --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates?.length > 0 ? (
                                                        templates.map((tpl) => (
                                                            <SelectItem key={tpl.id} value={String(tpl.id)}>
                                                                {tpl.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem disabled value="nt">
                                                            Belum ada template aktif
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.template_id && (
                                                <p className="text-red-600 text-sm mt-1">{errors.template_id}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Dynamic Fields dari Document Type jika ada, jika tidak fallback ke Template */}
                                    {activeFields?.length > 0 && (
                                        <div className="space-y-4">
                                            {activeFields.map((f) => {
                                                const type = String(f.type || "text").toLowerCase();
                                                const value = data.data?.[f.name] ?? "";
                                                const setVal = (v) =>
                                                    setData("data", {
                                                        ...(data.data || {}),
                                                        [f.name]: v,
                                                    });
                                                // Get options for select: prefer field.options
                                                const options = f.options || selectedTemplate?.config_json?.fields?.[f.name]?.options || [];
                                                return (
                                                    <div key={f.id || f.name}>
                                                        <Label>
                                                            {f.label} ({f.type}) {f.required ? "*" : ""}
                                                        </Label>
                                                        {type === "textarea" && (
                                                            <Textarea value={value} onChange={(e) => setVal(e.target.value)} rows={3} />
                                                        )}
                                                        {type === "select" && (
                                                            <Select value={String(value)} onValueChange={(v) => setVal(v)}>
                                                                <SelectTrigger className="w-full mt-1">
                                                                    <SelectValue placeholder="-- Pilih --" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {(options || []).map((opt) => (
                                                                        <SelectItem key={String(opt)} value={String(opt)}>
                                                                            {String(opt)}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        {type === "date" && (
                                                            <Input type="date" value={value} onChange={(e) => setVal(e.target.value)} />
                                                        )}
                                                        {type === "number" && (
                                                            <Input type="number" value={value} onChange={(e) => setVal(e.target.value)} />
                                                        )}
                                                        {!(type === "textarea" || type === "select" || type === "date" || type === "number") && (
                                                            <Input value={value} onChange={(e) => setVal(e.target.value)} />
                                                        )}
                                                        {errors?.[`data.${f.name}`] && (
                                                            <p className="text-red-600 text-sm mt-1">{errors[`data.${f.name}`]}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pilih Workflow */}
                                    <div>
                                        <Label>Document Type</Label>
                                        <Select
                                            value={data.workflow_id}
                                            onValueChange={(value) =>
                                                setData("workflow_id", value)
                                            }
                                        >
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="-- Choose DocType --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workflows?.length > 0 ? (
                                                    workflows.map((wf) =>
                                                        wf.id ? (
                                                            <SelectItem
                                                                key={wf.id}
                                                                value={String(
                                                                    wf.id
                                                                )}
                                                            >
                                                                {
                                                                    wf.document
                                                                        ?.name
                                                                }
                                                            </SelectItem>
                                                        ) : null
                                                    )
                                                ) : (
                                                    <SelectItem
                                                        disabled
                                                        value="wd"
                                                    >
                                                        No documents available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.workflow_id && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors.workflow_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Judul Pengajuan */}
                                    <div>
                                        <Label>Judul Pengajuan</Label>
                                        <Input
                                            value={data.title}
                                            onChange={(e) =>
                                                setData("title", e.target.value)
                                            }
                                            required
                                        />
                                        {errors.title && (
                                            <p className="text-red-600 text-sm">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    {/* Deskripsi */}
                                    <div>
                                        <Label>Deskripsi (Opsional)</Label>
                                        <Textarea
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                            rows={4}
                                        />
                                    </div>

                                    {/* Divisi Asal */}
                                    <div>
                                        <Label>Dari Divisi</Label>
                                        <Input
                                            value={userDivision?.name || "-"}
                                            disabled
                                        />
                                    </div>

                                    {/* Upload File */}
                                    <div>
                                        <Label>Dokumen</Label>
                                        <Input
                                            type="file"
                                            onChange={handleFileChange}
                                            required
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Format: PDF, JPG, PNG (maks. 10MB)
                                        </p>
                                        {errors.file && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors.file}
                                            </p>
                                        )}
                                    </div>

                                    {/* Tombol Kirim */}
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            style={{ borderRadius: "15px" }}
                                            className="hover:bg-gray-700"
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
                </div>{" "}
            </div>
        </AuthenticatedLayout>
    );
}
