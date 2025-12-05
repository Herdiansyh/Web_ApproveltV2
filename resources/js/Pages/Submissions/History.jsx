import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Header from "@/Components/Header";
import DateFilter from "@/Components/DateFilter";
import { isWithinInterval, parseISO } from "date-fns";
import { Separator } from "@/Components/ui/separator";
import Footer from "@/Components/Footer";

export default function History({ auth, submissions }) {
    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null,
        mode: null,
    });

    const handleDateFilterChange = (filterData) => {
        setDateFilter(filterData);
    };
    const rows = useMemo(() => {
        let result = submissions?.data ?? [];

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
    }, [submissions, dateFilter]);

    const formatDate = (d) => {
        if (!d) return "-";
        try {
            let dt;
            if (typeof d === "string") {
                const s = d.trim();
                const noTz = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s);
                if (noTz) {
                    // Interpret the string as Asia/Jakarta local time (UTC+7)
                    const m = s.replace(" ", "T").split(/[T:.-]/);
                    const y = parseInt(m[0], 10);
                    const mo = parseInt(m[1], 10) - 1;
                    const d2 = parseInt(m[2], 10);
                    const hh = parseInt(m[3], 10);
                    const mm = parseInt(m[4], 10);
                    const ss = parseInt(m[5], 10);
                    // Convert Asia/Jakarta local to UTC by subtracting 7 hours
                    dt = new Date(Date.UTC(y, mo, d2, hh - 7, mm, ss));
                } else {
                    // Has timezone info; let JS parse it
                    dt = new Date(s);
                }
            } else {
                dt = new Date(d);
            }
            const fmt = new Intl.DateTimeFormat("id-ID", {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            return fmt.format(dt);
        } catch {
            return String(d);
        }
    };

    const onRowClick = (id) => router.visit(route("submissions.show", id));

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-foreground">
                    Riwayat Pengajuan
                </h2>
            }
        >
            <Head title="Riwayat Pengajuan" />

            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
                <Header />

                <div className="w-full p-8">
                    <div className="mx-auto bg-card shadow-sm rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="text-lg font-medium">
                                Riwayat Pengajuan
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                                <DateFilter
                                    onFilterChange={handleDateFilterChange}
                                    placeholder="Pilih tanggal..."
                                    label="Filter Tanggal"
                                />
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
                                            No.
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Judul Pengajuan
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tanggal Diajukan
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Status Terakhir
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Step Anda
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tanggal Aksi
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Pengaju
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Keterangan
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border/40">
                                    {rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Belum ada riwayat 😕
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((s, index) => {
                                        const status = s?.status ?? "-";
                                        const myStep = s?.my_history_step;
                                        const stepInfo = myStep
                                            ? `Step ${myStep.step_order}`
                                            : "-";
                                        const stepDate =
                                            myStep?.approved_at ||
                                            myStep?.updated_at ||
                                            myStep?.created_at ||
                                            null;

                                        return (
                                            <tr
                                                key={s.id}
                                                className="cursor-pointer hover:bg-gray-100 transition"
                                                onClick={() => onRowClick(s.id)}
                                            >
                                                <td className="py-3 px-6">
                                                    {index + 1}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {s?.title || "-"}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {formatDate(s.created_at)}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {status}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {stepInfo}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {formatDate(stepDate)}
                                                </td>
                                                <td className="py-3 px-6">
                                                    {s?.user?.name ?? "-"}
                                                </td>
                                                <td className="py-3 px-6 flex">
                                                    <span
                                                        className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                                                        title="Pengajuan ini muncul karena Anda pernah memprosesnya"
                                                    >
                                                        Sudah diproses
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
        </AuthenticatedLayout>
    );
}
