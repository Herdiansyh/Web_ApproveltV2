import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Head, router, usePage, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/Components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Separator } from "@/Components/ui/separator";
// import { Badge } from "@/Components/ui/badge";
import {
    Search,
    Filter,
    Calendar,
    X,
    ChevronDown,
    MoreHorizontal,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Edit,
    Trash2,
    RotateCcw,
} from "lucide-react";
import { useForm } from "@inertiajs/react";
import { format, parseISO, isWithinInterval } from "date-fns";
// import { id } from "date-fns/locale";
import DateFilter from "@/Components/DateFilter";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { useDebounce } from "@/Hooks/useDebounce";

export default function Index({
    auth,
    submissions,
    userDivision,
    availablePrefixes = [],
}) {
    const [filter, setFilter] = useState("");
    // const [prefixFilter, setPrefixFilter] = useState("");
    const [dateFilter, setDateFilter] = useState({
        mode: "off",
        startDate: null,
        endDate: null,
    });
    const [toDeleteId, setToDeleteId] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    // const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAmendModal, setShowAmendModal] = useState(false);
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [filters, setFilters] = useState([
        { id: 1, type: "", value: "", options: [] },
    ]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Optimized: Debounce search filter to reduce re-renders
    const debouncedFilter = useDebounce(filter, 300);

    // Form for cancel/amend operations
    const { data, setData, post, processing, reset } = useForm({
        cancel_reason: "",
        amend_reason: "",
    });

    // Check if any filters are active
    const hasActiveFilters = filters.some(
        (filter) => filter.type && filter.value
    );

    const handleFilterChange = (e) => setFilter(e.target.value);

    // Fetch filter options when filter type changes
    const handleFilterTypeChange = useCallback(
        async (filterId, type, preserveValue = false) => {
            const currentFilter = filters.find((f) => f.id === filterId);
            const currentValue =
                preserveValue && currentFilter ? currentFilter.value : "";

            setFilters((prev) =>
                prev.map((filter) =>
                    filter.id === filterId
                        ? { ...filter, type, value: currentValue, options: [] }
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
        },
        [setFilters, setLoadingOptions]
    );

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
        params.delete("status");

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
        params.delete("status");

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.get(newUrl, {}, { preserveState: true });
        setShowAdvancedFilter(false);
    };

    const handleDateFilterChange = (filterData) => {
        setDateFilter(filterData);
    };

    // Initialize filters from URL parameters
    useEffect(() => {
        const initializeFilters = async () => {
            const params = new URLSearchParams(window.location.search);
            const prefixParam = params.get("prefix");
            const doctypeParam = params.get("doctype");
            const divisionParam = params.get("division");
            const statusParam = params.get("status");

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

            if (statusParam) {
                initialFilters.push({
                    id: filterId++,
                    type: "status",
                    value: statusParam,
                    options: [],
                });
            }

            if (initialFilters.length > 0) {
                setFilters(initialFilters);
                // Fetch options for each filter type and preserve values from URL
                for (const filter of initialFilters) {
                    // Local function to avoid dependency issues
                    const fetchOptions = async (
                        filterId,
                        type,
                        preserveValue = false
                    ) => {
                        const currentFilter = initialFilters.find(
                            (f) => f.id === filterId
                        );
                        const currentValue =
                            preserveValue && currentFilter
                                ? currentFilter.value
                                : "";

                        setFilters((prev) =>
                            prev.map((f) =>
                                f.id === filterId
                                    ? {
                                          ...f,
                                          type,
                                          value: currentValue,
                                          options: [],
                                      }
                                    : f
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
                                    prev.map((f) =>
                                        f.id === filterId
                                            ? {
                                                  ...f,
                                                  options: data.options || [],
                                              }
                                            : f
                                    )
                                );
                            } catch (error) {
                                setFilters((prev) =>
                                    prev.map((f) =>
                                        f.id === filterId
                                            ? { ...f, options: [] }
                                            : f
                                    )
                                );
                            } finally {
                                setLoadingOptions(false);
                            }
                        }
                    };

                    await fetchOptions(filter.id, filter.type, true);
                }
            }
        };

        initializeFilters();
    }, []);

    // Optimized: Use debounced filter in useMemo to reduce re-renders
    const filteredSubmissions = useMemo(() => {
        let result = submissions.data.filter((s) =>
            s.title.toLowerCase().includes(debouncedFilter.toLowerCase())
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
    }, [debouncedFilter, dateFilter, submissions.data]);

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
                    <div className=" mx-auto  bg-card shadow-xl rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 mb-6">
                            <h1 className="md:text-2xl text-sm font-semibold text-gray-800">
                                📁 Daftar Pengajuan Selesai
                            </h1>
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                                <div className="relative flex">
                                    <Search className="absolute left-3 top-2.5 w-3 h-3 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        style={{ borderRadius: "15px" }}
                                        placeholder="Cari dokumen..."
                                        value={filter}
                                        onChange={handleFilterChange}
                                        className="pl-9 focus:ring-primary/60 focus:border-primary text-xs sm:text-sm bg-gray-100"
                                    />
                                </div>

                                {/* Advanced Filter Button */}
                                <div className="sm:flex gap-2 justify-end ">
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
                                            className="w-[90vw] mr-5 sm:w-[400px] md:w-[600px] p-4 max-h-[80vh] overflow-y-auto"
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
                                                                                : filter.type ===
                                                                                  "status"
                                                                                ? "Status"
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
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleFilterTypeChange(
                                                                                    filter.id,
                                                                                    "status"
                                                                                )
                                                                            }
                                                                        >
                                                                            Status
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
                                                    className="text-xs"
                                                    style={{
                                                        borderRadius: "15px",
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <div className="w-full sm:mt-0 mt-3">
                                        {auth.user.role === "employee" && (
                                            <Link
                                                href={route(
                                                    "submissions.create"
                                                )}
                                            >
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
                                            Nomor dokumen
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
                                                        submission.status.includes(
                                                            "Approve"
                                                        )
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : submission.status.includes(
                                                                  "reject"
                                                              )
                                                            ? "bg-rose-100 text-rose-700"
                                                            : submission.status ===
                                                              "cancelled"
                                                            ? "bg-gray-100 text-gray-700"
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
                                                        if (raw === "cancelled")
                                                            return "Dibatalkan";
                                                        return `Waiting${
                                                            who
                                                                ? ` to ${who}`
                                                                : ""
                                                        }`;
                                                    })()}
                                                </span>

                                                {/* {String(submission.status)
                                                    .toLowerCase()
                                                    .includes("approved") && (
                                                    <span
                                                        className="ml-2 text-[11px] rounded px-2 py-0.5 bg-gray-100 text-gray-700"
                                                        title="Dokumen final – aksi edit/delete dinonaktifkan."
                                                    >
                                                        Final
                                                    </span>
                                                )} */}
                                            </td>
                                            <td className="py-2 px-6 text-muted-foreground">
                                                {new Date(
                                                    submission.created_at
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            {(!String(submission.status)
                                                .toLowerCase()
                                                .includes("approved") &&
                                                !String(submission.status)
                                                    .toLowerCase()
                                                    .includes("rejected")) ||
                                                (String(
                                                    submission.status
                                                ).toLowerCase() ===
                                                    "cancelled" && (
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
                                                                    const isCancelled =
                                                                        status ===
                                                                        "cancelled";

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
                                                                                auth
                                                                                    .user
                                                                                    .id ||
                                                                            (submission.workflow_steps &&
                                                                                submission.workflow_steps.some(
                                                                                    (
                                                                                        step
                                                                                    ) =>
                                                                                        step.approver_id ===
                                                                                            auth
                                                                                                .user
                                                                                                .id &&
                                                                                        step.status ===
                                                                                            "approved"
                                                                                )));
                                                                    const showAmend =
                                                                        (isCancelled ||
                                                                            isRejected) &&
                                                                        isOwner;

                                                                    return (
                                                                        showEdit ||
                                                                        showDelete ||
                                                                        showCancel ||
                                                                        showAmend
                                                                    );
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
                                                                    const isCancelled =
                                                                        status ===
                                                                        "cancelled";

                                                                    const isOwner =
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;

                                                                    return (
                                                                        !isCancelled &&
                                                                        isApproved &&
                                                                        (isOwner ||
                                                                            submission.approved_by ===
                                                                                auth
                                                                                    .user
                                                                                    .id ||
                                                                            (submission.workflow_steps &&
                                                                                submission.workflow_steps.some(
                                                                                    (
                                                                                        step
                                                                                    ) =>
                                                                                        step.approver_id ===
                                                                                            auth
                                                                                                .user
                                                                                                .id &&
                                                                                        step.status ===
                                                                                            "approved"
                                                                                )))
                                                                    );
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSubmission(
                                                                                submission
                                                                            );
                                                                            setShowCancelModal(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 text-orange-600"
                                                                    >
                                                                        <CancelIcon className="w-4 h-4" />{" "}
                                                                        Batalkan
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {(() => {
                                                                    const status =
                                                                        String(
                                                                            submission.status
                                                                        ).toLowerCase();
                                                                    const isCancelled =
                                                                        status ===
                                                                        "cancelled";
                                                                    const isRejected =
                                                                        status.includes(
                                                                            "rejected"
                                                                        );

                                                                    const isOwner =
                                                                        auth
                                                                            .user
                                                                            .id ===
                                                                        submission.user_id;

                                                                    return (
                                                                        (isCancelled &&
                                                                            isOwner) ||
                                                                        (isRejected &&
                                                                            isOwner)
                                                                    );
                                                                })() && (
                                                                    <DropdownMenuItem
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSubmission(
                                                                                submission
                                                                            );
                                                                            setShowAmendModal(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 text-blue-600"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />{" "}
                                                                        Revisi
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
                                                                        !isCancelled &&
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
                                                ))}
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

            {/* Cancel Modal */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent style={{ borderRadius: "15px" }}>
                    <DialogHeader>
                        <DialogTitle>Batalkan Pengajuan</DialogTitle>
                        <DialogDescription>
                            Pengajuan yang sudah disetujui atau ditolak dapat
                            dibatalkan. Status akan berubah menjadi "cancelled".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Tuliskan alasan pembatalan..."
                            value={data.cancel_reason}
                            onChange={(e) =>
                                setData("cancel_reason", e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>
                    <DialogFooter className="space-x-2 flex gap-2">
                        <Button
                            onClick={() => {
                                setShowCancelModal(false);
                                setSelectedSubmission(null);
                                reset();
                            }}
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
                            variant="destructive"
                            onClick={() => {
                                if (!data.cancel_reason.trim()) {
                                    alert("Alasan pembatalan wajib diisi");
                                    return;
                                }

                                router.post(
                                    route(
                                        "submissions.cancel",
                                        selectedSubmission.id
                                    ),
                                    { cancel_reason: data.cancel_reason },
                                    {
                                        onSuccess: () => {
                                            setShowCancelModal(false);
                                            setSelectedSubmission(null);
                                            reset();
                                            router.reload();
                                        },
                                        onError: (errors) => {
                                            alert(
                                                errors.cancel_reason ||
                                                    "Gagal membatalkan pengajuan"
                                            );
                                        },
                                    }
                                );
                            }}
                            disabled={processing}
                        >
                            Batalkan Pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Amend Modal */}
            <Dialog open={showAmendModal} onOpenChange={setShowAmendModal}>
                <DialogContent style={{ borderRadius: "15px" }}>
                    <DialogHeader>
                        <DialogTitle>Buat Pengajuan Revisi</DialogTitle>
                        <DialogDescription>
                            Pengajuan baru akan dibuat dengan data yang sama dan
                            dapat diedit. Nomor seri akan mengikuti pengajuan
                            yang dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Tuliskan alasan revisi..."
                            value={data.amend_reason}
                            onChange={(e) =>
                                setData("amend_reason", e.target.value)
                            }
                            rows={3}
                            required
                        />
                    </div>
                    <DialogFooter className="space-x-2 flex gap-2">
                        <Button
                            onClick={() => {
                                setShowAmendModal(false);
                                setSelectedSubmission(null);
                                reset();
                            }}
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button
                            className="rounded-md"
                            style={{ borderRadius: "15px" }}
                            onClick={() => {
                                if (!data.amend_reason.trim()) {
                                    alert("Alasan revisi wajib diisi");
                                    return;
                                }

                                router.post(
                                    route(
                                        "submissions.amend",
                                        selectedSubmission.id
                                    ),
                                    { amend_reason: data.amend_reason },
                                    {
                                        onSuccess: (page) => {
                                            setShowAmendModal(false);
                                            setSelectedSubmission(null);
                                            reset();
                                            if (page.props.redirect_url) {
                                                window.location.href =
                                                    page.props.redirect_url;
                                            }
                                        },
                                        onError: (errors) => {
                                            alert(
                                                errors.amend_reason ||
                                                    "Gagal membuat pengajuan revisi"
                                            );
                                        },
                                    }
                                );
                            }}
                            disabled={processing}
                        >
                            Buat Revisi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
