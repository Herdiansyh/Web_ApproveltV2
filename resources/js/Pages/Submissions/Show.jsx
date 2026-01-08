import React, { useState, useMemo, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
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
import {
    Download,
    Printer,
    MoreVertical,
    Pencil,
    Trash2,
    X,
    RefreshCw,
} from "lucide-react";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";
import { useLoading } from "@/Components/GlobalLoading";
import OptimizedDownloadLoading from "@/Components/OptimizedDownloadLoading";
import { fetchWithCsrf } from "@/utils/csrfToken";
import PdfViewer from "@/Components/PdfViewer";

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
    actions = [],
}) {
    const { showLoading, hideLoading } = useLoading();
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAmendModal, setShowAmendModal] = useState(false);
    const [showDownloadLoading, setShowDownloadLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const printFrameRef = useRef(null);
    const { data, setData, post, processing, reset } = useForm({
        approval_note: "",
        cancel_reason: "",
        amend_reason: "",
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
        // Show download loading animation immediately
        setShowDownloadLoading(true);

        // Start real download immediately with progress tracking
        const downloadUrl = route("submissions.download", submission.id);

        // Reset progress
        setDownloadProgress(0);

        // Detect file type from submission to set proper headers and filename
        const getFileExtension = () => {
            const fileName = submission.file_path || submission.generated_pdf_path || '';
            const extension = fileName.split('.').pop()?.toLowerCase();
            return extension || 'pdf'; // Default to pdf
        };

        const fileExtension = getFileExtension();
        const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
        
        // Set proper accept headers based on file type
        const acceptHeader = isImageFile 
            ? 'image/*,application/octet-stream' 
            : 'application/pdf,application/octet-stream';

        fetch(downloadUrl, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "Accept": acceptHeader,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Download failed");
                }

                const contentLength = response.headers.get("Content-Length");
                const total = parseInt(contentLength, 10);
                let loaded = 0;

                // Create reader to track progress
                const reader = response.body.getReader();

                return new Response(
                    new ReadableStream({
                        start(controller) {
                            function pump() {
                                return reader.read().then(({ done, value }) => {
                                    if (done) {
                                        controller.close();
                                        return;
                                    }

                                    loaded += value.byteLength;
                                    const progress =
                                        total > 0
                                            ? (loaded / total) * 100
                                            : Math.min(loaded / 100000, 100);
                                    setDownloadProgress(progress);

                                    controller.enqueue(value);
                                    return pump();
                                });
                            }
                            return pump();
                        },
                    })
                );
            })
            .then((response) => response.blob())
            .then((blob) => {
                // Create download link and trigger download
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                
                // Generate proper filename based on file type
                const fileExtension = getFileExtension();
                const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
                
                if (isImageFile) {
                    link.download = `document-${submission.id}.${fileExtension}`;
                } else {
                    link.download = `document-${submission.id}.pdf`;
                }
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                // Hide loading animation and show success message
                setTimeout(() => {
                    setShowDownloadLoading(false);
                    setDownloadProgress(null);
                    Swal.fire({
                        icon: "success",
                        title: "Download Berhasil!",
                        text: `Dokumen ${isImageFile ? 'gambar' : 'PDF'} berhasil diunduh.`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }, 500);
            })
            .catch((error) => {
                // Fallback to window.open if fetch fails
                window.open(downloadUrl, "_blank");

                setTimeout(() => {
                    setShowDownloadLoading(false);
                    setDownloadProgress(null);
                    Swal.fire({
                        icon: "error",
                        title: "Download Gagal",
                        text: "Terjadi kesalahan saat mengunduh dokumen. Silakan coba lagi.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }, 500);
            });
    };

    const handleDownloadComplete = () => {
        // This function is no longer needed - download starts immediately
        // Just hide the animation if called
        setShowDownloadLoading(false);
        setDownloadProgress(null);
    };

    const handleApprove = () => {
        if (!canApprove) return handleNoAccess();

        // Show custom loading animation
        showLoading("Menyetujui pengajuan...");

        fetchWithCsrf(route("submissions.approve", submission.id), {
            method: "POST",
            body: JSON.stringify({
                approval_note: data.approval_note || "",
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    // Check if response is HTML (error page)
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("text/html")) {
                        throw new Error(
                            `Server error: ${response.status} - Server mengembalikan halaman error`
                        );
                    }
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .catch((error) => {
                // Check if this is a JSON parsing error
                if (error.message.includes("Unexpected token")) {
                    throw new Error(
                        "Server mengembalikan HTML bukan JSON. Mungkin ada error di server."
                    );
                }

                throw error;
            })
            .then((responseData) => {
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
                        text:
                            responseData.message ||
                            "Gagal menyetujui pengajuan.",
                        confirmButtonText: "OK",
                    });
                }
            })
            .catch((error) => {
                hideLoading(false); // Hide loading animation on error
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text:
                        error.message ||
                        "Terjadi kesalahan jaringan. Silakan coba lagi.",
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

                fetchWithCsrf(route("submissions.reject", submission.id), {
                    method: "POST",
                    body: JSON.stringify({
                        approval_note: data.approval_note,
                    }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            // Check if response is HTML (error page)
                            const contentType =
                                response.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.includes("text/html")
                            ) {
                                throw new Error(
                                    `Server error: ${response.status} - Server mengembalikan halaman error`
                                );
                            }
                            throw new Error(`Server error: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((responseData) => {
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
                                text:
                                    responseData.message ||
                                    "Gagal menolak pengajuan.",
                                confirmButtonText: "OK",
                            });
                        }
                    })
                    .catch((error) => {
                        hideLoading(false); // Hide loading animation on error
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
        });
    };

    const handleDelete = () => {
        Swal.fire({
            title: "Yakin ingin menghapus?",
            text: "Pengajuan akan dihapus secara permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, hapus",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                fetchWithCsrf(route("submissions.destroy", submission.id), {
                    method: "DELETE",
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Gagal menghapus pengajuan");
                        }
                        return response.json();
                    })
                    .then(() => {
                        Swal.fire({
                            icon: "success",
                            title: "Dihapus!",
                            text: "Pengajuan berhasil dihapus.",
                            timer: 2000,
                            showConfirmButton: false,
                        }).then(() => {
                            window.location.href = route(
                                "submissions.forDivision"
                            );
                        });
                    })
                    .catch((error) => {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal!",
                            text: "Gagal menghapus pengajuan.",
                            confirmButtonText: "OK",
                        });
                    });
            }
        });
    };

    const handleRequestNext = () => {
        if (!canApprove) return handleNoAccess();

        Swal.fire({
            title: "Selesai review?",
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
                    },
                });

                fetchWithCsrf(route("submissions.requestNext", submission.id), {
                    method: "POST",
                    body: JSON.stringify({}),
                })
                    .then((response) => {
                        if (!response.ok) {
                            // Check if response is HTML (error page)
                            const contentType =
                                response.headers.get("content-type");
                            if (
                                contentType &&
                                contentType.includes("text/html")
                            ) {
                                throw new Error(
                                    `Server error: ${response.status} - Server mengembalikan halaman error`
                                );
                            }
                            throw new Error(`Server error: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((responseData) => {
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
                                text:
                                    responseData.message ||
                                    "Gagal meneruskan pengajuan.",
                                confirmButtonText: "OK",
                            });
                        }
                    })
                    .catch((error) => {
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
        });
    };

    const handleCancel = () => {
        const isOwner = auth?.user?.id === submission?.user_id;
        const status = String(submission.status || "").toLowerCase();
        const isApproved = status.includes("approved");
        const isCancelled = status === "cancelled";

        // Updated authorization logic to match dropdown
        const canCancel =
            !isCancelled &&
            isApproved &&
            (isOwner ||
                submission.approved_by === auth?.user?.id ||
                (submission.workflow_steps &&
                    submission.workflow_steps.some(
                        (step) =>
                            step.approver_id === auth?.user?.id &&
                            step.status === "approved"
                    )));

        if (!canCancel) {
            Swal.fire({
                icon: "error",
                title: "Akses Ditolak",
                text: "Anda tidak dapat membatalkan pengajuan ini.",
                confirmButtonText: "OK",
            });
            return;
        }

        if (!data.cancel_reason.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Alasan wajib diisi",
                text: "Tuliskan alasan pembatalan.",
                confirmButtonText: "OK",
            });
            return;
        }

        Swal.fire({
            title: "Yakin ingin membatalkan?",
            text: "Pengajuan akan dibatalkan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, batalkan",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Membatalkan pengajuan...");

                fetchWithCsrf(route("submissions.cancel", submission.id), {
                    method: "POST",
                    body: JSON.stringify({
                        cancel_reason: data.cancel_reason,
                    }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Gagal membatalkan pengajuan");
                        }
                        return response.json();
                    })
                    .then((responseData) => {
                        hideLoading(responseData.success);
                        if (responseData.success) {
                            setShowCancelModal(false);
                            reset();
                            Swal.fire({
                                icon: "success",
                                title: "Dibatalkan!",
                                text: "Pengajuan berhasil dibatalkan.",
                                timer: 2000,
                                showConfirmButton: false,
                            }).then(() => window.location.reload());
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Gagal!",
                                text:
                                    responseData.message ||
                                    "Gagal membatalkan pengajuan.",
                                confirmButtonText: "OK",
                            });
                        }
                    })
                    .catch((error) => {
                        hideLoading(false);
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
        });
    };

    const handleAmend = () => {
        const isOwner = auth?.user?.id === submission?.user_id;
        const status = String(submission.status || "").toLowerCase();
        const isCancelled = status === "cancelled";
        const isRejected = status.includes("rejected");

        const canAmend = isOwner && (isCancelled || isRejected);

        if (!canAmend) {
            Swal.fire({
                icon: "error",
                title: "Akses Ditolak",
                text: "Anda tidak dapat merevisi pengajuan ini.",
                confirmButtonText: "OK",
            });
            return;
        }

        if (!data.amend_reason.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Alasan revisi wajib diisi",
                text: "Tuliskan alasan revisi pengajuan.",
                confirmButtonText: "OK",
            });
            return;
        }

        Swal.fire({
            title: "Buat pengajuan revisi?",
            text: "Pengajuan baru akan dibuat dengan data yang sama namun dapat diedit.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, buat revisi",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Membuat pengajuan revisi...");

                fetchWithCsrf(route("submissions.amend", submission.id), {
                    method: "POST",
                    body: JSON.stringify({
                        amend_reason: data.amend_reason,
                    }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Gagal membuat pengajuan revisi");
                        }
                        return response.json();
                    })
                    .then((responseData) => {
                        hideLoading(responseData.success);
                        if (responseData.success) {
                            setShowAmendModal(false);
                            reset();
                            Swal.fire({
                                icon: "success",
                                title: "Berhasil!",
                                text: "Pengajuan revisi berhasil dibuat.",
                                timer: 2000,
                                showConfirmButton: false,
                            }).then(() => {
                                window.location.href =
                                    responseData.redirect_url;
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Gagal!",
                                text:
                                    responseData.message ||
                                    "Gagal membuat pengajuan revisi.",
                                confirmButtonText: "OK",
                            });
                        }
                    })
                    .catch((error) => {
                        hideLoading(false);
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
        });
    };

    const statusColor =
        submission.status === "Approved by Direktur"
            ? " text-green-700"
            : submission.status === "rejected"
            ? " text-rose-700"
            : submission.status === "cancelled"
            ? " text-gray-600"
            : " text-amber-500";

    const dataMap = useMemo(() => {
        const data = submission?.data_json || {};
        if (data.tableData) {
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

    // Check if submission has external uploaded document
    const hasExternalDocument =
        !!submission?.file_path && !submission?.generated_pdf_path;

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
        return {
            note: last.note,
            approved_at: last.approved_at,
            approver: last.approver,
        };
    }, [workflowSteps]);

    // Ambil informasi approval/reject terakhir dengan timestamp
    const finalApprovalInfo = useMemo(() => {
        if (!Array.isArray(workflowSteps)) return null;

        // Cari step yang sudah approved atau rejected
        const completedSteps = workflowSteps.filter((ws) => {
            const status = String(ws.status || "").toLowerCase();
            return status === "approved" || status === "rejected";
        });

        if (completedSteps.length === 0) return null;

        // Urutkan berdasarkan waktu terakhir
        completedSteps.sort((a, b) => {
            const ta = new Date(a.approved_at || a.updated_at || 0).getTime();
            const tb = new Date(b.approved_at || b.updated_at || 0).getTime();
            return tb - ta;
        });

        const latest = completedSteps[0];
        return {
            status: latest.status,
            approved_at: latest.approved_at,
            approver: latest.approver,
            division: latest.division,
        };
    }, [workflowSteps]);

    // Logic untuk riwayat approval per step
    const approvalHistory = useMemo(() => {
        if (!Array.isArray(workflowSteps)) return [];

        return workflowSteps
            .filter((step) => {
                const status = String(step.status || "").toLowerCase();
                return status === "approved" || status === "rejected";
            })
            .map((step) => ({
                step_order: step.step_order,
                division: step.division,
                status: step.status,
                approver: step.approver,
                approved_at: step.approved_at,
                note: step.note,
                action_type: step.action_type,
            }))
            .sort((a, b) => a.step_order - b.step_order);
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
                                                        if (raw === "cancelled")
                                                            return "• cancelled";
                                                        return `• Waiting confirmation${
                                                            who
                                                                ? ` to ${who}`
                                                                : ""
                                                        }`;
                                                    })()}
                                                </span>
                                                {/* {isApprovedFinal && (
                                                    <span
                                                        style={{
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                        className="ml-2 text-[11px]  px-2 py-0.5 bg-gray-100 text-gray-700"
                                                        title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                    >
                                                        Final
                                                    </span>
                                                )} */}
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
                                    <p className="sm:text-sm text-xs text-muted-foreground">
                                        <span className="font-semibold">
                                            Tanggal:
                                        </span>{" "}
                                        {new Date(
                                            submission.created_at
                                        ).toLocaleString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
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
                                    {submission.cancel_reason && (
                                        <div className="text-sm mt-1 rounded-md border border-orange-200 bg-orange-50 text-orange-800 px-3 py-2">
                                            <span className="font-semibold">
                                                Alasan Pembatalan:
                                            </span>{" "}
                                            {submission.cancel_reason}
                                        </div>
                                    )}
                                    {submission.amend_reason && (
                                        <div className="text-sm mt-1 rounded-md border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2">
                                            <span className="font-semibold">
                                                Alasan Revisi:
                                            </span>{" "}
                                            {submission.amend_reason}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {isApprovedFinal &&
                                    submission.file_path &&
                                    hasExternalDocument ? (
                                        <button
                                            onClick={handleDownload}
                                            className="inline-flex items-center justify-center mb-2 py-1 px-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
                                            title="Unduh dokumen final yang sudah distempel"
                                        >
                                            <Download className="mr-2 h-4 w-4" />{" "}
                                            Unduh Dokumen
                                        </button>
                                    ) : hasExternalDocument ? (
                                        <span
                                            style={{ borderRadius: "10px" }}
                                            className="mb-2 inline-flex items-center max-w-40 px-2 py-1 text-[11px] bg-slate-100 text-slate-600 border border-slate-200"
                                            title="Unduh tersedia setelah pengajuan disetujui di tahap terakhir"
                                        >
                                            Unduh tersedia setelah finalisasi
                                        </span>
                                    ) : null}

                                    {isApprovedFinal ? (
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
                                    )}

                                    {(submission.status === "pending" ||
                                        submission.status
                                            ?.toLowerCase()
                                            .includes("waiting")) &&
                                        currentSubmissionStep?.status ===
                                            "pending" &&
                                        canApprove &&
                                        Array.isArray(actions) &&
                                        actions.length > 0 && (
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
                                                    {actions.map(
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
                                                                    "reviewed"
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
                                                                        ✔️
                                                                        Reviewed
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
                                                            return null;
                                                        }
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    {/* Edit/Delete Dropdown */}
                                    {(() => {
                                        const status = String(
                                            submission.status || ""
                                        ).toLowerCase();
                                        const isApproved =
                                            status.includes("approved");
                                        const isRejected =
                                            status.includes("rejected");
                                        const isCancelled =
                                            status === "cancelled";

                                        const isOwner =
                                            auth?.user?.id ===
                                            submission?.user_id;
                                        const sameDivision =
                                            userDivisionId &&
                                            submission?.division_id ===
                                                userDivisionId;
                                        const canEditGlobal =
                                            !!permissionForMe?.can_edit;
                                        const canDeleteGlobal =
                                            !!permissionForMe?.can_delete;

                                        const showEdit =
                                            !isApproved &&
                                            !isRejected &&
                                            !isCancelled &&
                                            (isOwner ||
                                                (sameDivision &&
                                                    canEditGlobal));
                                        const showDelete =
                                            !isApproved &&
                                            !isRejected &&
                                            !isCancelled &&
                                            (isOwner ||
                                                (sameDivision &&
                                                    canDeleteGlobal));
                                        const showCancel =
                                            !isCancelled &&
                                            isApproved &&
                                            (isOwner ||
                                                submission.approved_by ===
                                                    auth?.user?.id ||
                                                (submission.workflow_steps &&
                                                    submission.workflow_steps.some(
                                                        (step) =>
                                                            step.approver_id ===
                                                                auth?.user
                                                                    ?.id &&
                                                            step.status ===
                                                                "approved"
                                                    )));

                                        const showAmend =
                                            (isCancelled || isRejected) &&
                                            isOwner;

                                        return (
                                            showEdit ||
                                            showDelete ||
                                            showCancel ||
                                            showAmend
                                        );
                                    })() && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full hover:bg-muted/60"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-36 shadow-lg border border-border/40"
                                            >
                                                {/* Edit */}
                                                {(() => {
                                                    const status = String(
                                                        submission.status || ""
                                                    ).toLowerCase();
                                                    const isApproved =
                                                        status.includes(
                                                            "approved"
                                                        );
                                                    const isRejected =
                                                        status.includes(
                                                            "rejected"
                                                        );

                                                    const isOwner =
                                                        auth?.user?.id ===
                                                        submission?.user_id;
                                                    const sameDivision =
                                                        userDivisionId &&
                                                        submission?.division_id ===
                                                            userDivisionId;
                                                    const canEditGlobal =
                                                        !!permissionForMe?.can_edit;

                                                    return (
                                                        !isApproved &&
                                                        !isRejected &&
                                                        (isOwner ||
                                                            (sameDivision &&
                                                                canEditGlobal))
                                                    );
                                                })() && (
                                                    <DropdownMenuItem asChild>
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

                                                {/* Cancel */}
                                                {(() => {
                                                    const status = String(
                                                        submission.status || ""
                                                    ).toLowerCase();
                                                    const isApproved =
                                                        status.includes(
                                                            "approved"
                                                        );
                                                    const isRejected =
                                                        status.includes(
                                                            "rejected"
                                                        );
                                                    const isCancelled =
                                                        status === "cancelled";

                                                    const isOwner =
                                                        auth?.user?.id ===
                                                        submission?.user_id;

                                                    return (
                                                        !isCancelled &&
                                                        isApproved &&
                                                        (isOwner ||
                                                            submission.approved_by ===
                                                                auth?.user
                                                                    ?.id ||
                                                            (submission.workflow_steps &&
                                                                submission.workflow_steps.some(
                                                                    (step) =>
                                                                        step.approver_id ===
                                                                            auth
                                                                                ?.user
                                                                                ?.id &&
                                                                        step.status ===
                                                                            "approved"
                                                                )))
                                                    );
                                                })() && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setShowCancelModal(
                                                                true
                                                            )
                                                        }
                                                        className="flex items-center gap-2 text-orange-600"
                                                    >
                                                        <X className="w-4 h-4" />{" "}
                                                        Cancel
                                                    </DropdownMenuItem>
                                                )}

                                                {/* Amend/Revise */}
                                                {(() => {
                                                    const status = String(
                                                        submission.status || ""
                                                    ).toLowerCase();
                                                    const isCancelled =
                                                        status === "cancelled";
                                                    const isRejected =
                                                        status.includes(
                                                            "rejected"
                                                        );

                                                    const isOwner =
                                                        auth?.user?.id ===
                                                        submission?.user_id;

                                                    return (
                                                        (isCancelled &&
                                                            isOwner) ||
                                                        (isRejected && isOwner)
                                                    );
                                                })() && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setShowAmendModal(
                                                                true
                                                            )
                                                        }
                                                        className="flex items-center gap-2 text-blue-600"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />{" "}
                                                        Revisi
                                                    </DropdownMenuItem>
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
                                                const type = String(
                                                    f.type || "text"
                                                ).toLowerCase();

                                                // Skip label type fields from showing as regular fields
                                                if (type === "label") {
                                                    return (
                                                        <div
                                                            key={f.id || f.name}
                                                            className="col-span-full"
                                                        >
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
                                                            borderRadius:
                                                                "15px",
                                                        }}
                                                        className="flex flex-col px-2 py-1 rounded-lg bg-muted/40 hover:bg-muted transition-colors border-b border-border/60"
                                                    >
                                                        <span className="text-xs text-muted-foreground tracking-wide">
                                                            {f.label}
                                                        </span>

                                                        <span className="font-medium text-sm leading-relaxed text-foreground">
                                                            {String(
                                                                dataMap?.[
                                                                    f.name
                                                                ] ?? "-"
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
                                                                                ""}
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
                                    <PdfViewer fileUrl={fileUrl}   />
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted-foreground">
                                            Tidak ada dokumen pendukung yang
                                            diunggah.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Riwayat pengajuan Per Step */}
                            {approvalHistory.length > 0 && (
                                <div className="mt-6 flex flex-col items-center">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">
                                        Riwayat Persetujuan
                                    </h4>
                                    <div className="flex gap-1">
                                        <div className="flex">
                                            <div
                                                style={{ borderRadius: "10px" }}
                                                className="text-xs  border border-blue-200 bg-blue-50 px-3 py-2"
                                            >
                                                <div className="flex items-center w-full">
                                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                                        Diajukan
                                                    </span>
                                                </div>
                                                {submission.user && (
                                                    <div className="mt-1 text-gray-600">
                                                        <span className="font-semibold">
                                                            Oleh:
                                                        </span>{" "}
                                                        {submission.user.name}
                                                    </div>
                                                )}
                                                {submission.created_at && (
                                                    <div className="mt-1 text-gray-600">
                                                        <span className="font-semibold">
                                                            Waktu:
                                                        </span>{" "}
                                                        {new Date(
                                                            submission.created_at
                                                        ).toLocaleString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {approvalHistory.map((step, index) => (
                                            <div
                                                key={index}
                                                style={{ borderRadius: "10px" }}
                                                className="text-xs border border-gray-200 bg-gray-50 px-3 py-2"
                                            >
                                                <div className="flex items-center w-full">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            step.status ===
                                                            "approved"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                    >
                                                        {step.status ===
                                                        "rejected"
                                                            ? "Ditolak"
                                                            : step.action_type ===
                                                              "request_next"
                                                            ? "Diketahui"
                                                            : step.action_type ===
                                                              "approve"
                                                            ? "Disetujui"
                                                            : "Disetujui"}
                                                    </span>
                                                </div>
                                                {step.approver && (
                                                    <div className="mt-1 text-gray-600">
                                                        <span className="font-semibold">
                                                            Oleh:
                                                        </span>{" "}
                                                        {step.approver.name}
                                                    </div>
                                                )}
                                                {step.approved_at && (
                                                    <div className="mt-1 text-gray-600">
                                                        <span className="font-semibold">
                                                            Waktu:
                                                        </span>{" "}
                                                        {new Date(
                                                            step.approved_at
                                                        ).toLocaleString(
                                                            "id-ID",
                                                            {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                                {step.note && (
                                                    <div className="mt-1 text-gray-600">
                                                        <span className="font-semibold">
                                                            Catatan:
                                                        </span>{" "}
                                                        {step.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
            {/* Modal Approve */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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

            {/* Modal Cancel */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            Batalkan Pengajuan
                        </h3>

                        <Textarea
                            placeholder="Tuliskan alasan pembatalan..."
                            value={data.cancel_reason}
                            onChange={(e) =>
                                setData("cancel_reason", e.target.value)
                            }
                            rows={3}
                            required
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                style={{ borderRadius: "15px" }}
                                variant="outline"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                style={{ borderRadius: "15px" }}
                                variant="destructive"
                                onClick={handleCancel}
                                disabled={processing}
                            >
                                Batalkan Pengajuan
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal Amend */}
            {showAmendModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-3">
                            Buat Pengajuan Revisi
                        </h3>

                        <Textarea
                            placeholder="Tuliskan alasan revisi..."
                            value={data.amend_reason}
                            onChange={(e) =>
                                setData("amend_reason", e.target.value)
                            }
                            rows={3}
                            required
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                style={{ borderRadius: "15px" }}
                                variant="outline"
                                onClick={() => setShowAmendModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                style={{ borderRadius: "15px" }}
                                onClick={handleAmend}
                                disabled={processing}
                            >
                                Buat Revisi
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
            <OptimizedDownloadLoading
                show={showDownloadLoading}
                realProgress={downloadProgress}
            />
        </AuthenticatedLayout>
    );
}

// Hidden iframe used for printing the server-rendered print view without opening a new tab
// Placed outside to avoid layout shifts
