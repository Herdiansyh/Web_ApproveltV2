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
import Header from "@/Components/Header";

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
                            text:
                                errors?.message ||
                                "Terjadi kesalahan saat meneruskan pengajuan.",
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
                <Header />
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
                                                submission.status
                                                    ?.toLowerCase()
                                                    .includes("approved") ||
                                                submission.status === "approved"
                                                    ? "text-green-600"
                                                    : submission.status?.toLowerCase() ===
                                                          "rejected" ||
                                                      submission.status ===
                                                          "rejected"
                                                    ? "text-red-600"
                                                    : "text-yellow-600"
                                            }`}
                                        >
                                            {submission.status === "pending"
                                                ? "Menunggu Persetujuan"
                                                : submission.status
                                                      ?.toLowerCase()
                                                      .includes("approved")
                                                ? submission.status
                                                : submission.status
                                                      ?.toLowerCase()
                                                      .includes("waiting")
                                                ? submission.status
                                                : submission.status?.toLowerCase() ===
                                                  "rejected"
                                                ? "Ditolak"
                                                : submission.status ||
                                                  "Menunggu"}
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

                                <div className="flex flex-col gap-2 items-end">
                                    {/* Tombol Unduh Dokumen */}
                                    <a
                                        href={route(
                                            "submissions.download",
                                            submission.id
                                        )}
                                        className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm hover:shadow-md"
                                    >
                                        📄 Unduh Dokumen
                                    </a>

                                    {/* Tombol Preview Template */}
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
                                                className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition-all shadow-sm hover:shadow-md"
                                            >
                                                👁️ Preview Template
                                            </a>
                                        )}

                                    {/* Tombol Action */}
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
                                                    <Button className="inline-flex items-center justify-center gap-1 px-4 py-1.5 text-sm font-medium rounded-full bg-indigo-500 text-white hover:bg-indigo-600 active:scale-[0.97] transition-all shadow-sm hover:shadow-md">
                                                        ⚙️ Action
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            className="w-4 h-4 ml-1"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.184l3.71-3.954a.75.75 0 111.08 1.04l-4.25 4.53a.75.75 0 01-1.08 0l-4.25-4.53a.75.75 0 01.02-1.06z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-56"
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
                                                            ) {
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
                                                                        className="cursor-pointer hover:text-green-700 border-b border-gray-200"
                                                                    >
                                                                        ✅
                                                                        Approve
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
                                                                            setShowRejectModal(
                                                                                true
                                                                            )
                                                                        }
                                                                        className="cursor-pointer hover:text-red-700 border-b border-gray-200"
                                                                    >
                                                                        ❌
                                                                        Rejected
                                                                    </DropdownMenuItem>
                                                                );
                                                            }
                                                            if (
                                                                a.includes(
                                                                    "request"
                                                                ) ||
                                                                a.includes(
                                                                    "next"
                                                                )
                                                            ) {
                                                                return (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            index
                                                                        }
                                                                        onClick={
                                                                            handleRequestNext
                                                                        }
                                                                        className="cursor-pointer hover:text-blue-700 border-b border-gray-200"
                                                                    >
                                                                        🔁
                                                                        Request
                                                                        to next
                                                                    </DropdownMenuItem>
                                                                );
                                                            }
                                                            return null;
                                                        }
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                </div>
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
                </div>{" "}
            </div>
        </AuthenticatedLayout>
    );
}
