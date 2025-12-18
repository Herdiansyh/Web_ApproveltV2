import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Header() {
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const handleResize = () => setOpen(window.innerWidth >= 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <Sidebar open={open} />
            <div
                className="absolute"
                style={{
                    top: open ? "67px" : "68px",
                    left: open ? "245px" : "-8px",
                    marginTop: open ? "0" : "4px",
                    zIndex: 40,
                    transition:
                        "top 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <Button
                    variant="outline"
                    style={{
                        borderRadius: "0 100px 100px 0",
                        transition: "all 0.2s ease-in-out",
                    }}
                    className="mt-1 hover:scale-110 transform  border border-gray-300/50 shadow-xl text-muted-foreground hover:text-foreground bg-sidebar"
                    onClick={() => setOpen(!open)}
                >
                    <Menu />
                </Button>
            </div>
        </>
    );
}
