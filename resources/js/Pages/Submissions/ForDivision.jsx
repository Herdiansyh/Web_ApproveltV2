import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import Sidebar from "@/Components/Sidebar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";

export default function ForDivision({ auth, submissions }) {
    const [filter, setFilter] = useState("");
    //function to handle filter
    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        console.log(e.target.value);
    };

    // filtered submissions
    const SubmissionFilter = submissions.data.filter((submission) =>
        submission.title.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground leading-tight">
                    Pengajuan Masuk ke Divisi Saya
                </h2>
            }
        >
            <Head title="Pengajuan Masuk" />
            <div className="flex min-h-screen bg-background">
                <Sidebar />
                <div className="py-12 w-full overflow-auto">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        <div className="bg-card shadow-sm sm:rounded-lg">
                            <div className="p-6 text-card-foreground">
<<<<<<< HEAD
                                <Table>
=======
                                <span className="block   text-lg font-bold tracking-wider">
                                    Lihat list pengajuan
                                </span>{" "}
                                <Input
                                    type="text"
                                    className="border w-50 h-7 mt-3  border-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    style={{ borderRadius: "10px" }}
                                    placeholder="Search Dokumen..."
                                    value={filter}
                                    onChange={handleFilterChange}
                                />
                                {/* dropdown untuk filer */}
                                <Table className="mt-6">
>>>>>>> 0d737fc (tambah search dan filter)
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Judul</TableHead>
                                            <TableHead>Pengirim</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-center">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {SubmissionFilter.map((submission) => (
                                            <TableRow key={submission.id}>
                                                <TableCell>
                                                    {submission.title}
                                                </TableCell>
                                                <TableCell>
                                                    {submission.user.name}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            submission.status ===
                                                            "approved"
                                                                ? "bg-green-100 text-green-800"
                                                                : submission.status ===
                                                                  "rejected"
                                                                ? "bg-destructive text-destructive-foreground"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {submission.status ===
                                                        "pending"
                                                            ? "Menunggu Persetujuan"
                                                            : submission.status ===
                                                              "approved"
                                                            ? "Disetujui"
                                                            : "Ditolak"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        submission.created_at
                                                    ).toLocaleDateString(
                                                        "id-ID"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Link
                                                        href={route(
                                                            "submissions.show",
                                                            submission.id
                                                        )}
                                                        className="text-primary hover:underline"
                                                    >
                                                        Review
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="mt-6 flex flex-wrap items-center">
                                    {submissions.links &&
                                        submissions.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`px-3 py-1 mx-1 rounded ${
                                                    link.active
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-foreground hover:bg-muted hover:text-foreground"
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
