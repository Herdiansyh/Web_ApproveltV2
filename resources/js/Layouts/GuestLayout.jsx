import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100  justify-center p-5">
            <div className=" w-full flex justify-center"></div> {children}
        </div>
    );
}
