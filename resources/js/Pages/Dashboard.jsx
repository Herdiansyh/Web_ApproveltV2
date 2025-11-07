import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Sidebar from "@/Components/Sidebar";
import { TooltipProvider } from "@/Components/ui/tooltip";
import { ChartPie, CheckCircle, Clock, Bell, ArrowRight } from "lucide-react"; // ikon modern

export default function Dashboard({ auth, stats, pendingItems = [] }) {
    console.log(stats);
    console.log(auth.user);
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                <TooltipProvider>
                    <Sidebar />
                </TooltipProvider>

                {/* Main Content */}
                <div className="flex-1 p-8 md:p-12 space-y-8">
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                Hai, Pak {auth.user.name}! 👋
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Selamat datang kembali di sistem e-Approval.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
                            <span className="font-medium text-blue-600">
                                {new Date().toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Alert: Pending Approvals */}
                    {stats?.waiting > 0 && (
                        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-purple-50 shadow-sm">
                            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
                            <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800">
                                            Ada {stats.waiting} pengajuan menunggumu 🚀
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Mohon review dan ambil tindakan pada pengajuan berikut.
                                        </p>
                                        {/* Preview list */}
                                        {pendingItems?.length > 0 && (
                                            <ul className="mt-3 space-y-2">
                                                {pendingItems.map((item) => (
                                                    <li
                                                        key={item.id}
                                                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/80 px-3 py-2 text-sm shadow-sm"
                                                    >
                                                        <span className="truncate pr-2 font-medium text-gray-700">
                                                            {item.title}
                                                        </span>
                                                        <Link
                                                            href={route("submissions.forDivision")}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                                        >
                                                            Review
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3 md:gap-4">
                                    <Link
                                        href={route("submissions.forDivision")}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                                    >
                                        Buka Daftar Review
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Total Pengajuan */}
                        <div className="group bg-white/80 backdrop-blur-lg border border-gray-100 shadow-sm rounded-2xl p-6 transition hover:shadow-lg hover:-translate-y-1">
                            <div className="flex justify-between items-center">
                                <h3 className="text-gray-600 font-medium">
                                    Total Pengajuan
                                </h3>
                                <ChartPie className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-4xl font-bold mt-3 text-blue-600">
                                {stats.total}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Semua dokumen yang pernah diajukan
                            </p>
                        </div>

                        {/* Menunggu Persetujuan */}
                        <div className="group bg-white/80 backdrop-blur-lg border border-gray-100 shadow-sm rounded-2xl p-6 transition hover:shadow-lg hover:-translate-y-1">
                            <div className="flex justify-between items-center">
                                <h3 className="text-gray-600 font-medium">
                                    Menunggu Persetujuan
                                </h3>
                                <Clock className="w-6 h-6 text-yellow-500" />
                            </div>
                            <p className="text-4xl font-bold mt-3 text-yellow-500">
                                {stats.waiting}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Masih dalam proses review
                            </p>
                        </div>

                        {/* Disetujui */}
                        <div className="group bg-white/80 backdrop-blur-lg border border-gray-100 shadow-sm rounded-2xl p-6 transition hover:shadow-lg hover:-translate-y-1">
                            <div className="flex justify-between items-center">
                                <h3 className="text-gray-600 font-medium">
                                    Disetujui
                                </h3>
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-4xl font-bold mt-3 text-green-600">
                                {stats.approved}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Dokumen yang sudah disetujui atasan
                            </p>
                        </div>
                    </div>

                    {/* Footer / Info Section */}
                    <div className="text-sm text-gray-400 text-center mt-10">
                        © {new Date().getFullYear()} E-Approval System. Made
                        with ❤️ From IT.
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
