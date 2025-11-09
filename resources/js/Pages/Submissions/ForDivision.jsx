import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import Header from "@/Components/Header";

export default function ForDivision({ auth, submissions }) {
    const [filter, setFilter] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);
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
                <Header />
                <div className="py-12 w-full overflow-auto px-5">
                    <div className="mx-auto sm:px-6 lg:px-8">
                        <div className="bg-card shadow-sm sm:rounded-lg ">
                            <div className="p-6 text-card-foreground">
                                <span className="block   text-lg font-bold tracking-wider">
                                    Lihat list pengajuan
                                </span>{" "}
                                <div>
                                    <Input
                                        type="text"
                                        className="border w-50 h-7 mt-3  border-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        style={{ borderRadius: "10px" }}
                                        placeholder="Search Dokumen..."
                                        value={filter}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                                {/* dropdown untuk filer */}
                                <Table className="mt-6">
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
                                                        className={`inline-flex min-w-[150px] items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        submission.created_at
                                                    ).toLocaleDateString(
                                                        "id-ID"
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Link
                                                            href={route(
                                                                "submissions.show",
                                                                submission.id
                                                            )}
                                                            className="text-primary hover:underline"
                                                        >
                                                            Review
                                                        </Link>

                                                        <>
                                                            {(auth?.user?.id === submission.user_id ||
                                                                submission?.permission_for_me?.can_edit) && (
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
                                                                            >
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="secondary"
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                            </Link>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Edit
                                                                            pengajuan
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {(auth?.user?.id === submission.user_id ||
                                                                submission?.permission_for_me?.can_delete) && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setToDeleteId(
                                                                                submission.id
                                                                            );
                                                                            setConfirmOpen(
                                                                                true
                                                                            );
                                                                        }}
                                                                    >
                                                                        Hapus
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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
