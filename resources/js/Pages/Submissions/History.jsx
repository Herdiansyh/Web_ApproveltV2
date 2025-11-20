import React, { useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Header from "@/Components/Header";

export default function History({ auth, submissions }) {
    const rows = useMemo(() => submissions?.data ?? [], [submissions]);

    const formatDate = (d) => {
        if (!d) return "-";
        try {
            return new Date(d).toLocaleString("id-ID");
        } catch {
            return d;
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
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                            <div className="text-lg font-medium">
                                Riwayat Pengajuan
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
                                            Name Series
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
                                                colSpan={7}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Belum ada riwayat 😕
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((s) => {
                                        const doc = s?.workflow?.document;
                                        // Prefer the actual generated series code on the submission if available
                                        const nameSeries = s?.series_code
                                            ? s.series_code
                                            : doc?.nameSeries?.prefix
                                            ? `${doc.nameSeries.prefix}${
                                                  doc.nameSeries
                                                      .series_number ??
                                                  doc.nameSeries
                                                      .series_pattern ??
                                                  ""
                                              }`
                                            : doc?.name_series?.prefix
                                            ? `${doc.name_series.prefix}${
                                                  doc.name_series
                                                      .series_number ??
                                                  doc.name_series
                                                      .series_pattern ??
                                                  ""
                                              }`
                                            : "-";

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
                                                <td className="py-3 px-6 text-xs text-muted-foreground font-mono">
                                                    {nameSeries}
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
        </AuthenticatedLayout>
    );
}
