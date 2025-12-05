import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { TooltipProvider } from "@/Components/ui/tooltip";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import {
    ChartPie,
    CheckCircle,
    Clock,
    Bell,
    ArrowRight,
    XCircle,
} from "lucide-react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";

export default function Dashboard({
    auth,
    stats,
    canApprove,
    pendingItems = [],
}) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-foreground">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <TooltipProvider>
                    <Header />
                </TooltipProvider>

                <div className="flex-1 p-8 md:p-12 space-y-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="sm:text-4xl text-2xl font-bold text-foreground">
                                Hai {auth.user.name}! 👋
                            </h1>
                            <p className="text-muted-foreground text-base mt-2">
                                Selamat datang kembali di sistem e-Approval.
                            </p>
                        </div>
                        <div
                            style={{ borderRadius: "15px" }}
                            className="bg-card border border-border px-5 py-2.5 text-sm shadow-sm"
                        >
                            <span className="font-medium text-foreground">
                                {new Date().toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Alert Section - only for users who can approve and have items to review */}
                    {canApprove && (pendingItems?.length || 0) > 0 && (
                        <Card
                            className="relative overflow-hidden border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-card to-blue-500/5 shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{ borderRadius: "16px" }}
                        >
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl" />

                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div
                                        style={{ borderRadius: "12px" }}
                                        className="mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                    >
                                        <Bell className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-foreground mb-1">
                                            Ada pengajuan menunggumu 🚀
                                        </CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            Mohon review dan ambil tindakan pada
                                            pengajuan berikut.
                                        </CardDescription>
                                    </div>
                                </div>

                                <Button
                                    style={{ borderRadius: "12px" }}
                                    asChild
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
                                >
                                    <Link
                                        href={route("submissions.forDivision")}
                                    >
                                        <span className="flex items-center gap-2">
                                            Buka Daftar Review
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Pengajuan - tampilkan untuk semua role kecuali direktur */}
                        {auth.user.role !== "direktur" && (
                            <Card
                                style={{ borderRadius: "16px" }}
                                className="group border border-border hover:border-blue/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                                        Total Pengajuan
                                    </CardTitle>
                                    <div className="p-2.5 bg-blue/10 rounded-lg group-hover:bg-blue/20 transition-colors">
                                        <ChartPie className="w-5 h-5 text-blue group-hover:scale-110 transition-transform" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-4xl font-bold text-blue">
                                        {stats.total}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Semua dokumen yang pernah diajukan
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Menunggu Persetujuan */}
                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Menunggu Persetujuan
                                </CardTitle>
                                <div className="p-2.5 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors">
                                    <Clock className="w-5 h-5 text-primary-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                                    {stats.waiting}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Masih dalam proses review
                                </p>
                            </CardContent>
                        </Card>

                        {/* Disetujui */}
                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Disetujui
                                </CardTitle>
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats.approved}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Dokumen yang sudah{" "}
                                    {auth.user.role === "direktur"
                                        ? "anda setujui"
                                        : "disetujui atasan"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Ditolak */}
                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-red/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Ditolak
                                </CardTitle>
                                <div className="p-2.5 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                                    <XCircle className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-bold text-destructive">
                                    {stats.rejected}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Dokumen yang sudah{" "}
                                    {auth.user.role === "direktur"
                                        ? "Anda tolak"
                                        : "Ditolak atasan"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator className="my-10 bg-border" />

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
