import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import Sidebar from "@/Components/Sidebar";
import { TooltipProvider } from "@/Components/ui/tooltip";
import { Input } from "@/Components/ui/input";

export default function Index({ auth, submissions }) {
    const [Filter, setFilter] = useState("");
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
                    <Sidebar />
                </TooltipProvider>
                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto sm:px-6 px-8 lg:px-8 overflow-x-auto">
                        <div className="bg-card text-card-foreground overflow-hidden shadow-md sm:rounded-lg">
                            <div className="p-6">
                                <span className="text-lg font-bold tracking-wider">
                                    Buat pengajuan baru
                                </span>

                                {auth.user.role === "employee" && (
                                    <div className="mb-6 flex justify-between gap-2 mt-5 ">
                                        {" "}
                                        <div className="flex gap-2">
                                            <Input
                                                style={{ borderRadius: "10px" }}
                                                className="border w-50 h-7 border-gray-600"
                                                placeholder="Search Document..."
                                                value={Filter}
                                                onChange={handleFilterChange}
                                            />
                                            <select
                                                className="border w-20 h-7  border-gray-600 rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                                style={{
                                                    borderRadius: "10px",
                                                    fontSize: "0.75rem",
                                                }}
                                            >
                                                {submissions.data.map(
                                                    (submission, index) => (
                                                        <option key={index}>
                                                            {
                                                                submission
                                                                    .workflow
                                                                    ?.document
                                                                    ?.name
                                                            }
                                                        </option>
                                                    )
                                                )}

                                                {/* Add more options as needed */}
                                            </select>
                                        </div>
                                        <Link
                                            href={route("submissions.create")}
                                        >
                                            <PrimaryButton
                                                style={{ borderRadius: "15px" }}
                                                className="bg-primary !text-[0.6rem] text-primary-foreground hover:bg-primary/90"
                                            >
                                                Buat Pengajuan Baru
                                            </PrimaryButton>
                                        </Link>
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
                                                                        submission.status?.toLowerCase().includes("approved") ||
                                                                        submission.status === "approved"
                                                                            ? "bg-green-100 text-green-800"
                                                                            : submission.status?.toLowerCase() === "rejected" ||
                                                                              submission.status === "rejected"
                                                                            ? "bg-destructive text-destructive-foreground"
                                                                            : "bg-yellow-100 text-yellow-800"
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
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                {new Date(
                                                                    submission.created_at
                                                                ).toLocaleDateString(
                                                                    "id-ID"
                                                                )}
                                                            </td>

                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex justify-center space-x-2">
                                                                    <Link
                                                                        href={route(
                                                                            "submissions.show",
                                                                            submission.id
                                                                        )}
                                                                        className="text-primary hover:text-primary/90"
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
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex justify-start">
                                    {submissions.links?.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 mx-1 rounded ${
                                                link.active
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:text-primary"
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
