import Dropdown from "@/Components/Dropdown";
import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

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
                            </h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Toggle Dark/Light */}
                            <button
                                onClick={toggleDarkMode}
                                className={`sm:w-12 sm:h-5 w-9 h-4 flex items-center rounded-full p-1 duration-300 ease-in-out border border-border ${
                                    darkMode
                                        ? "bg-gray-700 justify-end"
                                        : "bg-yellow-50 justify-start"
                                }`}
                            >
                                <span className="sm:w-4 sm:h-4 w-2 h-2 rounded-full bg-white flex items-center justify-center text-xs">
                                    {darkMode ? "🌙" : "🌞"}
                                </span>
                            </button>

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-card px-3 py-2 text-sm font-medium leading-4 text-foreground hover:text-primary transition"
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
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route("profile.edit")}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
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
