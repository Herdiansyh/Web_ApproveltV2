import { Head, Link, router } from "@inertiajs/react";
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
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { useState, useEffect } from "react";
import { Input } from "@/Components/ui/input";

export default function AdminDashboard({ auth, stats }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    const fetchActivities = async (page = 1, searchTerm = "") => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/activities?page=${page}&search=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });
            const data = await response.json();
            setActivities(data.activities);
            setPagination(data.pagination);
        } catch (error) {
            // Handle activities fetch error silently
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchActivities(1, search);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handlePageChange = (page) => {
        fetchActivities(page, search);
    };

    const handleActivityClick = (activity) => {
        router.visit(activity.show_url);
    };
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
                                Kelola sistem dan pantau aktivitas pengguna di
                                e-Approval.
                            </p>
                        </div>
                        <div
                            style={{ borderRadius: "15px" }}
                            className="bg-card border border-border px-5 py-2.5  text-sm font-medium text-foreground shadow-sm"
                        >
                            {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            className="group border  border-border hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 bg-card overflow-hidden relative"
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
                            <CardContent className="relative z-10 ">
                                <p className="text-3xl font-bold text-foreground">
                                    {stats.today_activities}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Pengajuan & perubahan terbaru
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overview Section */}
                    <Card
                        className="border shadow-lg border-border  bg-card hover:shadow-xl transition-shadow duration-300"
                        style={{ borderRadius: "16px" }}
                    >
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-foreground">
                                        Aktivitas Terbaru
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground text-sm mt-1">
                                        Pantau semua aktivitas pengajuan dari seluruh pengguna
                                    </CardDescription>
                                </div>
                                <div className="p-2 bg-muted rounded-lg">
                                    <Activity className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Cari berdasarkan nama pengguna atau judul pengajuan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-full border-border bg-background"
                                        style={{ borderRadius: "8px" }}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                                        <Activity className="w-8 h-8 text-muted-foreground animate-pulse" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Memuat aktivitas...
                                    </p>
                                </div>
                            ) : activities.length > 0 ? (
                                <>
                                    <ul className="space-y-3">
                                        {activities.map((activity, i) => (
                                            <li
                                                key={i}
                                                onClick={() => handleActivityClick(activity)}
                                                className="p-4 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 text-sm cursor-pointer group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <strong className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                {activity.user}
                                                            </strong>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                                {activity.document_type}
                                                            </span>
                                                        </div>
                                                        <p className="text-foreground mb-2">
                                                            {activity.action}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span>{activity.time}</span>
                                                            <span>({activity.relative_time})</span>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                activity.status.includes('approved') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                                                                activity.status.includes('rejected') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                activity.status.includes('cancelled') ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                                                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                            }`}>
                                                                {activity.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    {/* Pagination */}
                                    {pagination.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                            <div className="text-sm text-muted-foreground">
                                                Menampilkan {pagination.from} - {pagination.to} dari {pagination.total} aktivitas
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}
                                                    className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <span className="text-sm text-muted-foreground px-3">
                                                    Halaman {pagination.current_page} dari {pagination.last_page}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                    className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                                        <Activity className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {search ? 'Tidak ada aktivitas yang ditemukan untuk pencarian ini' : 'Belum ada aktivitas terbaru'}
                                    </p>
                                    {search && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSearch('')}
                                            className="mt-3 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                        >
                                            Hapus Pencarian
                                        </Button>
                                    )}
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
