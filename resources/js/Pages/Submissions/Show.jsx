import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import Sidebar from "@/Components/Sidebar";
import Swal from "sweetalert2";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Show({
    auth,
    submission,
    fileUrl,
    canApprove = false,
    currentStep = null,
    currentSubmissionStep = null,
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
            text: "Anda tidak memiliki hak akses untuk melakukan tindakan ini.",
            confirmButtonText: "OK",
        });
    };
    console.log("=== DEBUG ACTIONS ===");
    console.log("currentStep:", currentStep);
    console.log("actions:", currentStep?.actions);
    console.log("actions type:", typeof currentStep?.actions);
    console.log("actions length:", currentStep?.actions?.length);
    console.log("====================");
    const handleApprove = () => {
        if (!canApprove) return handleNoAccess();
        post(route("submissions.approve", submission.id), {
            data: { approval_note: data.approval_note || "" },
            onSuccess: () => {
                setShowApproveModal(false);
                reset();
                Swal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Pengajuan telah disetujui.",
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
                title: "Perhatian",
                text: "Mohon berikan alasan penolakan",
                confirmButtonText: "OK",
            });
            return;
        }

        Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Dokumen akan ditolak!",
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
                            title: "Berhasil",
                            text: "Dokumen telah ditolak",
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
            title: "Konfirmasi",
            text: "Teruskan pengajuan ke langkah berikutnya?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, teruskan",
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
                    onError: (errors) => {
                        Swal.fire({
                            icon: "error",
                            title: "Gagal",
                            text: errors?.message || "Terjadi kesalahan saat meneruskan pengajuan.",
                            confirmButtonText: "OK",
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
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Detail Pengajuan
                </h2>
            }
        >
            <Head title="Detail Pengajuan" />
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="py-12 w-full">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Card className="p-6">
                            <div className="mb-6 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">
                                        {submission.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        <span className="font-bold">
                                            Diajukan oleh:
                                        </span>{" "}
                                        {submission.user.name} (
                                        {submission.user.division?.name ?? "-"})
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-bold">
                                            Status:
                                        </span>{" "}
                                        <span
                                            className={`font-semibold ${
                                                submission.status?.toLowerCase().includes("approved") ||
                                                submission.status === "approved"
                                                    ? "text-green-600"
                                                    : submission.status?.toLowerCase() === "rejected" ||
                                                      submission.status === "rejected"
                                                    ? "text-red-600"
                                                    : "text-yellow-600"
                                            }`}
                                        >
                                            {submission.status === "pending"
                                                ? "Menunggu Persetujuan"
                                                : submission.status?.toLowerCase().includes("approved")
                                                ? submission.status
                                                : submission.status?.toLowerCase().includes("waiting")
                                                ? submission.status
                                                : submission.status?.toLowerCase() === "rejected"
                                                ? "Ditolak"
                                                : submission.status || "Menunggu"}
                                        </span>
                                    </p>
                                    {submission.approval_note && (
                                        <p className="text-gray-600 mt-2">
                                            Catatan: {submission.approval_note}
                                        </p>
                                    )}
                                    {submission.description && (
                                        <p className="mt-4">
                                            <span className="font-bold text-gray-600">
                                                Deskripsi:{" "}
                                            </span>
                                            {submission.description}
                                        </p>
                                    )}
                                </div>

                                {((submission.status === "pending" ||
                                    submission.status?.toLowerCase().includes("waiting")) &&
                                    currentSubmissionStep?.status === "pending") && (
                                    <div className="flex flex-col gap-2 items-end">
                                        <PrimaryButton
                                            style={{ borderRadius: "15px" }}
                                            className="bg-primary !text-[0.6rem] text-primary-foreground hover:bg-primary/90"
                                            asChild
                                        >
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Unduh Dokumen
                                            </a>
                                        </PrimaryButton>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    className="max-w-20 h-6 tracking-wide bg-blue-500 text-white"
                                                    style={{
                                                        borderRadius: "5px",
                                                    }}
                                                >
                                                    Action
                                                    <div
                                                        style={{
                                                            rotate: "90deg",
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        <span>&lt;</span>
                                                        <span>&gt;</span>
                                                    </div>
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                align="end"
                                                className="w-52"
                                            >
                                                {(currentStep?.actions || [])
                                                    .length === 0 ? (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={
                                                                handleNoAccess
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            Tidak ada aksi
                                                            tersedia
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    currentStep.actions.map(
                                                        (action, index) => {
                                                            const a =
                                                                action.toLowerCase();
                                                            if (
                                                                a.includes(
                                                                    "approve"
                                                                )
                                                            ) {
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            canApprove
                                                                                ? setShowApproveModal(
                                                                                      true
                                                                                  )
                                                                                : handleNoAccess()
                                                                        }
                                                                        className="hover:text-green-700 cursor-pointer border-b border-gray-200"
                                                                    >
                                                                        Setujui
                                                                        Pengajuan
                                                                    </DropdownMenuItem>
                                                                );
                                                            }
                                                            if (
                                                                a.includes(
                                                                    "reject"
                                                                )
                                                            ) {
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            canApprove
                                                                                ? setShowRejectModal(
                                                                                      true
                                                                                  )
                                                                                : handleNoAccess()
                                                                        }
                                                                        className="hover:text-red-700 cursor-pointer border-b border-gray-200"
                                                                    >
                                                                        Tolak
                                                                        Pengajuan
                                                                    </DropdownMenuItem>
                                                                );
                                                            }
                                                            // Handle "Request To Next" or similar actions
                                                            if (
                                                                a.includes(
                                                                    "request"
                                                                ) ||
                                                                a.includes("next")
                                                            ) {
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={() =>
                                                                            canApprove
                                                                                ? handleRequestNext()
                                                                                : handleNoAccess()
                                                                        }
                                                                        className="hover:text-blue-700 cursor-pointer border-b border-gray-200"
                                                                    >
                                                                        Teruskan ke Langkah
                                                                        Berikutnya
                                                                    </DropdownMenuItem>
                                                                );
                                                            }
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={index}
                                                                    onClick={() =>
                                                                        handleNoAccess()
                                                                    }
                                                                    className="hover:text-gray-400 cursor-not-allowed border-b border-gray-200"
                                                                >
                                                                    {action} (Belum
                                                                    tersedia)
                                                                </DropdownMenuItem>
                                                            );
                                                        }
                                                    )
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>

                            {/* MODAL APPROVE */}
                            {showApproveModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                                    <Card className="w-full max-w-md p-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            Setujui Pengajuan
                                        </h3>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1">
                                                Catatan (Opsional)
                                            </label>
                                            <Textarea
                                                value={data.approval_note}
                                                onChange={(e) =>
                                                    setData(
                                                        "approval_note",
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowApproveModal(false)
                                                }
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

                            {/* MODAL REJECT */}
                            {showRejectModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                                    <Card className="w-full max-w-md p-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            Tolak Pengajuan
                                        </h3>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1">
                                                Alasan Penolakan
                                            </label>
                                            <Textarea
                                                value={data.approval_note}
                                                onChange={(e) =>
                                                    setData(
                                                        "approval_note",
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowRejectModal(false)
                                                }
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

                            {/* PDF VIEWER */}
                            <div className="mb-6">
                                <object
                                    data={fileUrl}
                                    type="application/pdf"
                                    className="w-full h-[600px]"
                                >
                                    <div className="text-center p-4">
                                        <p>
                                            Tidak dapat menampilkan dokumen
                                            secara langsung.
                                        </p>
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Buka Dokumen
                                        </a>
                                    </div>
                                </object>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
