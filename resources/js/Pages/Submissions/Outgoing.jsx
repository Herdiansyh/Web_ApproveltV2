import React, { useState, useMemo, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import Swal from "sweetalert2";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import Header from "@/Components/Header";
import { fetchWithCsrf } from "@/utils/csrfToken";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";
import DateFilter from "@/Components/DateFilter";
import { isWithinInterval, parseISO } from "date-fns";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";

export default function Outgoing({
    auth,
    submissions,
    userDivision,
    // availablePrefixes = [],
}) {
    const [filter, setFilter] = useState("");
    // const [prefixFilter, setPrefixFilter] = useState("");
    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null,
        mode: null,
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState(null);

    // Advanced filter states
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [filters, setFilters] = useState([
        { id: 1, type: "", value: "", options: [] },
    ]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Check if any filters are active
    const hasActiveFilters = filters.some(
        (filter) => filter.type && filter.value
    );

    const handleFilterChange = (e) => setFilter(e.target.value);

    // Fetch filter options when filter type changes
    const handleFilterTypeChange = async (filterId, type) => {
        setFilters((prev) =>
            prev.map((filter) =>
                filter.id === filterId
                    ? { ...filter, type, value: "", options: [] }
                    : filter
            )
        );

        if (type) {
            setLoadingOptions(true);
            try {
                const response = await fetch(
                    `/filter/options?filter_type=${type}`
                );
                const data = await response.json();
                setFilters((prev) =>
                    prev.map((filter) =>
                        filter.id === filterId
                            ? { ...filter, options: data.options || [] }
                            : filter
                    )
                );
            } catch (error) {
                setFilters((prev) =>
                    prev.map((filter) =>
                        filter.id === filterId
                            ? { ...filter, options: [] }
                            : filter
                    )
                );
            } finally {
                setLoadingOptions(false);
            }
        }
    };

    // Add new filter row
    const addFilter = () => {
        const newId = Math.max(...filters.map((f) => f.id), 0) + 1;
        setFilters((prev) => [
            ...prev,
            { id: newId, type: "", value: "", options: [] },
        ]);
    };

    // Remove filter row
    const removeFilter = (filterId) => {
        if (filters.length > 1) {
            setFilters((prev) =>
                prev.filter((filter) => filter.id !== filterId)
            );
        }
    };

    // Update filter value
    const updateFilterValue = (filterId, value) => {
        setFilters((prev) =>
            prev.map((filter) =>
                filter.id === filterId ? { ...filter, value } : filter
            )
        );
    };

    // Apply all filters
    const handleAdvancedFilter = () => {
        const params = new URLSearchParams(window.location.search);

        // Clear existing advanced filters
        params.delete("doctype");
        params.delete("prefix");
        params.delete("division");

        // Apply all active filters
        filters.forEach((filter) => {
            if (filter.type && filter.value) {
                params.set(filter.type, filter.value);
            }
        });

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.get(newUrl, {}, { preserveState: true });
        setShowAdvancedFilter(false);
    };

    // Clear all filters
    const handleClearAdvancedFilter = () => {
        setFilters([{ id: 1, type: "", value: "", options: [] }]);

        const params = new URLSearchParams(window.location.search);
        params.delete("doctype");
        params.delete("prefix");
        params.delete("division");

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.get(newUrl, {}, { preserveState: true });
        setShowAdvancedFilter(false);
    };

    const handlePrefixFilterChange = (value) => {
        setPrefixFilter(value);
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set("prefix", value);
        } else {
            params.delete("prefix");
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.get(newUrl, {}, { preserveState: true });
    };

    const handleDateFilterChange = (filterData) => {
        setDateFilter(filterData);
    };

    // Initialize filters from URL parameters
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const prefixParam = params.get("prefix");
        const doctypeParam = params.get("doctype");
        const divisionParam = params.get("division");

        const initialFilters = [];
        let filterId = 1;

        if (prefixParam) {
            initialFilters.push({
                id: filterId++,
                type: "prefix",
                value: prefixParam,
                options: [],
            });
        }

        if (doctypeParam) {
            initialFilters.push({
                id: filterId++,
                type: "doctype",
                value: doctypeParam,
                options: [],
            });
        }

        if (divisionParam) {
            initialFilters.push({
                id: filterId++,
                type: "division",
                value: divisionParam,
                options: [],
            });
        }

        if (initialFilters.length > 0) {
            setFilters(initialFilters);
            // Fetch options for each filter type
            initialFilters.forEach((filter) => {
                handleFilterTypeChange(filter.id, filter.type);
            });
        }
    }, []);

    const filteredSubmissions = useMemo(() => {
        let result = submissions.data.filter((s) =>
            s.title.toLowerCase().includes(filter.toLowerCase())
        );

        // Apply date filter
        if (dateFilter.mode === "single" && dateFilter.startDate) {
            result = result.filter((s) => {
                const createdDate = new Date(s.created_at);
                const filterDate = new Date(dateFilter.startDate);
                return createdDate.toDateString() === filterDate.toDateString();
            });
        } else if (
            dateFilter.mode === "range" &&
            dateFilter.startDate &&
            dateFilter.endDate
        ) {
            result = result.filter((s) => {
                const createdDate = parseISO(s.created_at);
                return isWithinInterval(createdDate, {
                    start: dateFilter.startDate,
                    end: dateFilter.endDate,
                });
            });
        }

        return result;
    }, [filter, dateFilter, submissions.data]);

    // Helper function to check if user can see actions for a submission
    const canShowActions = (submission) => {
        const isApproved = String(submission.status)
            .toLowerCase()
            .includes("approved");
        const isOwner = auth.user.id === submission.user_id;
        const sameDivision =
            userDivision?.id && submission.division_id === userDivision.id;
        const canEditGlobal = !!submission.permission_for_me?.can_edit;
        const canDeleteGlobal = !!submission.permission_for_me?.can_delete;

        const showEdit =
            !isApproved && (isOwner || (sameDivision && canEditGlobal));
        const showDelete =
            !isApproved && (isOwner || (sameDivision && canDeleteGlobal));

        return showEdit || showDelete;
    };

    const hasAnyActions = filteredSubmissions.some((submission) =>
        canShowActions(submission)
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    📤 Pengajuan Keluar
                </h2>
            }
        >
            <Head title="Pengajuan Keluar" />
            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
                <Header />
                <div className="w-full p-8">
                    <div className=" mx-auto bg-card shadow-xl rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="text-lg text-center font-medium">
                                📤 Daftar Pengajuan Keluar
                            </div>
                            <div className="flex flex-col md:flex-row justify-between  md:items-center gap-3">
                                <div className="relative flex">
                                    <Search className="absolute left-3 top-2.5 w-3 h-3 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        style={{ borderRadius: "15px" }}
                                        placeholder="Cari dokumen..."
                                        value={filter}
                                        onChange={handleFilterChange}
                                        className="pl-9 focus:ring-primary/60 focus:border-primary bg-gray-100"
                                    />
                                </div>

                                {/* Advanced Filter Button */}
                                <div className="sm:flex gap-1 items-center  ">
                                    <DateFilter
                                        onFilterChange={handleDateFilterChange}
                                        placeholder="Pilih tanggal..."
                                        label="Filter Tanggal"
                                    />
                                    <Popover
                                        open={showAdvancedFilter}
                                        onOpenChange={setShowAdvancedFilter}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                style={{ borderRadius: "15px" }}
                                                className={`flex ${
                                                    hasActiveFilters
                                                        ? "bg-blue-100"
                                                        : ""
                                                }  items-center w-full sm:mt-0 mt-3 gap-2 text-xs sm:text-sm`}
                                            >
                                                <Filter className="w-4 h-4" />
                                                Filter
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="mr-5 w-[90vw] sm:w-[400px] md:w-[600px] p-4 max-h-[80vh] overflow-y-auto"
                                            align="start"
                                            sideOffset={8}
                                            style={{ borderRadius: "15px" }}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-medium">
                                                    Filter Lanjutan
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowAdvancedFilter(
                                                            false
                                                        )
                                                    }
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {filters.map(
                                                    (filter, index) => (
                                                        <div
                                                            key={filter.id}
                                                            className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end"
                                                        >
                                                            {/* Tipe Filter */}
                                                            <div>
                                                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                                                    Tipe Filter
                                                                </label>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full justify-between text-xs"
                                                                            style={{
                                                                                borderRadius:
                                                                                    "15px",
                                                                            }}
                                                                        >
                                                                            {filter.type ===
                                                                            "doctype"
                                                                                ? "Doctype"
                                                                                : filter.type ===
                                                                                  "prefix"
                                                                                ? "Prefix"
                                                                                : filter.type ===
                                                                                  "division"
                                                                                ? "Divisi"
                                                                                : "Pilih tipe"}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-44">
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleFilterTypeChange(
                                                                                    filter.id,
                                                                                    "doctype"
                                                                                )
                                                                            }
                                                                        >
                                                                            Doctype
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleFilterTypeChange(
                                                                                    filter.id,
                                                                                    "prefix"
                                                                                )
                                                                            }
                                                                        >
                                                                            Prefix
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleFilterTypeChange(
                                                                                    filter.id,
                                                                                    "division"
                                                                                )
                                                                            }
                                                                        >
                                                                            Divisi
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            {/* Nilai Filter */}
                                                            <div>
                                                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                                                    Nilai Filter
                                                                </label>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full justify-between overflow-hidden text-xs"
                                                                            disabled={
                                                                                !filter.type ||
                                                                                loadingOptions
                                                                            }
                                                                            style={{
                                                                                borderRadius:
                                                                                    "15px",
                                                                            }}
                                                                        >
                                                                            {loadingOptions
                                                                                ? "Loading..."
                                                                                : filter.value
                                                                                ? filter.options.find(
                                                                                      (
                                                                                          o
                                                                                      ) =>
                                                                                          o.value ===
                                                                                          filter.value
                                                                                  )
                                                                                      ?.label
                                                                                : "Pilih nilai"}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-52 max-h-40 overflow-y-auto">
                                                                        {filter.options.map(
                                                                            (
                                                                                option
                                                                            ) => (
                                                                                <DropdownMenuItem
                                                                                    key={
                                                                                        option.value
                                                                                    }
                                                                                    onClick={() =>
                                                                                        updateFilterValue(
                                                                                            filter.id,
                                                                                            option.value
                                                                                        )
                                                                                    }
                                                                                    className={
                                                                                        filter.value ===
                                                                                        option.value
                                                                                            ? "bg-accent"
                                                                                            : ""
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </DropdownMenuItem>
                                                                            )
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            {/* Remove Button */}
                                                            <div className="flex gap-1">
                                                                {filters.length >
                                                                    1 && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            removeFilter(
                                                                                filter.id
                                                                            )
                                                                        }
                                                                        className="px-2"
                                                                        style={{
                                                                            borderRadius:
                                                                                "15px",
                                                                        }}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>

                                            {/* Add Filter Button */}
                                            <div className="mt-3 w-full flex justify-end">
                                                <button
                                                    variant="outline"
                                                    onClick={addFilter}
                                                    className=" text-xs border border-gray-200 py-1 px-2 hover:bg-gray-200"
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                >
                                                    + Add Filter
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                                <Button
                                                    onClick={
                                                        handleAdvancedFilter
                                                    }
                                                    disabled={
                                                        !filters.some(
                                                            (f) =>
                                                                f.type &&
                                                                f.value
                                                        )
                                                    }
                                                    className="text-xs"
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                >
                                                    Apply Filter
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={
                                                        handleClearAdvancedFilter
                                                    }
                                                    className="text-sm"
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{ borderRadius: "15px" }}
                            className="overflow-x-auto border border-border/30"
                        >
                            <table className="min-w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground uppercase text-xs tracking-wider">
                                        <th className="py-3 px-6 text-left">
                                            Judul / Deskripsi
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Nomor Dokumen
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Pengirim
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Jenis Dokumen
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Status
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tanggal Diajukan
                                        </th>
                                        {hasAnyActions && (
                                            <th className="py-3 px-6 text-center">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredSubmissions.length > 0 ? (
                                        filteredSubmissions.map(
                                            (submission) => (
                                                <tr
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "submissions.show",
                                                                submission.id
                                                            )
                                                        )
                                                    }
                                                    className=" cursor-pointer hover:bg-gray-100 transition"
                                                    key={submission.id}
                                                >
                                                    <td className="py-3 px-6">
                                                        <div className="font-medium hover:underline">
                                                            {submission.title}
                                                        </div>
                                                        {submission.description && (
                                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                                {
                                                                    submission.description
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 text-xs text-muted-foreground font-mono">
                                                        {submission.series_code ||
                                                            "-"}
                                                    </td>
                                                    <td className="py-3 px-6 hover:underline">
                                                        {submission.user.name}
                                                    </td>
                                                    <td className="py-3 px-6 hover:underline">
                                                        {submission.workflow
                                                            ?.document?.name ||
                                                            "-"}
                                                    </td>
                                                    <td className="py-3 px-6 flex">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                String(
                                                                    submission.status ||
                                                                        ""
                                                                )
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        "approved"
                                                                    )
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : String(
                                                                          submission.status ||
                                                                              ""
                                                                      )
                                                                          .toLowerCase()
                                                                          .includes(
                                                                              "rejected"
                                                                          )
                                                                    ? "bg-rose-100 text-rose-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            }`}
                                                        >
                                                            {(() => {
                                                                const raw =
                                                                    String(
                                                                        submission.status ||
                                                                            ""
                                                                    ).toLowerCase();
                                                                const step =
                                                                    submission.current_workflow_step ||
                                                                    null;
                                                                const who =
                                                                    step
                                                                        ?.division
                                                                        ?.name ||
                                                                    step?.role ||
                                                                    null;
                                                                if (
                                                                    raw ===
                                                                        "pending" ||
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
                                                                    raw ===
                                                                        "approved" ||
                                                                    raw.includes(
                                                                        "approved"
                                                                    )
                                                                )
                                                                    return "Disetujui";
                                                                if (
                                                                    raw ===
                                                                        "rejected" ||
                                                                    raw.includes(
                                                                        "rejected"
                                                                    )
                                                                )
                                                                    return "Ditolak";
                                                                return (
                                                                    submission.status ||
                                                                    "Pending"
                                                                );
                                                            })()}
                                                        </span>
                                                        {String(
                                                            submission.status
                                                        )
                                                            .toLowerCase()
                                                            .includes(
                                                                "approved"
                                                            ) && (
                                                            <span
                                                                className="ml-2 text-[11px] rounded px-2 py-0.5 bg-gray-100 text-gray-700"
                                                                title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                            >
                                                                Final
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 text-muted-foreground">
                                                        {new Date(
                                                            submission.created_at
                                                        ).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                    {hasAnyActions && (
                                                        <td
                                                            className="py-3 px-6 text-center"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {canShowActions(
                                                                submission
                                                            ) ? (
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
                                                                            const isApproved =
                                                                                String(
                                                                                    submission.status
                                                                                )
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        "approved"
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
                                                                            const isApproved =
                                                                                String(
                                                                                    submission.status
                                                                                )
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        "approved"
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
                                                                                (isOwner ||
                                                                                    (sameDivision &&
                                                                                        canDeleteGlobal));
                                                                            return showDelete;
                                                                        })() && (
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
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={hasAnyActions ? 7 : 6}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Tidak ada pengajuan ditemukan 😕
                                            </td>
                                        </tr>
                                    )}
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
            <Separator className="my-10" />
            {/* Footer */}
            <Footer />
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
                                    // Show loading alert
                                    Swal.fire({
                                        title: "Menghapus...",
                                        text: "Sedang menghapus pengajuan.",
                                        allowOutsideClick: false,
                                        allowEscapeKey: false,
                                        didOpen: () => {
                                            Swal.showLoading();
                                        },
                                    });

                                    fetchWithCsrf(
                                        route(
                                            "submissions.destroy",
                                            toDeleteId
                                        ),
                                        {
                                            method: "DELETE",
                                            body: JSON.stringify({}),
                                        }
                                    )
                                        .then((response) => {
                                            if (!response.ok) {
                                                throw new Error(
                                                    `Server error: ${response.status}`
                                                );
                                            }
                                            return response.json();
                                        })
                                        .then((responseData) => {
                                            if (responseData.success) {
                                                setConfirmOpen(false);
                                                setToDeleteId(null);
                                                Swal.fire({
                                                    icon: "success",
                                                    title: "Dihapus!",
                                                    text: "Pengajuan berhasil dihapus.",
                                                    timer: 2000,
                                                    showConfirmButton: false,
                                                }).then(() =>
                                                    window.location.reload()
                                                );
                                            } else {
                                                Swal.fire({
                                                    icon: "error",
                                                    title: "Gagal!",
                                                    text:
                                                        responseData.message ||
                                                        "Gagal menghapus pengajuan.",
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
