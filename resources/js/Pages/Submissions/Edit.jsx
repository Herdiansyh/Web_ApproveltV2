import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Header from "@/Components/Header";
import Swal from "sweetalert2";

export default function Edit({ auth, submission }) {
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        title: submission.title || "",
        description: submission.description || "",
        file: null,
    });

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
        // Prepare payload using transform to ensure _method and trimmed title are sent
        transform((payload) => ({
            ...payload,
            _method: "put",
            title: (payload.title || "").trim(),
        }));
        post(route("submissions.update", submission.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengajuan berhasil diperbarui.",
                }).then(() => {
                    // Redirect back to list
                    window.location.href = route("submissions.index");
                });
            },
            onError: (errs) => {
                Swal.fire({
                    icon: "error",
                    title: "Gagal",
                    text: errs?.title || errs?.file || errs?.description || "Terjadi kesalahan. Periksa kembali isian Anda.",
                });
            },
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
                        <Card className="p-6 shadow-md">
                            <form onSubmit={onSubmit} encType="multipart/form-data">
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
                                                href={route("submissions.file", submission.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                Lihat Dokumen Saat Ini
                                            </a>
                                            {submission.file_path && (
                                                <div className="text-muted-foreground mt-1 truncate">
                                                    {submission.file_path.split("/").pop()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Ganti Dokumen (opsional)</Label>
                                        <Input
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

                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => (window.location.href = route("submissions.index"))}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-primary text-primary-foreground"
                                            style={{ borderRadius: "15px" }}
                                        >
                                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
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
