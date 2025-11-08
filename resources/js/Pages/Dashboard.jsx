import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Sidebar from "@/Components/Sidebar";
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
import { ChartPie, CheckCircle, Clock, Bell, ArrowRight } from "lucide-react";

export default function Dashboard({ auth, stats, pendingItems = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-foreground">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="flex min-h-screen bg-background">
                <TooltipProvider>
                    <Sidebar />
                </TooltipProvider>

                <div className="flex-1 p-8 md:p-12 space-y-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                Hai, Pak {auth.user.name}! 👋
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Selamat datang kembali di sistem e-Approval.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 bg-card shadow-sm border border-border px-4 py-2 rounded-full text-sm text-muted-foreground">
                            <span className="font-medium text-primary">
                                {new Date().toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Alert Section */}
                    {stats?.waiting > 0 && (
                        <Card
                            className="relative overflow-hidden border-border bg-card shadow-sm"
                            style={{ borderRadius: "15px" }}
                        >
                            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                                <div className="flex items-start gap-3">
                                    <div
                                        style={{ borderRadius: "15px" }}
                                        className="hover:bg-orange-500 mt-0.5 inline-flex h-10 w-20 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"
                                    >
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-foreground">
                                            Ada {stats.waiting} pengajuan
                                            menunggumu 🚀
                                        </CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            Mohon review dan ambil tindakan pada
                                            pengajuan berikut.
                                        </CardDescription>

                                        {pendingItems?.length > 0 && (
                                            <ul className="mt-3 space-y-2">
                                                {pendingItems.map((item) => (
                                                    <li
                                                        style={{
                                                            borderRadius:
                                                                "15px",
                                                        }}
                                                        key={item.id}
                                                        className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm shadow-sm"
                                                    >
                                                        <span className="truncate pr-2 font-medium text-foreground">
                                                            {item.title}
                                                        </span>
                                                        <Button
                                                            style={{
                                                                borderRadius:
                                                                    "15px",
                                                            }}
                                                            asChild
                                                            size="sm"
                                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "submissions.forDivision"
                                                                )}
                                                                className="flex items-center gap-1"
                                                            >
                                                                Review
                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    style={{ borderRadius: "15px" }}
                                    asChild
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Total Pengajuan */}
                        {auth.user.role === "employee" && (
                            <Card
                                style={{ borderRadius: "15px" }}
                                className="border border-border shadow-md hover:shadow-lg transition"
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Pengajuan
                                    </CardTitle>
                                    <ChartPie className="w-6 h-6 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-primary">
                                        {stats.total}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Semua dokumen yang pernah diajukan
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Menunggu Persetujuan */}
                        <Card
                            style={{ borderRadius: "15px" }}
                            className="border border-border shadow-md hover:shadow-lg transition"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Menunggu Persetujuan
                                </CardTitle>
                                <Clock className="w-6 h-6 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-yellow-600">
                                    {stats.waiting}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Masih dalam proses review
                                </p>
                            </CardContent>
                        </Card>

                        {/* Disetujui */}
                        <Card
                            style={{ borderRadius: "15px" }}
                            className="border border-border shadow-md hover:shadow-lg transition"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Disetujui
                                </CardTitle>
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-600">
                                    {stats.approved}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dokumen yang sudah{" "}
                                    {auth.user.role === "direktur"
                                        ? "anda setujui"
                                        : "disetujui atasan"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Ditolak */}
                        <Card
                            style={{ borderRadius: "15px" }}
                            className="border border-border shadow-md hover:shadow-lg transition"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Ditolak
                                </CardTitle>
                                <CheckCircle className="w-6 h-6 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-red-600">
                                    {stats.approved}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dokumen yang sudah{" "}
                                    {auth.user.role === "direktur"
                                        ? "Anda tolak"
                                        : "Ditolak atasan"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator className="my-10" />

                    {/* Footer */}
                    <p className="text-sm text-muted-foreground text-center">
                        © {new Date().getFullYear()} E-Approval System. Made
                        with ❤️ from IT.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
