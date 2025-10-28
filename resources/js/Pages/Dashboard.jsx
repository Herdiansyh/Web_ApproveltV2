import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Card, CardContent } from "@/Components/ui/card";
import Modal from "@/Components/Modal";
import { useState } from "react";
import Sidebar from "@/Components/Sidebar";
import { TooltipProvider } from "@/Components/ui/tooltip";

export default function Dashboard({ auth }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="flex min-h-screen bg-background">
                <TooltipProvider>
                    <Sidebar />
                </TooltipProvider>

                {/* Main Content */}
                <div className="space-y-6 p-10">
                    <h2 className="text-2xl font-semibold text-background">
                        Selamat Datang, {auth.user.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-background rounded-xl shadow p-4 border border-gray-100">
                            <h3 className="font-semibold text-gray-700">
                                Total Pengajuan
                            </h3>
                            <p className="text-3xl font-bold mt-2 text-blue-600">
                                12
                            </p>
                        </div>
                        <div className="bg-background rounded-xl shadow p-4 border border-gray-100">
                            <h3 className="font-semibold text-gray-700">
                                Menunggu Persetujuan
                            </h3>
                            <p className="text-3xl font-bold mt-2 text-yellow-500">
                                4
                            </p>
                        </div>
                        <div className="bg-background rounded-xl shadow p-4 border border-gray-100">
                            <h3 className="font-semibold text-gray-700">
                                Disetujui
                            </h3>
                            <p className="text-3xl font-bold mt-2 text-green-600">
                                8
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
