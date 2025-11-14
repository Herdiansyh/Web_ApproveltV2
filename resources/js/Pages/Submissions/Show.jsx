import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import Header from "@/Components/Header";
import Swal from "sweetalert2";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Printer } from "lucide-react";

export default function Show({
    auth,
    submission,
    fileUrl,
    canApprove = false,
    currentStep = null,
    currentSubmissionStep = null,
    documentFields = [],
}) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        approval_note: "",
    });

    const handleNoAccess = () => {
        Swal.fire({
            icon: "error",
            title: "Akses Ditolak",
            text: "Anda tidak memiliki hak untuk tindakan ini.",
            confirmButtonText: "OK",
        });
    };

    const handleApprove = () => {
        if (!canApprove) return handleNoAccess();
        post(route("submissions.approve", submission.id), {
            data: { approval_note: data.approval_note || "" },
            onSuccess: () => {
                setShowApproveModal(false);
                reset();
                Swal.fire({
                    icon: "success",
                    title: "Disetujui!",
                    text: "Pengajuan berhasil disetujui.",
                    confirmButtonText: "OK",
                }).then(() => window.location.reload());
            },
        });
    };

    const handleReject = () => {
        if (!canApprove) return handleNoAccess();

        if (!data.approval_note.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Catatan wajib diisi",
                text: "Tuliskan alasan penolakan.",
                confirmButtonText: "OK",
            });
            return;
        }

        Swal.fire({
            title: "Yakin ingin menolak?",
            text: "Tindakan ini tidak dapat dibatalkan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, tolak",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                post(route("submissions.reject", submission.id), {
                    data: { approval_note: data.approval_note },
                    onSuccess: () => {
                        setShowRejectModal(false);
                        reset();
                        Swal.fire({
                            icon: "success",
                            title: "Ditolak",
                            text: "Pengajuan telah ditolak.",
                            confirmButtonText: "OK",
                        }).then(() => window.location.reload());
                    },
                });
            }
        });
    };

    const handleRequestNext = () => {
        if (!canApprove) return handleNoAccess();
        Swal.fire({
            title: "Teruskan ke langkah berikutnya?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                post(route("submissions.requestNext", submission.id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Berhasil",
                            text: "Pengajuan diteruskan ke langkah berikutnya.",
                            confirmButtonText: "OK",
                        }).then(() => window.location.reload());
                    },
                });
            }
        });
    };

    const statusColor =
        submission.status === "Approved by Direktur"
            ? " text-green-700"
            : submission.status === "rejected"
            ? " text-rose-700"
            : " text-amber-500";

    const dataMap = useMemo(() => submission?.data_json || {}, [submission]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground tracking-tight">
                    Detail Pengajuan
                </h2>
            }
        >
            <Head title="Detail Pengajuan" />
            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground">
                <Header />
                <div className="py-10 px-6 w-full">
                    <div className=" mx-auto">
                        <Card className="p-8 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md bg-card/80">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center w-full justify-between">
                                        <h3 className="text-md sm:text-2xl font-bold text-foreground/90">
                                            {submission.title}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${statusColor}`}
                                        >
                                            {submission.status ===
                                            "Approved by Direktur"
                                                ? "• Disetujui"
                                                : submission.status ===
                                                  "• rejected"
                                                ? "Ditolak"
                                                : "• Menunggu Persetujuan"}
                                        </span>
                                    </div>
                                    <p className="sm:text-sm text-xs text-muted-foreground">
                                        <span className="font-semibold">
                                            Diajukan oleh:
                                        </span>{" "}
                                        {submission.user.name} (
                                        {submission.user.division?.name ?? "-"})
                                    </p>

                                    {submission.approval_note && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            📝 {submission.approval_note}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <a
                                        href={route(
                                            "submissions.download",
                                            submission.id
                                        )}
                                        className="inline-flex items-center justify-center mb-2 py-1 px-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                                    >
                                        📄 Unduh Dokumen
                                    </a>

                                    {submission.template_id &&
                                        (auth?.user?.id ===
                                            submission.user_id ||
                                            ((submission.status === "pending" ||
                                                submission.status
                                                    ?.toLowerCase()
                                                    .includes("waiting")) &&
                                                currentSubmissionStep?.status ===
                                                    "pending" &&
                                                canApprove)) && (
                                            <a
                                                href={route(
                                                    "submissions.previewTemplateSubmission",
                                                    submission.id
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-full bg-muted text-foreground hover:bg-muted/70 active:scale-[0.97] transition-all shadow-sm"
                                            >
                                                👁️ Preview Template
                                            </a>
                                        )}

                                    {Array.isArray(documentFields) &&
                                        documentFields.length > 0 && (
                                            <a
                                                href={route(
                                                    "submissions.printDocument",
                                                    submission.id
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="border border-gray-200 mb-3 inline-flex items-center justify-center p-2 text-sm font-medium rounded-[8px] bg-muted text-foreground hover:bg-muted/70 active:scale-[0.97] transition-all shadow-sm"
                                            >
                                                <Printer />
                                            </a>
                                        )}

                                    {(submission.status === "pending" ||
                                        submission.status
                                            ?.toLowerCase()
                                            .includes("waiting")) &&
                                        currentSubmissionStep?.status ===
                                            "pending" &&
                                        canApprove &&
                                        Array.isArray(currentStep?.actions) &&
                                        currentStep.actions.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button className="rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm text-sm px-4 py-1.5">
                                                        ⚙️ Action
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-44 border border-border/30 shadow-md rounded-xl text-sm"
                                                >
                                                    {currentStep.actions.map(
                                                        (action, index) => {
                                                            const a =
                                                                String(
                                                                    action
                                                                ).toLowerCase();
                                                            if (
                                                                a.includes(
                                                                    "approve"
                                                                )
                                                            )
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            setShowApproveModal(
                                                                                true
                                                                            )
                                                                        }
                                                                        className="hover:text-green-600 cursor-pointer"
                                                                    >
                                                                        ✅
                                                                        Approve
                                                                    </DropdownMenuItem>
                                                                );
                                                            if (
                                                                a.includes(
                                                                    "reject"
                                                                )
                                                            )
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            setShowRejectModal(
                                                                                true
                                                                            )
                                                                        }
                                                                        className="hover:text-rose-600 cursor-pointer"
                                                                    >
                                                                        ❌
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                );
                                                            if (
                                                                a.includes(
                                                                    "next"
                                                                )
                                                            )
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={
                                                                            handleRequestNext
                                                                        }
                                                                        className="hover:text-blue-600 cursor-pointer"
                                                                    >
                                                                        🔁 Next
                                                                        Step
                                                                    </DropdownMenuItem>
                                                                );
                                                            return null;
                                                        }
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                </div>
                            </div>

                            {/* Read-only dynamic fields when available */}
                            {Array.isArray(documentFields) &&
                                documentFields.length > 0 && (
                                    <Card
                                        className="p-4 mb-6"
                                        style={{
                                            borderRadius: "10px",
                                        }}
                                    >
                                        <h4 className="font-semibold mb-3">
                                            Data Dokumen
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {documentFields.map((f) => (
                                                <div
                                                    key={f.id || f.name}
                                                    className="flex flex-col"
                                                >
                                                    <span className="text-sm text-muted-foreground">
                                                        {f.label}
                                                    </span>
                                                    <span className="font-medium break-words">
                                                        {String(
                                                            dataMap?.[f.name] ??
                                                                "-"
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                            <div className="mt-2 border border-border/40 rounded-xl overflow-hidden shadow-inner bg-muted/10">
                                <object
                                    data={fileUrl}
                                    type="application/pdf"
                                    className="w-full h-[600px]"
                                >
                                    <div className="text-center p-6">
                                        <p className="text-muted-foreground">
                                            Dokumen tidak dapat ditampilkan di
                                            browser ini.
                                        </p>
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Buka di tab baru
                                        </a>
                                    </div>
                                </object>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Approve */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            Setujui Pengajuan
                        </h3>
                        <Textarea
                            placeholder="Catatan (opsional)"
                            value={data.approval_note}
                            onChange={(e) =>
                                setData("approval_note", e.target.value)
                            }
                            rows={3}
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowApproveModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                Setujui
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal Reject */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            Tolak Pengajuan
                        </h3>
                        <Textarea
                            placeholder="Tuliskan alasan penolakan..."
                            value={data.approval_note}
                            onChange={(e) =>
                                setData("approval_note", e.target.value)
                            }
                            rows={3}
                            required
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={processing}
                            >
                                Tolak
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
