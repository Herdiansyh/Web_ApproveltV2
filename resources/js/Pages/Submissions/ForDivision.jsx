import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import Swal from "sweetalert2";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import Header from "@/Components/Header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Search } from "lucide-react";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";

export default function ForDivision({ auth, submissions, userDivision }) {
    const [filter, setFilter] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    const handleFilterChange = (e) => setFilter(e.target.value);

    const filteredSubmissions = submissions.data.filter((s) =>
        s.title.toLowerCase().includes(filter.toLowerCase())
    );

    // Helper function to check if user can see actions for a submission
    const canShowActions = (submission) => {
        const isApproved = String(submission.status).toLowerCase().includes("approved");
        const isOwner = auth.user.id === submission.user_id;
        const sameDivision = userDivision?.id && submission.division_id === userDivision.id;
        const canEditGlobal = !!submission.permission_for_me?.can_edit;
        const canDeleteGlobal = !!submission.permission_for_me?.can_delete;
        
        const showEdit = !isApproved && (isOwner || (sameDivision && canEditGlobal));
        const showDelete = !isApproved && (isOwner || (sameDivision && canDeleteGlobal));
        
        return showEdit || showDelete;
    };

    const hasAnyActions = filteredSubmissions.some(submission => canShowActions(submission));

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    📁 Pengajuan Masuk ke Divisi Saya
                </h2>
            }
        >
            <Head title="Pengajuan Masuk" />
            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
                <Header />
                <div className="w-full p-8">
                    <div className=" mx-auto bg-card shadow-sm rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                            <div className="text-lg text-center font-medium">
                                📁 Daftar Pengajuan Diproses
                            </div>
                            <div className="relative w-full md:w-1/3">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    style={{ borderRadius: "15px" }}
                                    placeholder="Cari dokumen..."
                                    value={filter}
                                    onChange={handleFilterChange}
                                    className="pl-9 focus:ring-primary/60 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div
                            style={{ borderRadius: "15px" }}
                            className="overflow-x-auto border border-border/30"
                        >
                            <table className="min-w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground uppercase text-xs tracking-wider">
                                        <th className="py-3 px-6 text-left">
                                            Judul / Deskripsi
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Pengirim
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Jenis Dokumen
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Status
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tanggal Diajukan
                                        </th>
                                        {hasAnyActions && (
                                            <th className="py-3 px-6 text-center">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredSubmissions.length > 0 ? (
                                        filteredSubmissions.map(
                                            (submission) => (
                                                <tr
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "submissions.show",
                                                                submission.id
                                                            )
                                                        )
                                                    }
                                                    className=" cursor-pointer hover:bg-gray-100 transition"
                                                    key={submission.id}
                                                >
                                                    <td className="py-3 px-6">
                                                        <div className="font-medium hover:underline">
                                                            {submission.title}
                                                        </div>
                                                        {submission.description && (
                                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                                {
                                                                    submission.description
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 hover:underline">
                                                        {submission.user.name}
                                                    </td>
                                                    <td className="py-3 px-6 hover:underline">
                                                        {submission.workflow
                                                            ?.document?.name ||
                                                            "-"}
                                                    </td>
                                                    <td className="py-3 px-6 flex">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                String(
                                                                    submission.status ||
                                                                        ""
                                                                )
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        "approved"
                                                                    )
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : String(
                                                                          submission.status ||
                                                                              ""
                                                                      )
                                                                          .toLowerCase()
                                                                          .includes(
                                                                              "rejected"
                                                                          )
                                                                    ? "bg-rose-100 text-rose-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            }`}
                                                        >
                                                            {(() => {
                                                                const raw =
                                                                    String(
                                                                        submission.status ||
                                                                            ""
                                                                    ).toLowerCase();
                                                                const step =
                                                                    submission.current_workflow_step ||
                                                                    null;
                                                                const who =
                                                                    step
                                                                        ?.division
                                                                        ?.name ||
                                                                    step?.role ||
                                                                    null;
                                                                if (
                                                                    raw ===
                                                                        "pending" ||
                                                                    raw.includes(
                                                                        "waiting"
                                                                    )
                                                                ) {
                                                                    return `Waiting confirmation${
                                                                        who
                                                                            ? ` to ${who}`
                                                                            : ""
                                                                    }`;
                                                                }
                                                                if (
                                                                    raw ===
                                                                        "approved" ||
                                                                    raw.includes(
                                                                        "approved"
                                                                    )
                                                                )
                                                                    return "Disetujui";
                                                                if (
                                                                    raw ===
                                                                        "rejected" ||
                                                                    raw.includes(
                                                                        "rejected"
                                                                    )
                                                                )
                                                                    return "Ditolak";
                                                                return (
                                                                    submission.status ||
                                                                    "Pending"
                                                                );
                                                            })()}
                                                        </span>
                                                        {String(
                                                            submission.status
                                                        )
                                                            .toLowerCase()
                                                            .includes(
                                                                "approved"
                                                            ) && (
                                                            <span
                                                                className="ml-2 text-[11px] rounded px-2 py-0.5 bg-gray-100 text-gray-700"
                                                                title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                            >
                                                                Final
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 text-muted-foreground">
                                                        {new Date(
                                                            submission.created_at
                                                        ).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                    {hasAnyActions && (
                                                        <td
                                                            className="py-3 px-6 text-center"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {canShowActions(submission) ? (
                                                                <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="rounded-full hover:bg-muted/60"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-36 shadow-lg border border-border/40"
                                                            >
                                                                {(() => {
                                                                    const isApproved =
                                                                        String(
                                                                            submission.status
                                                                        )
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                "approved"
                                                                            );
                                                                    const isOwner =
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;
                                                                    const sameDivision =
                                                                        userDivision?.id &&
                                                                        submission.division_id ===
                                                                            userDivision.id;
                                                                    const canEditGlobal =
                                                                        !!submission
                                                                            .permission_for_me
                                                                            ?.can_edit;
                                                                    const showEdit =
                                                                        !isApproved &&
                                                                        (isOwner ||
                                                                            (sameDivision &&
                                                                                canEditGlobal));
                                                                    return showEdit;
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        asChild
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <Link
                                                                            href={route(
                                                                                "submissions.edit",
                                                                                submission.id
                                                                            )}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />{" "}
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {(() => {
                                                                    const isApproved =
                                                                        String(
                                                                            submission.status
                                                                        )
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                "approved"
                                                                            );
                                                                    const isOwner =
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;
                                                                    const sameDivision =
                                                                        userDivision?.id &&
                                                                        submission.division_id ===
                                                                            userDivision.id;
                                                                    const canDeleteGlobal =
                                                                        !!submission
                                                                            .permission_for_me
                                                                            ?.can_delete;
                                                                    const showDelete =
                                                                        !isApproved &&
                                                                        (isOwner ||
                                                                            (sameDivision &&
                                                                                canDeleteGlobal));
                                                                    return showDelete;
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setToDeleteId(
                                                                                submission.id
                                                                            );
                                                                            setConfirmOpen(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 text-red-600"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />{" "}
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={hasAnyActions ? 6 : 5}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Tidak ada pengajuan ditemukan 😕
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-start gap-1 text-sm">
                            {submissions.links?.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    style={{ borderRadius: "10px" }}
                                    className={`px-3 py-1 transition-colors ${
                                        link.active
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Hapus Pengajuan?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmOpen(false)}
                            className="rounded-md"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-md"
                            onClick={() => {
                                if (toDeleteId) {
                                    // Show loading alert
                                    Swal.fire({
                                        title: "Menghapus...",
                                        text: "Sedang menghapus pengajuan.",
                                        allowOutsideClick: false,
                                        allowEscapeKey: false,
                                        didOpen: () => {
                                            Swal.showLoading();
                                        },
                                    });

                                    // Manual fetch request
                                    const csrfToken = document
                                        .querySelector(
                                            'meta[name="csrf-token"]'
                                        )
                                        ?.getAttribute("content");
                                    if (!csrfToken) {
                                        Swal.fire({
                                            icon: "error",
                                            title: "Error!",
                                            text: "CSRF token tidak ditemukan. Silakan refresh halaman.",
                                            confirmButtonText: "OK",
                                        });
                                        return;
                                    }

                                    fetch(
                                        route(
                                            "submissions.destroy",
                                            toDeleteId
                                        ),
                                        {
                                            method: "DELETE",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                                "X-CSRF-TOKEN": csrfToken,
                                                Accept: "application/json",
                                                "X-Requested-With":
                                                    "XMLHttpRequest",
                                            },
                                            body: JSON.stringify({}),
                                        }
                                    )
                                        .then((response) => {
                                            if (!response.ok) {
                                                if (response.status === 419) {
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
                                        .then((responseData) => {
                                            if (responseData.success) {
                                                setConfirmOpen(false);
                                                setToDeleteId(null);
                                                Swal.fire({
                                                    icon: "success",
                                                    title: "Dihapus!",
                                                    text: "Pengajuan berhasil dihapus.",
                                                    timer: 2000,
                                                    showConfirmButton: false,
                                                }).then(() =>
                                                    window.location.reload()
                                                );
                                            } else {
                                                Swal.fire({
                                                    icon: "error",
                                                    title: "Gagal!",
                                                    text:
                                                        responseData.message ||
                                                        "Gagal menghapus pengajuan.",
                                                    confirmButtonText: "OK",
                                                });
                                            }
                                        })
                                        .catch((error) => {
                                            console.error(
                                                "Delete error:",
                                                error
                                            );
                                            Swal.fire({
                                                icon: "error",
                                                title: "Error!",
                                                text:
                                                    error.message ||
                                                    "Terjadi kesalahan jaringan. Silakan coba lagi.",
                                                confirmButtonText: "OK",
                                            });
                                        });
                                }
                            }}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
