import React, { useState, useMemo, useRef } from "react";
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
import { Download, Printer } from "lucide-react";

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
    const printFrameRef = useRef(null);
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

    const handlePrint = () => {
        const url = route("submissions.printDocument", submission.id);
        const frame = printFrameRef.current;
        if (!frame) return;

        const onLoad = () => {
            try {
                if (frame.contentWindow) {
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                }
            } catch (e) {
                // ignore
            }
            frame.removeEventListener("load", onLoad);
        };

        frame.addEventListener("load", onLoad);
        frame.src = `${url}?_=${Date.now()}`;
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

    // Pattern series dari Document Type (Name Series) untuk tampilan saja
    const seriesPattern = useMemo(() => {
        const doc = submission?.workflow?.document;
        if (!doc) return "";

        const ns = doc.name_series || doc.nameSeries || null;
        if (!ns) return "";

        const pattern = ns.series_pattern || "yyyy-mm-####";
        const prefix = ns.prefix || "";
        return `${prefix}${pattern}`;
    }, [submission]);

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
                                    <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between gap-1 sm:gap-2">
                                        <div>
                                            {seriesPattern && (
                                                <p className="text-xs font-mono text-muted-foreground mb-0.5">
                                                    {seriesPattern}
                                                </p>
                                            )}

                                            <div className="flex items-center">
                                                <h3 className="text-md sm:text-2xl font-bold text-foreground/90">
                                                    Judul: {submission.title}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1  rounded-full text-xs sm:text-sm font-bold ${statusColor}`}
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
                                        </div>
                                    </div>
                                    {submission.description && (
                                        <p className="text-sm text-muted-foreground">
                                            Deskripsi: {submission.description}
                                        </p>
                                    )}
                                    <p className="sm:text-sm text-xs text-muted-foreground ">
                                        <span className="font-semibold ">
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
                                    {submission.file_path && (
                                        <a
                                            href={route(
                                                "submissions.download",
                                                submission.id
                                            )}
                                            className="inline-flex items-center justify-center mb-2 py-1 px-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                                        >
                                            <Download className="mr-2 h-4 w-4" />{" "}
                                            Unduh Dokumen
                                        </a>
                                    )}

                                    {Array.isArray(documentFields) &&
                                        documentFields.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handlePrint}
                                                className="border border-gray-200 mb-3 inline-flex items-center justify-center p-2 text-sm font-medium rounded-[8px] bg-muted text-foreground hover:bg-muted/70 active:scale-[0.97] transition-all shadow-sm"
                                                aria-label="Print"
                                            >
                                                <Printer />
                                            </button>
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
                                        className="p-5 mt-6 mb-6 border border-border shadow-sm bg-card"
                                        style={{ borderRadius: "14px" }}
                                    >
                                        <h4 className="font-semibold mb-4 text-foreground text-lg">
                                            Data Dokumen
                                        </h4>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {documentFields.map((f) => (
                                                <div
                                                    key={f.id || f.name}
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                    className="flex flex-col p-2 rounded-lg bg-muted/40 hover:bg-muted transition-colors border border-border/60"
                                                >
                                                    <span className="text-xs text-muted-foreground tracking-wide">
                                                        {f.label}
                                                    </span>

                                                    <span className="font-medium text-sm leading-relaxed text-foreground">
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

                            <div
                                style={{ borderRadius: "15px" }}
                                className="mt-2 border border-border/40 overflow-hidden shadow-inner bg-muted/10"
                            >
                                {submission.file_path ? (
                                    <object
                                        data={fileUrl}
                                        type="application/pdf"
                                        className="w-full h-[600px]"
                                    >
                                        <div className="text-center p-6">
                                            <p className="text-muted-foreground">
                                                Dokumen tidak dapat ditampilkan
                                                di browser ini.
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
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted-foreground">
                                            Tidak ada dokumen pendukung yang
                                            diunggah.
                                        </p>
                                    </div>
                                )}
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
            {/* Hidden iframe for printing */}
            <iframe
                ref={printFrameRef}
                title="print-frame"
                style={{
                    width: 0,
                    height: 0,
                    border: 0,
                    position: "absolute",
                    left: -9999,
                    top: -9999,
                }}
                aria-hidden="true"
            />
        </AuthenticatedLayout>
    );
}

// Hidden iframe used for printing the server-rendered print view without opening a new tab
// Placed outside to avoid layout shifts
