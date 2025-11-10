import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import Sidebar from "@/Components/Sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import Header from "@/Components/Header";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";

export default function Index({ auth, submissions, templates = [] }) {
    const [Filter, setFilter] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);
    //function to handle filter
    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        console.log(e.target.value);
    };

    // filtered submissions
    const SubmissionFilter = submissions.data.filter((submission) =>
        submission.title.toLowerCase().includes(Filter.toLowerCase())
    );
    console.log(submissions);
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground leading-tight">
                    Submissions
                </h2>
            }
        >
            <Head title="Submissions" />
            <div className="flex min-h-screen bg-background text-foreground">
                <TooltipProvider>
                    <Header />
                </TooltipProvider>
                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto sm:px-6 px-8 lg:px-8 overflow-x-auto">
                        <div className="bg-card text-card-foreground overflow-hidden shadow-md sm:rounded-lg">
                            <div className="p-6">
                                <span className="text-lg font-bold tracking-wider">
                                    Buat pengajuan baru
                                </span>

                                {auth.user.role === "employee" && (
                                    <div className="mb-6 flex  justify-between gap-2 mt-5 ">
                                        {" "}
                                        <div className="sm:flex-row w-full md:justify-between  flex gap-2 flex-col">
                                            <div className="flex gap-2 flex-col md:flex-row">
                                                <Input
                                                    style={{
                                                        borderRadius: "10px",
                                                    }}
                                                    className="border w-50 h-7 border-gray-600"
                                                    placeholder="Search Document..."
                                                    value={Filter}
                                                    onChange={
                                                        handleFilterChange
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Link
                                                    href={route(
                                                        "submissions.create"
                                                    )}
                                                >
                                                    <PrimaryButton
                                                        style={{
                                                            borderRadius:
                                                                "15px",
                                                        }}
                                                        className="bg-primary !text-[0.5rem] md:text-sm text-primary-foreground hover:bg-primary/90"
                                                    >
                                                        Buat Pengajuan Baru
                                                    </PrimaryButton>
                                                </Link>
                                                {templates?.length > 0 && (
                                                    <span className="inline-block mt-2 md:mt-0 md:ml-2">
                                                        <PrimaryButton
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                            className="bg-secondary text-secondary-foreground !text-[0.5rem] md:text-sm hover:bg-secondary/90"
                                                            disabled={
                                                                !selectedTemplateId
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    selectedTemplateId
                                                                ) {
                                                                    router.visit(
                                                                        route(
                                                                            "submissions.createFromTemplate",
                                                                            selectedTemplateId
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Buat dari Template
                                                        </PrimaryButton>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted text-muted-foreground">
                                                <th className="px-6 py-3 text-left">
                                                    Judul
                                                </th>
                                                <th className="px-6 py-3 text-left">
                                                    Jenis Dokumen
                                                </th>
                                                {auth.user.role ===
                                                    "manager" && (
                                                    <th className="px-6 py-3 text-left">
                                                        Diajukan Oleh
                                                    </th>
                                                )}
                                                <th className="px-6 py-3 text-left">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left">
                                                    Tanggal
                                                </th>
                                                <th className="px-6 py-3 text-center">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-border">
                                            {SubmissionFilter.map(
                                                (submission) => {
                                                    const currentStep =
                                                        submission.workflowSteps?.find(
                                                            (s) =>
                                                                s.step_order ===
                                                                submission.current_step
                                                        );

                                                    return (
                                                        <tr
                                                            key={submission.id}
                                                            className={
                                                                submission.status ===
                                                                    "pending" &&
                                                                auth.user
                                                                    .role ===
                                                                    "manager"
                                                                    ? "bg-accent/20"
                                                                    : ""
                                                            }
                                                        >
                                                            <td className="px-6 py-4">
                                                                {
                                                                    submission.title
                                                                }
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                {submission
                                                                    .workflow
                                                                    ?.document
                                                                    ?.name ||
                                                                    "-"}
                                                            </td>

                                                            {auth.user.role ===
                                                                "manager" && (
                                                                <td className="px-6 py-4">
                                                                    {
                                                                        submission
                                                                            .user
                                                                            .name
                                                                    }
                                                                </td>
                                                            )}

                                                            <td className="px-6 py-4">
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        submission.status
                                                                            ?.toLowerCase()
                                                                            .includes(
                                                                                "approved"
                                                                            ) ||
                                                                        submission.status ===
                                                                            "approved"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : submission.status?.toLowerCase() ===
                                                                                  "rejected" ||
                                                                              submission.status ===
                                                                                  "rejected"
                                                                            ? "bg-destructive text-destructive-foreground"
                                                                            : "bg-yellow-100 text-yellow-800"
                                                                    }`}
                                                                >
                                                                    {submission.status ===
                                                                    "pending"
                                                                        ? "Menunggu Persetujuan"
                                                                        : submission.status
                                                                              ?.toLowerCase()
                                                                              .includes(
                                                                                  "approved"
                                                                              )
                                                                        ? submission.status
                                                                        : submission.status
                                                                              ?.toLowerCase()
                                                                              .includes(
                                                                                  "waiting"
                                                                              )
                                                                        ? submission.status
                                                                        : submission.status?.toLowerCase() ===
                                                                          "rejected"
                                                                        ? "Ditolak"
                                                                        : submission.status ||
                                                                          "Menunggu"}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                {new Date(
                                                                    submission.created_at
                                                                ).toLocaleDateString(
                                                                    "id-ID"
                                                                )}
                                                            </td>

                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    {/* Tombol Lihat / Review */}
                                                                    <Link
                                                                        href={route(
                                                                            "submissions.show",
                                                                            submission.id
                                                                        )}
                                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                                                            submission.status ===
                                                                                "pending" &&
                                                                            auth
                                                                                .user
                                                                                .role ===
                                                                                "manager"
                                                                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                        }`}
                                                                    >
                                                                        {submission.status ===
                                                                            "pending" &&
                                                                        auth
                                                                            .user
                                                                            .role ===
                                                                            "manager"
                                                                            ? "Review"
                                                                            : "Lihat"}
                                                                    </Link>

                                                                    {/* Tombol Edit */}
                                                                    {(auth?.user
                                                                        ?.id ===
                                                                        submission.user_id ||
                                                                        submission
                                                                            ?.permission_for_me
                                                                            ?.can_edit) && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Link
                                                                                        href={route(
                                                                                            "submissions.edit",
                                                                                            submission.id
                                                                                        )}
                                                                                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.97] transition-transform"
                                                                                    >
                                                                                        Edit
                                                                                    </Link>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    Edit
                                                                                    pengajuan
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}

                                                                    {/* Tombol Hapus */}
                                                                    {(auth?.user
                                                                        ?.id ===
                                                                        submission.user_id ||
                                                                        submission
                                                                            ?.permission_for_me
                                                                            ?.can_delete) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setToDeleteId(
                                                                                    submission.id
                                                                                );
                                                                                setConfirmOpen(
                                                                                    true
                                                                                );
                                                                            }}
                                                                            className="px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 active:scale-[0.97] transition-transform"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <Dialog
                                    open={confirmOpen}
                                    onOpenChange={setConfirmOpen}
                                >
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Hapus Pengajuan?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Tindakan ini tidak dapat
                                                dibatalkan.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    setConfirmOpen(false)
                                                }
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => {
                                                    if (toDeleteId) {
                                                        router.delete(
                                                            route(
                                                                "submissions.destroy",
                                                                toDeleteId
                                                            ),
                                                            {
                                                                onFinish:
                                                                    () => {
                                                                        setConfirmOpen(
                                                                            false
                                                                        );
                                                                        setToDeleteId(
                                                                            null
                                                                        );
                                                                    },
                                                            }
                                                        );
                                                    }
                                                }}
                                            >
                                                Hapus
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Pagination */}
                                <div className="mt-6 flex flex-wrap justify-start gap-1">
                                    {submissions.links?.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 rounded text-[0.6rem] sm:text-base transition-colors duration-150 ${
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
                </div>{" "}
            </div>
        </AuthenticatedLayout>
    );
}
