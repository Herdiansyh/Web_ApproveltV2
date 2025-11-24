import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { Card } from "@/Components/ui/card";
import Header from "@/Components/Header";
import { TooltipProvider } from "@/Components/ui/tooltip";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import DeleteUserForm from "./Partials/DeleteUserForm";

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <Link
                    href="/dashboard"
                    className="text-xl font-semibold leading-tight text-gray-800"
                >
                    Profile
                </Link>
            }
        >
            <Head title="Profile" />

            <div className="flex min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
                <TooltipProvider>
                    <Header />
                </TooltipProvider>

                <div className="w-full py-12 px-6">
                    <div className="mx-auto max-w-5xl space-y-6">
                        <Card
                            className="p-6 shadow-sm"
                            style={{ borderRadius: "20px" }}
                        >
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </Card>

                        <Card
                            className="p-6 shadow-sm"
                            style={{ borderRadius: "20px" }}
                        >
                            <UpdatePasswordForm className="max-w-xl" />
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
