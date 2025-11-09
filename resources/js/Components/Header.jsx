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
                className={`inline-flex items-start  ${
                    open ? "relative m-3" : "absolute  mt-2"
                }`}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className=" text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(!open)}
                >
                    <Menu />
                </Button>
            </div>
        </>
    );
}
