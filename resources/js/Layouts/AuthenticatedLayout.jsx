import Dropdown from "@/Components/Dropdown";
import { usePage } from "@inertiajs/react";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );
    const [showNotif, setShowNotif] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotif, setLoadingNotif] = useState(false);
    const [badgeCount, setBadgeCount] = useState(0);
    const [showAllNotif, setShowAllNotif] = useState(false);
    const [totalNotif, setTotalNotif] = useState(0);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Preload badge and preview items on first render
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const lastReadTs = localStorage.getItem('notif:last_read_ts') || '';
                const localCleared = localStorage.getItem('notif:clear_until') || '';
                const since = lastReadTs && localCleared
                    ? (new Date(lastReadTs) > new Date(localCleared) ? lastReadTs : localCleared)
                    : (lastReadTs || localCleared);
                const url = new URL(route('notifications.index'));
                url.searchParams.set('limit', '5');
                if (since) url.searchParams.set('since', since);
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!res.ok) return;
                const data = await res.json();
                if (ignore) return;
                setBadgeCount(Number(data.new_count || 0));
                setNotifications(Array.isArray(data.items) ? data.items : []);
                setTotalNotif(Number(data.total_count || 0));
                // cache server time for next read mark
                if (data.server_time) localStorage.setItem('notif:last_server_time', data.server_time);
            } catch {}
        })();
        return () => { ignore = true; };
    }, []);

    const toggleNotif = async () => {
        const next = !showNotif;
        setShowNotif(next);
        if (next) {
            try {
                setLoadingNotif(true);
                const url = new URL(route('notifications.index'));
                url.searchParams.set('limit', showAllNotif ? '100' : '5');
                // Always send since based on latest local read/clear marker
                const lr = localStorage.getItem('notif:last_read_ts') || '';
                const lc = localStorage.getItem('notif:clear_until') || '';
                const since = lr && lc ? (new Date(lr) > new Date(lc) ? lr : lc) : (lr || lc);
                if (since) url.searchParams.set('since', since);
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(Array.isArray(data.items) ? data.items : []);
                    setTotalNotif(Number(data.total_count || 0));
                    // Mark as read: reset badge and persist last_read_ts
                    const ts = data.server_time || new Date().toISOString();
                    try {
                        await fetch(route('notifications.read'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                            body: JSON.stringify({ ts }),
                            credentials: 'same-origin',
                        });
                    } catch {}
                    localStorage.setItem('notif:last_read_ts', ts);
                    setBadgeCount(0);
                } else {
                    setNotifications([]);
                }
            } catch (e) {
                setNotifications([]);
            } finally {
                setLoadingNotif(false);
            }
        }
    };

    const onSeeMoreToggle = async () => {
        const next = !showAllNotif;
        setShowAllNotif(next);
        if (showNotif) {
            // refresh list with new limit
            try {
                setLoadingNotif(true);
                const url = new URL(route('notifications.index'));
                url.searchParams.set('limit', next ? '100' : '5');
                // Include since on see more as well
                const lr = localStorage.getItem('notif:last_read_ts') || '';
                const lc = localStorage.getItem('notif:clear_until') || '';
                const since = lr && lc ? (new Date(lr) > new Date(lc) ? lr : lc) : (lr || lc);
                if (since) url.searchParams.set('since', since);
                const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                const data = res.ok ? await res.json() : { items: [] };
                setNotifications(Array.isArray(data.items) ? data.items : []);
                setTotalNotif(Number(data.total_count || 0));
            } catch {
                // ignore
            } finally {
                setLoadingNotif(false);
            }
        }
    };

    const onClearNotifications = async () => {
        // Optimistic UI: kosongkan segera
        const ts = new Date().toISOString();
        localStorage.setItem('notif:last_read_ts', ts);
        localStorage.setItem('notif:clear_until', ts);
        setLoadingNotif(false);
        setShowAllNotif(false);
        setNotifications([]);
        setBadgeCount(0);
        setTotalNotif(0);

        // Sinkronkan ke server (non-blocking)
        try {
            await fetch(route('notifications.clear'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ ts }),
                credentials: 'same-origin',
            });
        } catch {
            // Abaikan error: UI sudah bersih; akan tersinkron saat fetch berikutnya
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground ">
            {header && (
                <header className="bg-card text-card-foreground shadow">
                    <div className="mx-auto py-4 flex justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2">
                            {" "}
                            <img
                                src="/icon.png"
                                className="sm:w-10 w-8"
                                alt=""
                            />
                            <h2 className="sm:text-xl text-sm font-semibold leading-tight">
                                E-Approval
                            </h2>{" "}
                            {/* Toggle Dark/Light */}
                            <button
                                onClick={toggleDarkMode}
                                className={`sm:w-12 sm:h-5 w-9 h-4 flex items-center rounded-full p-1 duration-300 ease-in-out border border-border ${
                                    darkMode
                                        ? "bg-gray-700 justify-end"
                                        : "bg-yellow-50 justify-start"
                                }`}
                            >
                                <span className="sm:w-4 sm:h-4 w-1 h-2 rounded-full bg-white flex items-center justify-center text-xs">
                                    {darkMode ? "🌙" : "🌞"}
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div
                                style={{ borderRadius: "15px" }}
                                className="relative"
                            >
                                {/* notifikasi */}
                                <button type="button" onClick={toggleNotif} className="hover:cursor-pointer">
                                    <Bell />
                                </button>
                                {badgeCount > 0 && (
                                    <div
                                        style={{ borderRadius: "10px" }}
                                        className=" text-[10px] leading-none flex items-center justify-center bg-amber-300 text-black px-1.5 h-4 min-w-4 absolute -top-2 z-50 -right-1"
                                    >
                                        <span className="mx-auto">{badgeCount}</span>
                                    </div>
                                )}
                                {/* POPOVER NOTIFIKASI */}
                                {showNotif && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ borderRadius: "10px" }}
                                        className="absolute -left-40 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3 z-50"
                                    >
                                        <h4 className="font-semibold text-sm mb-2">Notifikasi</h4>
                                        {loadingNotif ? (
                                            <div className="text-xs text-gray-600 dark:text-gray-300">Memuat...</div>
                                        ) : notifications.length === 0 ? (
                                            <div className="text-xs text-gray-600 dark:text-gray-300">Tidak ada notifikasi baru.</div>
                                        ) : (
                                            <div>
                                                <ul className="space-y-2 max-h-72 overflow-auto">
                                                    {notifications.map((n, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <div className="shrink-0 text-base">{n.icon || "📄"}</div>
                                                            <div className="min-w-0">
                                                                <div
                                                                    className="text-xs text-foreground"
                                                                    style={{
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: "vertical",
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    {n.message}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground mt-0.5">{n.timestamp || ""}</div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    {totalNotif > 5 && (
                                                        <button type="button" onClick={(e)=>{e.stopPropagation(); onSeeMoreToggle();}} className="text-[11px] text-primary hover:underline">
                                                            {showAllNotif ? 'See less' : 'See more'}
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={(e)=>{e.stopPropagation(); onClearNotifications();}} className="text-[11px] text-red-600 hover:underline ml-auto">
                                                        Clear notifications
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border border-transparent bg-card px-3 py-2 text-xs sm:text-sm font-medium leading-4 text-foreground hover:text-primary transition"
                                        >
                                            {user.name}
                                            <svg
                                                className="-me-0.5 ms-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route("profile.edit")}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route("logout")} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
