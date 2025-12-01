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
    Users,
    FileText,
    Settings,
    Activity,
    ArrowRight,
    PlusCircle,
} from "lucide-react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";

export default function AdminDashboard({ auth, stats }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-foreground">
                    Dashboard Admin
                </h2>
            }
        >
            <Head title="Dashboard Admin" />

            <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
                <TooltipProvider>
                    <Header />
                </TooltipProvider>

                <div className="flex-1 p-8 md:p-12 space-y-10">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                Selamat datang, {auth.user.name} 👋
                            </h1>
                            <p className="text-muted-foreground mt-2 text-base">
                                Kelola sistem dan pantau aktivitas pengguna di e-Approval.
                            </p>
                        </div>
                        <div className="bg-card border border-border px-5 py-2.5 rounded-xl text-sm font-medium text-foreground shadow-sm">
                            {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Tambah Pengguna
                                </CardTitle>
                                <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <PlusCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-3xl font-bold text-foreground">
                                    {stats.users}
                                </p>
                                <Link href={route("users.index")}>
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full text-sm font-medium border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                                        style={{ borderRadius: "10px" }}
                                    >
                                        Kelola Pengguna
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-chart-2/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Total Pengajuan
                                </CardTitle>
                                <div className="p-2.5 bg-chart-2/10 rounded-lg group-hover:bg-chart-2/20 transition-colors">
                                    <FileText className="w-5 h-5 text-chart-2 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-3xl font-bold text-foreground">
                                    {stats.submissions}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Semua dokumen yang masuk sistem
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Aktivitas Hari Ini
                                </CardTitle>
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                    <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-3xl font-bold text-foreground">
                                    {stats.today_activities}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Pengajuan & perubahan terbaru
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "16px" }}
                            className="group border border-border hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                                <CardTitle className="text-sm font-semibold text-muted-foreground">
                                    Pengaturan Sistem
                                </CardTitle>
                                <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <Link>
                                    <Button
                                        variant="default"
                                        className="mt-4 w-full text-sm font-medium bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors shadow-sm"
                                        style={{ borderRadius: "10px" }}
                                    >
                                        Buka Pengaturan
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overview Section */}
                    <Card
                        className="border border-border shadow-sm bg-card hover:shadow-md transition-shadow duration-300"
                        style={{ borderRadius: "16px" }}
                    >
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-foreground">
                                        Aktivitas Terbaru
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground text-sm mt-1">
                                        Pantau aktivitas terbaru dari seluruh pengguna
                                    </CardDescription>
                                </div>
                                <div className="p-2 bg-muted rounded-lg">
                                    <Activity className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {stats.recentActivities?.length > 0 ? (
                                <ul className="space-y-3">
                                    {stats.recentActivities.map((a, i) => (
                                        <li
                                            key={i}
                                            className="p-4 border border-border rounded-xl hover:bg-muted/50 hover:border-border transition-all duration-200 text-sm flex justify-between items-center group"
                                        >
                                            <span className="text-foreground">
                                                <strong className="font-semibold text-foreground">{a.user}</strong>{" "}
                                                {a.action}
                                            </span>
                                            <span className="text-muted-foreground text-xs font-medium">
                                                {a.time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                                        <Activity className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Belum ada aktivitas terbaru
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Separator className="my-10 bg-border" />
                    <Footer />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}