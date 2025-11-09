import React from "react";

export default function Footer() {
    return (
        <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} E-Approval System. Made with ❤️ from
            IT.
        </p>
    );
}
