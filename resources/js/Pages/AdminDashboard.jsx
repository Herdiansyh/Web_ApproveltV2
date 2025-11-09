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

            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/40">
                <TooltipProvider>
                    <Header />
                </TooltipProvider>

                <div className="flex-1 p-8 md:p-12 space-y-10">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Selamat datang, Admin {auth.user.name} 👋
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Kelola sistem dan pantau aktivitas pengguna di
                                e-Approval.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 bg-card border border-border px-4 py-2 rounded-full text-sm">
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
                            style={{ borderRadius: "15px" }}
                            className="group border border-border hover:shadow-lg transition bg-card"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tambah Pengguna
                                </CardTitle>
                                <PlusCircle className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {stats.users}
                                </p>
                                <Link href={route("users.index")}>
                                    <Button
                                        variant="outline"
                                        className="mt-3 w-full text-sm"
                                        style={{ borderRadius: "12px" }}
                                    >
                                        Kelola Pengguna
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "15px" }}
                            className="group border border-border hover:shadow-lg transition bg-card"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Pengajuan
                                </CardTitle>
                                <FileText className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {stats.submissions}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Semua dokumen yang masuk sistem
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "15px" }}
                            className="group border border-border hover:shadow-lg transition bg-card"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Aktivitas Hari Ini
                                </CardTitle>
                                <Activity className="w-6 h-6 text-green-600 group-hover:scale-110 transition" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {stats.today_activities}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Pengajuan & perubahan terbaru
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            style={{ borderRadius: "15px" }}
                            className="group border border-border hover:shadow-lg transition bg-card"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Pengaturan Sistem
                                </CardTitle>
                                <Settings className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
                            </CardHeader>
                            <CardContent>
                                <Link>
                                    <Button
                                        variant="default"
                                        className="mt-3 w-full text-sm"
                                        style={{ borderRadius: "12px" }}
                                    >
                                        Buka Pengaturan
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overview Section */}
                    <Card
                        className="border border-border shadow-md bg-card backdrop-blur-sm"
                        style={{ borderRadius: "15px" }}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                                Aktivitas Terbaru
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-sm">
                                Pantau aktivitas terbaru dari seluruh pengguna.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.recentActivities?.length > 0 ? (
                                <ul className="space-y-3">
                                    {stats.recentActivities.map((a, i) => (
                                        <li
                                            key={i}
                                            className="p-3 border border-border rounded-lg hover:bg-muted/50 transition text-sm flex justify-between"
                                        >
                                            <span>
                                                <strong>{a.user}</strong>{" "}
                                                {a.action}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {a.time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada aktivitas terbaru.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Separator className="my-10" />
                    <Footer />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
