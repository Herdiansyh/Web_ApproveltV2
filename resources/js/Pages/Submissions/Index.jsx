import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Eye, MoreVertical, Pencil, Trash2, Search } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Index({ auth, submissions }) {
    const [filter, setFilter] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    const handleFilterChange = (e) => setFilter(e.target.value);

    const filteredSubmissions = submissions.data.filter((s) =>
        s.title.toLowerCase().includes(filter.toLowerCase())
    );
    console.log(submissions);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    Daftar Pengajuan
                </h2>
            }
        >
            <Head title="Submissions" />
            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
                <Header />
                <div className="w-full p-8">
                    <div className="max-w-6xl mx-auto bg-card shadow-sm rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                            <div className="relative w-full md:w-1/3">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    style={{ borderRadius: "15px" }}
                                    placeholder="Cari dokumen..."
                                    value={filter}
                                    onChange={handleFilterChange}
                                    className="pl-9 focus:ring-primary/60 focus:border-primary text-xs sm:text-sm"
                                />
                            </div>
                            <div className="w-full md:w-1/6">
                                {auth.user.role === "employee" && (
                                    <Link href={route("submissions.create")}>
                                        <Button
                                            style={{
                                                borderRadius: "15px",
                                            }}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm sm:text-xs text-xs font-semibold transition-all"
                                        >
                                            + Buat Pengajuan
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div
                            style={{ borderRadius: "15px" }}
                            className="overflow-x-auto  border border-border/30"
                        >
                            <table className="min-w-full md:text-sm text-xs">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground uppercase text-xs tracking-wider">
                                        <th className="py-3 px-6 text-left">
                                            Judul
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Jenis Dokumen
                                        </th>
                                        {auth.user.role === "manager" && (
                                            <th className="py-3 px-6 text-left">
                                                Diajukan Oleh
                                            </th>
                                        )}
                                        <th className="py-3 px-6 text-left">
                                            Status
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tanggal
                                        </th>
                                        <th className="py-3 px-6 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredSubmissions.map((submission) => (
                                        <tr
                                            key={submission.id}
                                            className="hover:bg-muted/20 transition-all duration-150"
                                        >
                                            <td className="py-3 px-6 font-medium">
                                                {submission.title}
                                            </td>
                                            <td className="py-3 px-6">
                                                {submission.workflow?.document
                                                    ?.name || "-"}
                                            </td>
                                            {auth.user.role === "manager" && (
                                                <td className="py-3 px-6">
                                                    {submission.user.name}
                                                </td>
                                            )}
                                            <td className="py-3 px-6 flex">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-[0.8em] sm:text-xs font-medium ${
                                                        submission.status ===
                                                        "Approved by Direktur"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : submission.status ===
                                                              "rejected"
                                                            ? "bg-rose-100 text-rose-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {submission.status ===
                                                    "pending"
                                                        ? "Pending"
                                                        : submission.status ===
                                                          "Approved by Direktur"
                                                        ? "Approved"
                                                        : submission.status ===
                                                          "rejected"
                                                        ? "rejected"
                                                        : submission.status ||
                                                          "Waiting"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-muted-foreground">
                                                {new Date(
                                                    submission.created_at
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
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
                                                        <DropdownMenuItem
                                                            asChild
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "submissions.show",
                                                                    submission.id
                                                                )}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Eye className="w-4 h-4" />{" "}
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        {(auth.user.id ===
                                                            submission.user_id ||
                                                            submission
                                                                .permission_for_me
                                                                ?.can_edit) && (
                                                            <DropdownMenuItem
                                                                asChild
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

                                                        {(auth.user.id ===
                                                            submission.user_id ||
                                                            submission
                                                                .permission_for_me
                                                                ?.can_delete) && (
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
                                            </td>
                                        </tr>
                                    ))}
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
                                    router.delete(
                                        route(
                                            "submissions.destroy",
                                            toDeleteId
                                        ),
                                        {
                                            onFinish: () => {
                                                setConfirmOpen(false);
                                                setToDeleteId(null);
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
        </AuthenticatedLayout>
    );
}
