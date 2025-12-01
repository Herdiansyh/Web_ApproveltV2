import React, { useEffect, useState } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import {
    FileText,
    ListCheck,
    User2,
    UserCircle2,
    CheckCircle2,
    LogOut,
    Workflow,
    DockIcon,
    Layers,
    CheckCircleIcon,
    CheckLineIcon,
    FileTextIcon,
    LayoutDashboard,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLoading } from "./GlobalLoading";

export default function Sidebar({ open }) {
    const [logoutDialog, setLogoutDialog] = useState(false);
    const user = usePage().props.auth.user;
    const { showLogoutAnimation, hideLogoutAnimation } = useLoading();

    useEffect(() => {
        // Listen for Inertia events to handle logout animation
        const handleStart = () => {
            // Animation already shown by confirmLogout
        };

        const handleSuccess = () => {
            // Hide animation when logout is successful
            hideLogoutAnimation();
        };

        const handleError = () => {
            // Hide animation if there's an error
            hideLogoutAnimation();
        };

        // Register Inertia event listeners and store unsubscribe functions
        const unsubscribeStart = router.on('start', handleStart);
        const unsubscribeSuccess = router.on('success', handleSuccess);
        const unsubscribeError = router.on('error', handleError);

        // Cleanup event listeners
        return () => {
            unsubscribeStart();
            unsubscribeSuccess();
            unsubscribeError();
        };
    }, [hideLogoutAnimation]);

    const confirmLogout = () => {
        showLogoutAnimation();
        setLogoutDialog(false);
        
        // Immediately trigger logout request
        router.post(route("logout"));
    };

    const navItems = [
        ...(user.role === "employee" || user.role === "direktur"
            ? [
                  {
                      label: "Dashboard",
                      href: route("dashboard"),
                      active: route().current("dashboard"),
                      icon: <LayoutDashboard className="h-5 w-5" />,
                  },
              ]
            : [
                  {
                      label: "Admin Dashboard",
                      href: route("Admindashboard"),
                      active: route().current("Admindashboard"),
                      icon: <LayoutDashboard className="h-5 w-5" />,
                  },
              ]),

        ...(user.role === "employee" || user.role === "direktur"
            ? [
                  {
                      label: "Lihat List Persetujuan",
                      href: route("submissions.forDivision"),
                      active: route().current("submissions.forDivision"),
                      icon: <ListCheck className="h-5 w-5" />,
                  },
                  
                            {
                                label: "Lihat Pengajuan",
                                href: route("submissions.index"),
                                active: route().current("submissions.index"),
                                icon: <FileTextIcon className="h-5 w-5" />,
                            },
                     

                  {
                      label: "Riwayat Pengajuan",
                      href: route("submissions.history"),
                      active: route().current("submissions.history"),
                      icon: <CheckLineIcon className="h-5 w-5" />,
                  },
              ]
            : []),
        ...(user.role === "admin"
            ? [
                  {
                      label: "Division Management",
                      href: route("divisions.index"),
                      active: route().current("divisions.index"),
                      icon: <UserCircle2 className="h-5 w-5" />,
                  },
                  {
                      label: "Subdivision Management",
                      href: route("subdivisions.index"),
                      active: route().current("subdivisions.index"),
                      icon: <Layers className="h-5 w-5" />,
                  },
                  {
                      label: "User Management",
                      href: route("users.index"),
                      active: route().current("users.*"),
                      icon: <User2 className="h-5 w-5" />,
                  },
                  {
                      label: "Document Type",
                      href: route("documents.index"),
                      active: route().current("documents.*"),
                      icon: <DockIcon className="h-5 w-5" />,
                  },
                  {
                      label: "Workflow Management",
                      href: route("workflows.index"),
                      active: route().current("workflows.*"),
                      icon: <Workflow className="h-5 w-5" />,
                  },
                  {
                      label: "Global Permissions",
                      href: route("global-permissions.index"),
                      active: route().current("global-permissions.*"),
                      icon: <CheckCircle2 className="h-5 w-5" />,
                  },
              ]
            : []),
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex flex-col transition-all duration-300 border-r bg-sidebar text-sidebar-foreground font-sans", // <--- font ABeeZee aktif di sini
                    open
                        ? "min-w-64 px-4 py-5"
                        : "w-0 hidden items-center px-2 py-5"
                )}
            >
                <nav className="flex flex-col gap-3">
                    {navItems.map((item) => (
                        <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                                        item.active
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    {open && <span>{item.label}</span>}
                                </Link>
                            </TooltipTrigger>
                            {!open && (
                                <TooltipContent side="right">
                                    {item.label}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ))}

                    <Separator className="my-3 bg-sidebar-border" />

                    <Button
                        variant="ghost"
                        style={{ borderRadius: "15px" }}
                        className="justify-start gap-3 text-muted-foreground hover:bg-blue-400 hover:text-destructive-foreground transition-all"
                        onClick={() => setLogoutDialog(true)}
                    >
                        <LogOut className="h-5 w-5" />
                        {open && <span>Logout</span>}
                    </Button>
                </nav>
            </aside>

   <Dialog open={logoutDialog} onOpenChange={setLogoutDialog}>
    <DialogContent
        style={{ borderRadius: "16px" }}
        className="border border-gray-200 bg-white shadow-xl transition-all duration-300"
    >
        <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <span
                    style={{ borderRadius: "10px" }}
                    className="p-2.5 bg-blue-50 text-blue-600"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m-3 6h-3"
                        />
                    </svg>
                </span>
                Konfirmasi Logout
            </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            Apakah Anda yakin ingin keluar dari aplikasi?
        </p>

        <DialogFooter className="mt-6 flex gap-3 justify-end">
            <Button
                style={{ borderRadius: "10px" }}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium"
                onClick={() => setLogoutDialog(false)}
            >
                Batal
            </Button>
            <Button
                style={{ borderRadius: "10px" }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                onClick={confirmLogout}
            >
                Ya, Logout
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
        </TooltipProvider>
    );
}
