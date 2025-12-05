import React, { useState, useMemo, useEffect } from "react";
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
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";
import DateFilter from "@/Components/DateFilter";
import { isWithinInterval, parseISO, format } from "date-fns";

export default function Index({ auth, submissions, userDivision }) {
    const [filter, setFilter] = useState("");
    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null,
        mode: null,
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    // Initialize filter state from URL params on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchFilter = urlParams.get('search');
        const startDate = urlParams.get('start_date');
        const endDate = urlParams.get('end_date');
        
        if (searchFilter) {
            setFilter(searchFilter);
        }
        
        if (startDate || endDate) {
            setDateFilter({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                mode: startDate && endDate ? "range" : startDate ? "single" : null,
            });
        }
    }, []);

    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilter(newFilter);
        updateURLWithFilters(newFilter, dateFilter);
    };

    const handleDateFilterChange = (filterData) => {
        setDateFilter(filterData);
        updateURLWithFilters(filter, filterData);
    };

    const updateURLWithFilters = (searchFilter, dateFilterData) => {
        const params = new URLSearchParams();
        
        if (searchFilter) {
            params.set('search', searchFilter);
        }
        
        if (dateFilterData.startDate) {
            params.set('start_date', format(dateFilterData.startDate, 'yyyy-MM-dd'));
        }
        
        if (dateFilterData.endDate) {
            params.set('end_date', format(dateFilterData.endDate, 'yyyy-MM-dd'));
        }
        
        const queryString = params.toString();
        const newPath = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        
        router.get(newPath, {}, { preserveState: true, preserveScroll: true });
    };

    const clearAllFilters = () => {
        setFilter("");
        setDateFilter({
            startDate: null,
            endDate: null,
            mode: null,
        });
        router.get(window.location.pathname, {}, { preserveState: true, preserveScroll: true });
    };

    const filteredSubmissions = useMemo(() => {
        // If we have server-side filtered data, use it directly
        if (submissions.data && submissions.data.length > 0) {
            return submissions.data;
        }
        
        // Fallback to client-side filtering for backward compatibility
        let result = submissions.data ? submissions.data.filter((s) =>
            s.title.toLowerCase().includes(filter.toLowerCase())
        ) : [];

        // Apply date filter
        if (dateFilter.mode === "single" && dateFilter.startDate) {
            result = result.filter((s) => {
                const createdDate = parseISO(s.created_at);
                const filterDate = new Date(dateFilter.startDate);
                filterDate.setHours(0, 0, 0, 0);
                createdDate.setHours(0, 0, 0, 0);
                return createdDate.getTime() === filterDate.getTime();
            });
        } else if (dateFilter.mode === "range" && dateFilter.startDate && dateFilter.endDate) {
            result = result.filter((s) => {
                const createdDate = parseISO(s.created_at);
                const start = new Date(dateFilter.startDate);
                const end = new Date(dateFilter.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return createdDate >= start && createdDate <= end;
            });
        }

        return result;
    }, [filter, dateFilter, submissions.data]);

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
                    <div className=" mx-auto bg-card shadow-sm rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 mb-6">
                            <h1 className="md:text-2xl text-sm font-semibold text-gray-800">
                                📁 Daftar Pengajuan Selesai
                            </h1>
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                                <div className="relative flex-1">
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
                                <DateFilter
                                    onFilterChange={handleDateFilterChange}
                                    placeholder="Pilih tanggal..."
                                    label="Filter Tanggal"
                                />
                                <div className="w-full md:w-1/6">
                                    {auth.user.role === "employee" && (
                                        <Link href={route("submissions.create")}>
                                            <Button
                                                style={{
                                                    borderRadius: "15px",
                                                }}
                                                className="w-full bg-primary tracking-wide hover:bg-primary/90 text-primary-foreground shadow-sm sm:text-xs text-xs font-semibold transition-all"
                                            >
                                                + Buat Pengajuan
                                            </Button>
                                        </Link>
                                    )}
                                </div>
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
                                            Judul / Deskripsi
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Series
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
                                            Tanggal Dibuat
                                        </th>
                                        {!String(
                                            submissions.data?.[0]?.status || ""
                                        )
                                            .toLowerCase()
                                            .includes("approved") &&
                                            !String(
                                                submissions.data?.[0]?.status ||
                                                    ""
                                            )
                                                .toLowerCase()
                                                .includes("rejected") && (
                                                <th className="py-3 px-6 text-center">
                                                    Aksi
                                                </th>
                                            )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredSubmissions.map((submission) => (
                                        <tr
                                            onClick={() =>
                                                router.visit(
                                                    route(
                                                        "submissions.show",
                                                        submission.id
                                                    )
                                                )
                                            }
                                            className="hover:bg-gray-100 cursor-pointer hover:bg-muted/30 transition"
                                            key={submission.id}
                                        >
                                            <td className="py-2 px-6">
                                                <div className="font-medium hover:underline">
                                                    {submission.title}
                                                </div>
                                                {submission.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                        {submission.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 px-6 text-xs text-muted-foreground font-mono">
                                                {submission.series_code || "-"}
                                            </td>
                                            <td className="py-2 px-6 hover:underline">
                                                {submission.workflow?.document
                                                    ?.name || "-"}
                                            </td>
                                            {auth.user.role === "manager" && (
                                                <td className="py-2 px-6 hover:underline">
                                                    {submission.user.name}
                                                </td>
                                            )}
                                            <td className="py-2 px-6 flex ">
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
                                                    {(() => {
                                                        const raw = String(
                                                            submission.status ||
                                                                ""
                                                        ).toLowerCase();
                                                        const step =
                                                            submission.current_workflow_step ||
                                                            null;
                                                        const who =
                                                            step?.division
                                                                ?.name ||
                                                            step?.role ||
                                                            null;
                                                        if (
                                                            raw === "pending" ||
                                                            raw.includes(
                                                                "waiting"
                                                            )
                                                        ) {
                                                            return `Waiting confirmation${
                                                                who
                                                                    ? ` to ${who}`
                                                                    : ""
                                                            }`;
                                                        }
                                                        if (
                                                            raw.includes(
                                                                "approved"
                                                            )
                                                        )
                                                            return "Approved";
                                                        if (
                                                            raw.includes(
                                                                "rejected"
                                                            ) ||
                                                            raw === "rejected"
                                                        )
                                                            return "Rejected";
                                                        return (
                                                            submission.status ||
                                                            "Waiting"
                                                        );
                                                    })()}
                                                </span>

                                                {String(submission.status)
                                                    .toLowerCase()
                                                    .includes("approved") && (
                                                    <span
                                                        className="ml-2 text-[11px] rounded px-2 py-0.5 bg-gray-100 text-gray-700"
                                                        title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                    >
                                                        Final
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-6 text-muted-foreground">
                                                {new Date(
                                                    submission.created_at
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            {!String(submission.status)
                                                .toLowerCase()
                                                .includes("approved") &&
                                                !String(submission.status)
                                                    .toLowerCase()
                                                    .includes("rejected") && (
                                                    <td
                                                        className="py-2 px-6 text-center"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="rounded-full hover:bg-muted/60"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-36 shadow-lg border border-border/40"
                                                            >
                                                                {(() => {
                                                                    const status =
                                                                        String(
                                                                            submission.status
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
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;
                                                                    const sameDivision =
                                                                        userDivision?.id &&
                                                                        submission.division_id ===
                                                                            userDivision.id;
                                                                    const canEditGlobal =
                                                                        !!submission
                                                                            .permission_for_me
                                                                            ?.can_edit;

                                                                    const showEdit =
                                                                        !isApproved &&
                                                                        !isRejected &&
                                                                        (isOwner ||
                                                                            (sameDivision &&
                                                                                canEditGlobal));

                                                                    return showEdit;
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        asChild
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
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

                                                                {(() => {
                                                                    const status =
                                                                        String(
                                                                            submission.status
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
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;
                                                                    const sameDivision =
                                                                        userDivision?.id &&
                                                                        submission.division_id ===
                                                                            userDivision.id;
                                                                    const canDeleteGlobal =
                                                                        !!submission
                                                                            .permission_for_me
                                                                            ?.can_delete;

                                                                    const showDelete =
                                                                        !isApproved &&
                                                                        !isRejected &&
                                                                        (isOwner ||
                                                                            (sameDivision &&
                                                                                canDeleteGlobal));

                                                                    return showDelete;
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
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
                                                )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex flex-wrap gap-1 text-sm">
                                {submissions.links?.map((link, index) => {
                                    // Add filter parameters to pagination links
                                    const url = new URL(link.url || "#", window.location.origin);
                                    if (filter) {
                                        url.searchParams.set('search', filter);
                                    }
                                    if (dateFilter.startDate) {
                                        url.searchParams.set('start_date', format(dateFilter.startDate, 'yyyy-MM-dd'));
                                    }
                                    if (dateFilter.endDate) {
                                        url.searchParams.set('end_date', format(dateFilter.endDate, 'yyyy-MM-dd'));
                                    }
                                    
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url ? url.pathname + url.search : "#"}
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
                                    );
                                })}
                            </div>
                            
                            {(filter || dateFilter.startDate) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                    className="text-xs"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent style={{ borderRadius: "15px" }}>
                    <DialogHeader>
                        <DialogTitle>Hapus Pengajuan?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="space-x-2 flex gap-2">
                        <Button
                            onClick={() => setConfirmOpen(false)}
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
                        >
                            Batal
                        </Button>
                        <Button
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
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
