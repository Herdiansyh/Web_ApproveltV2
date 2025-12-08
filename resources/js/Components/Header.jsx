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
                className={`inline-flex border-gray-300  items-start  ${
                    open
                        ? "relative ml-3 -mr-3 "
                        : "absolute top-12 left-1 mt-1"
                }`}
            >
                <Button
                    variant="ghost"
                    style={{ borderRadius: "15px" }}
                    className="mt-1 ml-1 border border-gray-300 text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(!open)}
                >
                    <Menu />
                </Button>
            </div>
        </>
    );
}
