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
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";
import { useLoading } from "@/Components/GlobalLoading";
import DownloadLoading from "@/Components/DownloadLoading";

export default function Show({
    auth,
    submission,
    fileUrl,
    canApprove = false,
    currentStep = null,
    currentSubmissionStep = null,
    workflowSteps = [],
    documentFields = [],
    permissionForMe = null,
    userDivisionId = null,
    hasStamped = false,
}) {
    const { showLoading, hideLoading } = useLoading();
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDownloadLoading, setShowDownloadLoading] = useState(false);
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

    const handleDownload = () => {
        // Show download loading animation
        setShowDownloadLoading(true);
        
        // The animation will trigger the download when complete
        // We'll handle this in the onComplete callback
    };

    const handleDownloadComplete = () => {
        // Start the download using fetch to stay on the same page
        const downloadUrl = route("submissions.download", submission.id);
        
        fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/pdf,application/octet-stream'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Download failed');
            }
            return response.blob();
        })
        .then(blob => {
            // Create download link and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `document-${submission.id}.pdf`; // You can customize filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Hide loading animation and show success message
            setTimeout(() => {
                setShowDownloadLoading(false);
                Swal.fire({
                    icon: "success",
                    title: "Download Berhasil!",
                    text: "Dokumen berhasil diunduh.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }, 500);
        })
        .catch(error => {
            console.error('Download error:', error);
            // Fallback to window.open if fetch fails
            window.open(downloadUrl, '_blank');
            
            setTimeout(() => {
                setShowDownloadLoading(false);
                Swal.fire({
                    icon: "success",
                    title: "Download Berhasil!",
                    text: "Dokumen berhasil diunduh.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }, 500);
        });
    };

    const handleApprove = () => {
        if (!canApprove) return handleNoAccess();
        
        // Show custom loading animation
        showLoading("Menyetujui pengajuan...");
        
        // Manual fetch request
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!csrfToken) {
            hideLoading(false); // Hide loading animation on CSRF error
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: "CSRF token tidak ditemukan. Silakan refresh halaman.",
                confirmButtonText: "OK",
            });
            return;
        }
        
        fetch(route("submissions.approve", submission.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                approval_note: data.approval_note || ""
            })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 419) {
                    throw new Error('CSRF token mismatch. Silakan refresh halaman.');
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(responseData => {
            hideLoading(responseData.success); // Hide loading animation with success status
            if (responseData.success) {
                setShowApproveModal(false);
                reset();
                Swal.fire({
                    icon: "success",
                    title: "Disetujui!",
                    text: "Pengajuan berhasil disetujui.",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => window.location.reload());
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Gagal!",
                    text: responseData.message || "Gagal menyetujui pengajuan.",
                    confirmButtonText: "OK",
                });
            }
        })
        .catch(error => {
            console.error("Approve error:", error);
            hideLoading(false); // Hide loading animation on error
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error.message || "Terjadi kesalahan jaringan. Silakan coba lagi.",
                confirmButtonText: "OK",
            });
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
                // Show custom loading animation
                showLoading("Menolak pengajuan...");
                
                // Manual fetch request
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (!csrfToken) {
                    hideLoading(false); // Hide loading animation on CSRF error
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "CSRF token tidak ditemukan. Silakan refresh halaman.",
                        confirmButtonText: "OK",
                    });
                    return;
                }
                
                fetch(route("submissions.reject", submission.id), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                        approval_note: data.approval_note
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 419) {
                            throw new Error('CSRF token mismatch. Silakan refresh halaman.');
                        } else {
                            throw new Error(`Server error: ${response.status}`);
                        }
                    }
                    return response.json();
                })
                .then(responseData => {
                    hideLoading(responseData.success); // Hide loading animation with success status
                    if (responseData.success) {
                        setShowRejectModal(false);
                        reset();
                        Swal.fire({
                            icon: "success",
                            title: "Ditolak",
                            text: "Pengajuan telah ditolak.",
                            timer: 2000,
                            showConfirmButton: false,
                        }).then(() => window.location.reload());
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal!",
                            text: responseData.message || "Gagal menolak pengajuan.",
                            confirmButtonText: "OK",
                        });
                    }
                })
                .catch(error => {
                    console.error("Reject error:", error);
                    hideLoading(false); // Hide loading animation on error
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: error.message || "Terjadi kesalahan jaringan. Silakan coba lagi.",
                        confirmButtonText: "OK",
                    });
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
                // Show loading alert
                Swal.fire({
                    title: "Memproses...",
                    text: "Sedang meneruskan pengajuan.",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                // Manual fetch request
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (!csrfToken) {
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: "CSRF token tidak ditemukan. Silakan refresh halaman.",
                        confirmButtonText: "OK",
                    });
                    return;
                }
                
                fetch(route("submissions.requestNext", submission.id), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({})
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 419) {
                            throw new Error('CSRF token mismatch. Silakan refresh halaman.');
                        } else {
                            throw new Error(`Server error: ${response.status}`);
                        }
                    }
                    return response.json();
                })
                .then(responseData => {
                    if (responseData.success) {
                        Swal.fire({
                            icon: "success",
                            title: "Berhasil",
                            text: "Pengajuan diteruskan ke langkah berikutnya.",
                            timer: 2000,
                            showConfirmButton: false,
                        }).then(() => window.location.reload());
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal!",
                            text: responseData.message || "Gagal meneruskan pengajuan.",
                            confirmButtonText: "OK",
                        });
                    }
                })
                .catch(error => {
                    console.error("Request next error:", error);
                    Swal.fire({
                        icon: "error",
                        title: "Error!",
                        text: error.message || "Terjadi kesalahan jaringan. Silakan coba lagi.",
                        confirmButtonText: "OK",
                    });
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

    const dataMap = useMemo(() => {
            const data = submission?.data_json || {};
            console.log('Show.jsx - dataMap:', data);
            console.log('Show.jsx - has tableData:', !!data.tableData);
            console.log('Show.jsx - has tableColumns:', !!data.tableColumns);
            if (data.tableData) {
                console.log('Show.jsx - tableData length:', data.tableData.length);
            }
            return data;
        }, [submission]);

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

    const isApprovedFinal = String(submission?.status || "")
        .toLowerCase()
        .includes("approved");
    const isOwner = auth?.user?.id === submission?.user_id;
    const sameDivision =
        userDivisionId && submission?.division_id === userDivisionId;
    const canEditGlobal = !!permissionForMe?.can_edit;
    const canDeleteGlobal = !!permissionForMe?.can_delete;
    const canEditNow =
        !isApprovedFinal && (isOwner || (sameDivision && canEditGlobal));
    const canDeleteNow =
        !isApprovedFinal && (isOwner || (sameDivision && canDeleteGlobal));

    // Ambil catatan penolakan dari workflowSteps (step terakhir yang rejected dan punya note)
    const rejectedNote = useMemo(() => {
        if (!Array.isArray(workflowSteps)) return null;
        const rejected = workflowSteps.filter(
            (ws) =>
                String(ws.status || "").toLowerCase() === "rejected" &&
                ws.note &&
                String(ws.note).trim() !== ""
        );
        if (rejected.length === 0) return null;
        rejected.sort((a, b) => {
            const ta = new Date(a.approved_at || a.updated_at || 0).getTime();
            const tb = new Date(b.approved_at || b.updated_at || 0).getTime();
            return tb - ta;
        });
        const last = rejected[0];
        return { note: last.note };
    }, [workflowSteps]);

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
                            {(isApprovedFinal ||
                                (!canEditNow &&
                                    !canDeleteNow &&
                                    !canApprove)) && (
                                <div
                                    style={{ borderRadius: "15px" }}
                                    className="mb-4 sm:text-sm text-xs  border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2"
                                >
                                    {isApprovedFinal
                                        ? "Pengajuan ini sudah disetujui dan tidak bisa diubah."
                                        : "Anda tidak memiliki akses untuk mengubah atau menghapus pengajuan ini."}
                                </div>
                            )}
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between gap-1 sm:gap-2">
                                        <div>
                                            {/* {seriesPattern && (
                                                <p className="text-xs font-mono text-muted-foreground mb-0.5">
                                                    {seriesPattern}
                                                </p>
                                            )} */}

                                            <div className="flex items-center">
                                                <h3 className="text-md sm:text-2xl font-bold text-foreground/90">
                                                    Judul: {submission.title}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1  rounded-full text-xs sm:text-sm font-bold ${statusColor}`}
                                                >
                                                    {(() => {
                                                        const raw = String(
                                                            submission.status ||
                                                                ""
                                                        ).toLowerCase();
                                                        const who =
                                                            currentStep
                                                                ?.division
                                                                ?.name ||
                                                            currentStep?.role ||
                                                            null;
                                                        if (
                                                            raw.includes(
                                                                "approved"
                                                            )
                                                        )
                                                            return "• Disetujui";
                                                        if (
                                                            raw ===
                                                                "rejected" ||
                                                            raw.includes(
                                                                "rejected"
                                                            )
                                                        )
                                                            return "• Ditolak";
                                                        return `• Waiting confirmation${
                                                            who
                                                                ? ` to ${who}`
                                                                : ""
                                                        }`;
                                                    })()}
                                                </span>
                                                {isApprovedFinal && (
                                                    <span
                                                        className="ml-2 text-[11px] rounded px-2 py-0.5 bg-gray-100 text-gray-700"
                                                        title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                    >
                                                        Final
                                                    </span>
                                                )}
                                                {hasStamped && (
                                                    <span
                                                        className="ml-2 text-[11px] rounded px-2 py-0.5 bg-emerald-100 text-emerald-700"
                                                        title="File final sudah distempel"
                                                    >
                                                        Stamped
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Document Type */}
                                    <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                                        <span className="font-semibold">
                                            Jenis Dokumen:
                                        </span>{" "}
                                        {submission?.workflow?.document?.name ||
                                            "-"}
                                    </div>

                                    <p className="sm:text-sm text-xs text-muted-foreground ">
                                        <span className="font-semibold ">
                                            Diajukan oleh:
                                        </span>{" "}
                                        {submission.user.name} (
                                        {submission.user.division?.name ?? "-"})
                                    </p>
                                    {submission.description && (
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold">
                                                Deskripsi:
                                            </span>{" "}
                                            {submission.description}
                                        </p>
                                    )}
                                    {rejectedNote?.note && (
                                        <div className="text-sm mt-1 rounded-md border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2">
                                            <span className="font-semibold">
                                                Alasan Penolakan:
                                            </span>{" "}
                                            {rejectedNote.note}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {isApprovedFinal && submission.file_path ? (
                                        <button
                                            onClick={handleDownload}
                                            className="inline-flex items-center justify-center mb-2 py-1 px-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                                            title="Unduh dokumen final yang sudah distempel"
                                        >
                                            <Download className="mr-2 h-4 w-4" />{" "}
                                            Unduh Dokumen
                                        </button>
                                    ) : (
                                        <span
                                            style={{ borderRadius: "10px" }}
                                            className="mb-2 inline-flex items-center px-2 py-1 text-[11px] bg-slate-100 text-slate-600 border border-slate-200"
                                            title="Unduh tersedia setelah pengajuan disetujui di tahap terakhir"
                                        >
                                            Unduh tersedia setelah final
                                            approval
                                        </span>
                                    )}

                                    {Array.isArray(documentFields) &&
                                        documentFields.length > 0 &&
                                        (isApprovedFinal ? (
                                            <button
                                                type="button"
                                                onClick={handlePrint}
                                                className="border border-gray-200 mb-3 inline-flex items-center justify-center p-1 md:p-2 text-sm font-medium rounded-[8px] bg-muted text-foreground hover:bg-muted/70 active:scale-[0.97] transition-all shadow-sm"
                                                aria-label="Print"
                                                title="Cetak dokumen"
                                            >
                                                <Printer className="w-5 md:w-7" />
                                            </button>
                                        ) : (
                                            <span
                                                style={{ borderRadius: "10px" }}
                                                className="mb-3 inline-flex items-center px-2 py-1 text-[11px]  bg-slate-100 text-slate-600 border border-slate-200"
                                                title="Cetak tersedia setelah pengajuan disetujui di tahap terakhir"
                                            >
                                                Cetak tersedia setelah final
                                                approval
                                            </span>
                                        ))}

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
                                            {documentFields.map((f) => {
                                                const type = String(f.type || "text").toLowerCase();
                                                
                                                // Skip label type fields from showing as regular fields
                                                if (type === "label") {
                                                    return (
                                                        <div key={f.id || f.name} className="col-span-full">
                                                            <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>
                                                            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mt-2">
                                                                {f.label}
                                                            </h4>
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <div
                                                        key={f.id || f.name}
                                                        style={{
                                                            borderRadius: "15px",
                                                        }}
                                                        className="flex flex-col px-2 py-1 rounded-lg bg-muted/40 hover:bg-muted transition-colors border-b border-border/60"
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
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                            {/* Dynamic Table Data */}
                            {dataMap?.tableData &&
                                dataMap?.tableColumns &&
                                dataMap.tableData.length > 0 && (
                                    <Card
                                        className="p-5 mt-6 mb-6 border border-border shadow-sm bg-card"
                                        style={{ borderRadius: "14px" }}
                                    >
                                        <h4 className="font-semibold mb-4 text-foreground text-lg">
                                            Data Tabel
                                        </h4>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-border">
                                                <thead>
                                                    <tr className="bg-muted/50">
                                                        {dataMap.tableColumns.map(
                                                            (column) => (
                                                                <th
                                                                    key={
                                                                        column.id
                                                                    }
                                                                    className="border border-border px-4 py-2 text-left text-sm font-semibold text-foreground"
                                                                >
                                                                    {
                                                                        column.name
                                                                    }
                                                                </th>
                                                            )
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dataMap.tableData.map(
                                                        (row, rowIndex) => (
                                                            <tr
                                                                key={rowIndex}
                                                                className="hover:bg-muted/30"
                                                            >
                                                                {dataMap.tableColumns.map(
                                                                    (
                                                                        column
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                column.id
                                                                            }
                                                                            className="border border-border px-4 py-2 text-sm text-foreground"
                                                                        >
                                                                            {row[
                                                                                column
                                                                                    .key
                                                                            ] ||
                                                                                "-"}
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-3 text-xs text-muted-foreground">
                                            Total {dataMap.tableData.length}{" "}
                                            baris
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
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
            {/* Modal Approve */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            Setujui Pengajuan
                        </h3>

                        <div className="flex justify-end gap-2">
                            <Button
                                style={{ borderRadius: "15px" }}
                                variant="outline"
                                onClick={() => setShowApproveModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                style={{ borderRadius: "15px" }}
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
                                style={{ borderRadius: "15px" }}
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                style={{ borderRadius: "15px" }}
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
            
            {/* Download Loading Animation */}
            <DownloadLoading show={showDownloadLoading} onComplete={handleDownloadComplete} />
        </AuthenticatedLayout>
    );
}

// Hidden iframe used for printing the server-rendered print view without opening a new tab
// Placed outside to avoid layout shifts
