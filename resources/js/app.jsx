import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import LoadingProvider from "@/Components/GlobalLoading";
import { initializeCsrfToken, setupPeriodicTokenRefresh } from "@/utils/csrfInit";

// Initialize CSRF token management
initializeCsrfToken().catch(console.error);
setupPeriodicTokenRefresh();

const appName = import.meta.env.VITE_APP_NAME || "E-Approval";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LoadingProvider>
                <App {...props} />
            </LoadingProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
