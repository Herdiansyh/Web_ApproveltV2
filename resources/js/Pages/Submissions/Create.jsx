import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function Create({ auth, userDivision, workflows }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        workflow_id: "",
        title: "",
        description: "",
        file: null,
    });

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
                            text: err?.workflow
                                ? err.workflow
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
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="py-12 w-full">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        <Card className="p-6 shadow-md">
                            <form
                                onSubmit={submit}
                                encType="multipart/form-data"
                            >
                                <div className="space-y-6">
                                    {/* Pilih Workflow */}
                                    <div>
                                        <Label>Workflow</Label>
                                        <Select
                                            value={data.workflow_id}
                                            onValueChange={(value) =>
                                                setData("workflow_id", value)
                                            }
                                        >
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="-- Pilih Workflow --" />
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
                                                                }{" "}
                                                                - {wf.name}
                                                            </SelectItem>
                                                        ) : null
                                                    )
                                                ) : (
                                                    <SelectItem
                                                        disabled
                                                        value="wd"
                                                    >
                                                        Tidak ada workflow
                                                        tersedia
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
