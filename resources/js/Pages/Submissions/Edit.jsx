import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import Header from "@/Components/Header";
import Swal from "sweetalert2";

export default function Edit({ auth, submission, documentFields = [] }) {
    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            title: submission.title || "",
            description: submission.description || "",
            file: null,
            data: submission.data_json || {},
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
                    text:
                        errs?.title ||
                        errs?.file ||
                        errs?.description ||
                        "Terjadi kesalahan. Periksa kembali isian Anda.",
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
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            style={{ borderRadius: "15px" }}
                                            onClick={() =>
                                                (window.location.href =
                                                    route("submissions.index"))
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
