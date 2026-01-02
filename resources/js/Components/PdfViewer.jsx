import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set worker URL at module level BEFORE any component renders
if (typeof window !== "undefined") {
    GlobalWorkerOptions.workerSrc = workerUrl;
}

// Inline styles dengan responsive
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "auto",
        maxHeight: "90vh",
        minHeight: "400px", // Reduced minimum height
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        padding: "0",
        gap: "0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "visible", // Allow overflow untuk horizontal scroll
        maxWidth: "none", // Hapus batasan maxWidth
        width: "100%",
        boxSizing: "border-box",
        // Support absolute positioning for overlays
        position: "relative",
    },
    imageContainer: {
        flex: "1 1 auto",
        overflowX: "auto",
        overflowY: "auto",
        display: "flex",
        justifyContent: "center", // Center horizontally
        alignItems: "center", // Center vertically
        padding: "16px",
        backgroundColor: "#f3f4f6",
        WebkitOverflowScrolling: "touch",
        position: "relative",
        maxWidth: "none", // Hapus batasan maxWidth
        width: "100%",
        minWidth: "100%",
        boxSizing: "border-box",
        minHeight: "300px",
    },
    image: {
        maxWidth: "none", // Allow natural size
        height: "auto",
        display: "block",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        // Don't constrain width, allow natural size for scroll
        width: "auto",
    },
    canvasWrapper: {
        flex: "1 1 auto",
        overflowX: "scroll",
        overflowY: "auto",
        display: "flex",
        flexDirection: "row", // Row layout
        justifyContent: "flex-start", // Start dari kiri untuk scroll
        alignItems: "flex-start", // Start dari top
        padding: "8px",
        backgroundColor: "#f3f4f6",
        WebkitOverflowScrolling: "touch",
        position: "relative",
        maxWidth: "none", // Hapus batasan maxWidth
        width: "auto", // Auto width untuk container
        minWidth: "100%", // Minimal full width
        boxSizing: "content-box", // Content box untuk proper scroll
        minHeight: "300px",
    },

    canvas: {
        border: "1px solid #d1d5db",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        width: "auto",
        height: "auto",
        display: "block",
        backgroundColor: "#ffffff",
        // Improve rendering quality
        imageRendering: "auto",
        // Prevent blur on high DPI displays
        transformOrigin: "top left",
        // Ensure sharp text rendering
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        // Prevent shrinking on mobile
        flexShrink: 0,
        maxWidth: "100%", // Ensure it doesn't overflow
    },
    loadingContainer: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        backgroundColor: "#f3f4f6",
        minHeight: "350px",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginBottom: "12px",
    },
    spinnerText: {
        fontSize: "14px",
        color: "#6b7280",
    },
    errorContainer: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "#f3f4f6",
        minHeight: "350px",
    },
    errorBox: {
        backgroundColor: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: "6px",
        padding: "16px",
        color: "#991b1b",
        maxWidth: "90%",
        width: "100%",
        textAlign: "center",
        fontSize: "14px",
    },
    errorTitle: {
        fontWeight: "600",
        marginBottom: "8px",
        fontSize: "16px",
    },
    errorText: {
        fontSize: "13px",
        marginBottom: "12px",
        lineHeight: "1.5",
    },
    errorLink: {
        display: "inline-block",
        padding: "8px 14px",
        backgroundColor: "#991b1b",
        color: "white",
        textDecoration: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        marginTop: "12px",
    },
    controlsContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 12px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        flexWrap: "wrap",
        overflowX: "auto",
        overflowY: "visible",
        WebkitOverflowScrolling: "touch",
        minHeight: "50px", // Ensure minimum height
    },
    button: {
        padding: "6px 10px",
        backgroundColor: "#d1d5db",
        border: "1px solid #9ca3af",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "500",
        transition: "background-color 0.2s",
        color: "#1f2937",
        whiteSpace: "nowrap",
        minWidth: "70px", // Minimum width for mobile
        minHeight: "32px", // Minimum height for mobile
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonPrimary: {
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: "not-allowed",
    },
    pageInfo: {
        fontSize: "12px",
        color: "#6b7280",
        minWidth: "60px", // Reduced for mobile
        maxWidth: "80px", // Prevent overflow
        textAlign: "center",
        fontWeight: "600",
        padding: "4px 6px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
    },
};

// Add animation CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .pdf-canvas-wrapper {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }
    
    /* Ensure controls are never cut off */
    .pdf-viewer-controls {
        position: sticky !important;
        bottom: 0 !important;
        z-index: 10 !important;
        background: #ffffff !important;
        border-top: 1px solid #e5e7eb !important;
        box-shadow: 0 -2px 4px rgba(0,0,0,0.05) !important;
    }
    
    /* Responsive styles for different device sizes */
    @media (max-width: 768px) {
          .pdf-viewer-container {
        max-height: calc(100vh - 200px) !important;
        width: 100% !important;
        max-width: none !important; /* Allow to exceed viewport */
        box-sizing: border-box !important;
        overflow: visible !important; /* Allow content to overflow */
    }
         .pdf-canvas-wrapper {
        padding: 4px !important;
        overflow-x: scroll !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;

        /* Fix horizontal scroll - remove width constraints */
        width: auto !important;
        min-width: 100% !important;
        max-width: none !important; /* Allow to exceed viewport */
        height: auto !important;

        display: flex !important;
        flex-direction: row !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
        position: relative !important;
        box-sizing: content-box !important;
        
        /* Ensure scrollbar is visible */
        scrollbar-width: thin !important;
        -ms-overflow-style: thin !important;
    }
        .pdf-canvas-wrapper canvas {
        width: auto !important;
        height: auto !important;
        max-width: none !important;
        min-width: auto !important;
        display: block !important;
        margin: 0 !important;
        box-sizing: content-box !important;
        transform-origin: top left !important;
        
        /* Ensure canvas can exceed wrapper width */
        position: relative !important;
        flex-shrink: 0 !important;
    }    
        /* Mobile overlay adjustments */
        .pdf-page-overlay {
            font-size: 11px !important;
            padding: 3px 6px !important;
            top: 8px !important;
            right: 8px !important;
        }
        
        /* Mobile image container adjustments */
        .image-container {
            overflow-x: scroll !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: auto !important;
            min-width: 100% !important;
            max-width: none !important; /* Allow to exceed viewport */
            box-sizing: border-box !important;
            position: relative !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-start !important; /* Start from left for scroll */
            align-items: flex-start !important; /* Start from top for scroll */
        }
        
        .image-container img {
            max-width: none !important;
            width: auto !important;
            height: auto !important;
            min-width: auto !important;
            display: block !important;
            margin: 0 !important;
            position: relative !important;
            flex-shrink: 0 !important;
            /* Allow image to exceed container for scroll */
        }
        
        /* Improved controls layout for tablets */
        .pdf-viewer-controls {
            gap: 4px !important;
            padding: 8px 12px !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            background: #ffffff !important;
            border-top: 1px solid #e5e7eb !important;
        }
        .pdf-viewer-button {
            padding: 6px 10px !important;
            font-size: 12px !important;
            min-height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 80px !important;
            border-radius: 6px !important;
        }
    }
    
    @media (max-width: 480px) {
        /* Compact layout for small phones - prevent cutoff */
        .pdf-viewer-controls {
            gap: 3px !important;
            padding: 6px 8px !important;
            flex-wrap: nowrap !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important; /* Distribute evenly */
            overflow-x: auto !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch !important;
            background: #ffffff !important;
            border-top: 1px solid #e5e7eb !important;
            min-height: 50px !important; /* Ensure enough height */
        }
        .pdf-viewer-button {
            padding: 6px 8px !important;
            font-size: 11px !important;
            min-height: 32px !important;
            flex: 1 1 auto !important; /* Equal distribution */
            max-width: 100px !important;
            min-width: 70px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            border-radius: 4px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        /* Page info styling */
        .pdf-viewer-controls > div:not(.pdf-viewer-button) {
            padding: 4px 6px !important;
            font-size: 10px !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 4px !important;
            text-align: center !important;
            flex: 0 0 auto !important;
            min-width: 50px !important;
            font-weight: 600 !important;
        }
        .pdf-canvas-wrapper {
            padding: 2px !important; // Minimal padding
            overflow-x: scroll !important;           // Force scroll
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: auto !important;              // Auto width
            max-width: none !important;           // Tidak batasi max width
            min-width: 100% !important;         // Minimal full width
            box-sizing: content-box !important;     // Content box sizing
            position: relative !important;         // Untuk positioning
            display: flex !important;             // Flex layout
            flex-direction: row !important;      // Row layout
            justify-content: flex-start !important; // Start dari kiri
            align-items: flex-start !important;  // Start dari top
        }
        /* Canvas styling untuk scroll penuh */
        .pdf-canvas-wrapper canvas {
            max-width: none !important;           // Tidak batasi canvas width
            min-width: auto !important;
            width: auto !important;               // Natural width
            height: auto !important;
            display: block !important;
            margin: 0 !important;
            flex-shrink: 0 !important;           // Tidak menyusut
            position: relative !important;         // Untuk layout
            z-index: 1 !important;              // Ensure di atas
            box-sizing: content-box !important;     // Content box sizing
        }
        /* Page info sangat compact di antara tombol */
        .pdf-viewer-controls > div:not(.pdf-viewer-button) {
            order: 0 !important;
            margin: 0 2px !important;               // Margin minimal
            font-size: 10px !important;               // Font lebih kecil
            padding: 2px 4px !important;             // Minimal padding
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 3px !important;               // Radius lebih kecil
            text-align: center !important;
            flex: 0 0 auto !important;
            flex-shrink: 0 !important;               // Tidak menyusut
        }
        /* Hide zoom controls text on very small screens */
        .pdf-viewer-button span {
            display: none !important;
        }
    }
    
    /* Desktop-specific optimizations */
    @media (min-width: 769px) {
        .pdf-canvas-wrapper {
            padding: 12px !important;
            /* Row layout for desktop */
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: flex-start !important;
        }
        .pdf-canvas-wrapper canvas {
            /* Allow larger size on desktop */
            max-width: none !important;
            width: auto !important;
            height: auto !important;
            /* Ensure centering */
            margin: 0 auto !important;
            display: block !important;
        }
    }
    
    /* High DPI display optimizations */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .pdf-canvas-wrapper canvas {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
    }
    
    /* Mobile-specific optimizations */
    @media (max-width: 768px) {
        .pdf-canvas-wrapper canvas {
            /* Prevent blur on mobile devices */
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
        }
    }
    
    /* Prevent blur on zoom */
    .pdf-canvas-wrapper canvas {
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }
    
    /* Ensure proper scrolling indicators on mobile */
    .pdf-canvas-wrapper::-webkit-scrollbar,
    .image-container::-webkit-scrollbar {
        width: 6px;
        height: 8px; /* Taller scrollbar for horizontal scroll */
    }
    
    .pdf-canvas-wrapper::-webkit-scrollbar-track,
    .image-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .pdf-canvas-wrapper::-webkit-scrollbar-thumb,
    .image-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .pdf-canvas-wrapper::-webkit-scrollbar-thumb:hover,
    .image-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
    
    /* Add scroll indicator hint for mobile */
    @media (max-width: 768px) {
        .pdf-canvas-wrapper::after,
        .image-container::after {
            content: '';
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.4));
            border-radius: 50%;
            animation: scrollHint 2s ease-in-out infinite;
            z-index: 20;
            pointer-events: none;
        }
        
        @keyframes scrollHint {
            0%, 100% { 
                opacity: 0.3;
                transform: translateX(0);
            }
            50% { 
                opacity: 0.8;
                transform: translateX(-5px);
            }
        }
        
        /* Hide hint after user starts scrolling */
        .pdf-canvas-wrapper.scrolled::after,
        .image-container.scrolled::after {
            display: none;
        }
    }
`;
if (!document.querySelector("style[data-pdf-styles]")) {
    styleSheet.setAttribute("data-pdf-styles", "true");
    document.head.appendChild(styleSheet);
}

export default function FileViewer({ fileUrl }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [currentScale, setCurrentScale] = useState(1);
    const [fileType, setFileType] = useState(null);
    const [imageScale, setImageScale] = useState(1);
    const [isIOS, setIsIOS] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const pdfRef = useRef(null);
    const renderTaskRef = useRef(null); // Track current render task

    // Detect device type and iOS
    useEffect(() => {
        const detectDevice = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
            const isMobileDevice = window.innerWidth <= 768 || /android|iphone|ipad|ipod/.test(userAgent);
            
            setIsIOS(isIOSDevice);
            setIsMobile(isMobileDevice);
        };
        
        detectDevice();
        
        // Re-detect on resize (debounced)
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(detectDevice, 150);
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    // Detect file type FIRST, before any other effects
    useEffect(() => {
        if (!fileUrl) return;

        const urlParts = fileUrl.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const extension = fileName.includes(".")
            ? fileName.split(".").pop()?.toLowerCase()
            : null;
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

        const detectFileType = async () => {
            // First try extension-based detection
            if (extension === "pdf") {
                setFileType("pdf");
                return;
            } else if (imageExtensions.includes(extension)) {
                setFileType("image");
                return;
            }

            // For unknown extensions, try content-based detection first (more reliable than headers)
            
            try {
                // Try to detect by reading first few bytes (most reliable)
                const contentResponse = await fetch(fileUrl, {
                    method: "GET",
                    headers: { Range: "bytes=0-1024" },
                });
                const buffer = await contentResponse.arrayBuffer();
                const bytes = new Uint8Array(buffer);

                // Check for file signatures
                if (bytes.length >= 4) {
                    // JPEG: FF D8 FF
                    if (
                        bytes[0] === 0xff &&
                        bytes[1] === 0xd8 &&
                        bytes[2] === 0xff
                    ) {
                        setFileType("image");
                        return;
                    }
                    // PNG: 89 50 4E 47
                    else if (
                        bytes[0] === 0x89 &&
                        bytes[1] === 0x50 &&
                        bytes[2] === 0x4e &&
                        bytes[3] === 0x47
                    ) {
                        setFileType("image");
                        return;
                    }
                    // PDF: 25 50 44 46 (%PDF)
                    else if (
                        bytes[0] === 0x25 &&
                        bytes[1] === 0x50 &&
                        bytes[2] === 0x44 &&
                        bytes[3] === 0x46
                    ) {
                        setFileType("pdf");
                        return;
                    }
                }

                // If content detection fails, fall back to headers (less reliable)
                const response = await fetch(fileUrl, { method: "HEAD" });
                const contentType = response.headers.get("content-type");

                if (contentType === "application/pdf") {
                    setFileType("pdf");
                } else if (contentType && contentType.startsWith("image/")) {
                    setFileType("image");
                } else {
                    setFileType("unknown");
                }
            } catch (error) {
                setFileType("unknown");
            }
        };

        detectFileType();
    }, [fileUrl]);

    // Load file on component mount
    useEffect(() => {
        if (!fileUrl) {
            setError("No file URL provided");
            setLoading(false);
            return;
        }

        // Load file ONLY after file type is determined
        if (!fileType || fileType === "unknown") {
            return;
        }

        const loadFile = async () => {
            try {
                setLoading(true);
                setError(null);

                if (fileType === "pdf") {
                    try {
                        // Load PDF document with additional options
                        const loadingTask = getDocument({
                            url: fileUrl,
                            cMapUrl:
                                "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
                            cMapPacked: true,
                            standardFontDataUrl:
                                "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
                        });

                        const pdf = await loadingTask.promise;
                        pdfRef.current = pdf;
                        setNumPages(pdf.numPages);
                        setLoading(false);
                    } catch (pdfError) {
                        setError("Failed to load PDF file. The file might be corrupted or not a valid PDF.");
                        setLoading(false);
                    }
                } else if (fileType === "image") {
                    // For images, just set loading to false after a short delay
                    setTimeout(() => {
                        setLoading(false);
                    }, 300); // Reduced delay
                } else {
                    throw new Error("Unsupported file type");
                }
            } catch (err) {
                let errorMsg = "Failed to load file";

                if (err.name === "UnexpectedResponseException") {
                    errorMsg = "File not found or inaccessible";
                } else if (err.name === "InvalidPDFException") {
                    errorMsg = "Invalid or corrupted PDF file";
                } else if (err.name === "MissingPDFException") {
                    errorMsg = "PDF file is missing";
                } else if (err.message) {
                    errorMsg = `File loading error: ${err.message}`;
                }

                setError(errorMsg);
                setLoading(false);
            }
        };

        loadFile();
    }, [fileUrl, fileType]);

    // Render canvas AFTER PDF is loaded AND canvas is mounted
    useEffect(() => {
        if (
            fileType !== "pdf" ||
            !pdfRef.current ||
            numPages === 0 ||
            loading ||
            error
        ) {
            return;
        }

        const renderFirstPage = async () => {
            try {
                if (canvasRef.current) {
                    await renderPageContent(pdfRef.current, 1);
                    setPageNum(1);
                }
            } catch (err) {
                setError(
                    `Error rendering PDF: ${err?.message || "Unknown error"}`
                );
            }
        };

        // Small delay to ensure canvas is in DOM
        const timeout = setTimeout(renderFirstPage, 100);
        return () => clearTimeout(timeout);
    }, [numPages, loading, error, fileType]);

    // Calculate responsive scale based on container width
    const calculateScale = (containerWidth, pageWidth) => {
        if (!containerWidth || !pageWidth) return 1;
        const availableWidth = containerWidth - 32;
        return Math.max(0.5, availableWidth / pageWidth);
    };

    // Render PDF page on canvas
    const renderPageContent = async (pdf, pageNumber, customScale = null) => {
        if (!canvasRef.current) {
            throw new Error("Canvas ref is null");
        }

        // Cancel any existing render task
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
        }

        const page = await pdf.getPage(pageNumber);

        // Use custom scale if provided, otherwise calculate smart scaling
        let scale;
        if (customScale) {
            scale = customScale;
        } else {
            // Responsive scaling: berdasarkan container, bukan window
            const canvasWrapper = canvasRef.current?.parentElement;
            const containerWidth = canvasWrapper?.clientWidth || 800; // Fallback ke 800px
            const isMobile = containerWidth <= 768;
            const isTablet = containerWidth <= 1024;

            if (isMobile) {
                // Mobile: fit ke container width dengan padding
                const padding = 32; // 16px padding kiri+kanan
                const targetWidth = Math.max(containerWidth - padding, 300);
                const pageWidth = page.getViewport({ scale: 1 }).width;
                scale = targetWidth / pageWidth;

                // Clamp scale untuk mobile - tidak auto-zoom
                scale = Math.max(scale, 0.6);
                scale = Math.min(scale, 0.9);
            } else if (isTablet) {
                // Tablet: sedikit lebih besar
                const targetWidth = containerWidth * 0.9;
                const pageWidth = page.getViewport({ scale: 1 }).width;
                scale = targetWidth / pageWidth;
                scale = Math.max(scale, 0.8);
                scale = Math.min(scale, 1.2);
            } else {
                // Desktop: lebih besar untuk readability
                const targetWidth = containerWidth * 0.85;
                const pageWidth = page.getViewport({ scale: 1 }).width;
                scale = targetWidth / pageWidth;
                scale = Math.max(scale, 1.0);
                scale = Math.min(scale, 2.0);
            }
        }

        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Canvas context is null");
        }

        // Get device pixel ratio untuk sharp rendering - dibatasi di mobile
        const isMobileDevice = window.innerWidth <= 768;
        const dpr = isMobileDevice
            ? Math.min(window.devicePixelRatio || 1, 1.25) // Maks 1.25 di mobile
            : Math.min(window.devicePixelRatio || 1, 2); // Maks 2 di desktop

        // Calculate optimal canvas size
        const canvasWidth = Math.floor(viewport.width * dpr);
        const canvasHeight = Math.floor(viewport.height * dpr);

        // Set canvas bitmap size (actual resolution)
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Set visual size (CSS size) - gunakan natural size untuk scroll penuh
        const naturalViewport = page.getViewport({ scale: 1 });
        canvas.style.width = `${naturalViewport.width}px`;
        canvas.style.height = `${naturalViewport.height}px`;

        // Tidak ada forcing min/max width di mobile - biarkan natural flow

        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // Clear canvas and set proper transform
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Render page dengan display intent untuk performa mobile yang lebih baik
        const renderTask = page.render({
            canvasContext: context,
            viewport,
            intent: "display", // Gunakan display intent untuk mobile-friendly rendering
        });

        // Store render task for cancellation
        renderTaskRef.current = renderTask;

        try {
            await renderTask.promise;
            renderTaskRef.current = null;
            // Update current scale state
            setCurrentScale(scale);
        } catch (err) {
            renderTaskRef.current = null;
            if (err.message && err.message.includes("cancelled")) {
                return; // Don't throw error for cancelled renders
            }
            throw err;
        }
    };

    // Navigate to next page
    const handleNextPage = async () => {
        if (pageNum < numPages && canvasRef.current) {
            const newPage = pageNum + 1;
            try {
                if (pdfRef.current) {
                    await renderPageContent(
                        pdfRef.current,
                        newPage,
                        currentScale
                    );
                    setPageNum(newPage);
                    canvasRef.current?.scrollIntoView({ behavior: "smooth" });
                }
            } catch (err) {
                setError("Error navigating to next page");
            }
        }
    };

    // Navigate to previous page
    const handlePrevPage = async () => {
        if (pageNum > 1 && canvasRef.current) {
            const newPage = pageNum - 1;
            try {
                if (pdfRef.current) {
                    await renderPageContent(
                        pdfRef.current,
                        newPage,
                        currentScale
                    );
                    setPageNum(newPage);
                    canvasRef.current?.scrollIntoView({ behavior: "smooth" });
                }
            } catch (err) {
                setError("Error navigating to previous page");
            }
        }
    };

    // Download PDF
    const handleDownload = () => {
        if (fileUrl) {
            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = `document.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Zoom controls
    const handleZoomIn = async () => {
        if (pdfRef.current && canvasRef.current) {
            const newScale = Math.min(currentScale + 0.15, 2.5); // Max 2.5x zoom, smaller increments
            try {
                await renderPageContent(pdfRef.current, pageNum, newScale);
            } catch (err) {
                setError("Error zooming in");
            }
        }
    };

    const handleZoomOut = async () => {
        if (pdfRef.current && canvasRef.current) {
            const newScale = Math.max(currentScale - 0.15, 0.6); // Min 0.6x zoom
            try {
                await renderPageContent(pdfRef.current, pageNum, newScale);
            } catch (err) {
                setError("Error zooming out");
            }
        }
    };

    const handleZoomReset = async () => {
        if (pdfRef.current && canvasRef.current) {
            try {
                await renderPageContent(pdfRef.current, pageNum); // Reset to auto scale
            } catch (err) {
                setError("Error resetting zoom");
            }
        }
    };

    // Image zoom controls
    const handleImageZoomIn = () => {
        setImageScale(prevScale => {
            const newScale = Math.min(prevScale + 0.25, 3.0);
            return newScale;
        });
    };

    const handleImageZoomOut = () => {
        setImageScale(prevScale => {
            const newScale = Math.max(prevScale - 0.25, 0.5);
            return newScale;
        });
    };

    const handleImageZoomReset = () => {
        setImageScale(1);
    };

    // Handle window resize for responsive scaling
    useEffect(() => {
        let resizeTimeout;

        const handleResize = async () => {
            // Clear previous timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            // Debounce resize events
            resizeTimeout = setTimeout(async () => {
                if (pdfRef.current && pageNum > 0 && canvasRef.current) {
                    try {
                        await renderPageContent(
                            pdfRef.current,
                            pageNum,
                            currentScale
                        );
                    } catch (err) {
                        // Handle re-rendering error silently
                    }
                }
            }, 150); // 150ms debounce
        };

        // Handle mouse wheel zoom for images
        const handleWheel = (e) => {
            if (fileType === "image" && e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    handleImageZoomIn();
                } else {
                    handleImageZoomOut();
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Add wheel event listener for image zoom
        if (fileType === "image" && containerRef.current) {
            containerRef.current.addEventListener("wheel", handleWheel, { passive: false });
        }

        // Handle scroll to hide scroll hint
        const handleScroll = () => {
            const wrapper = containerRef.current?.querySelector(
                ".pdf-canvas-wrapper"
            );
            if (wrapper) {
                wrapper.classList.add("scrolled");
            }
        };

        // Add scroll listener to canvas wrapper
        const canvasWrapper = containerRef.current?.querySelector(
            ".pdf-canvas-wrapper"
        );
        if (canvasWrapper) {
            canvasWrapper.addEventListener("scroll", handleScroll);
        }

        // Keyboard navigation
        const handleKeyDown = (e) => {
            if (fileType === "image") {
                switch (e.key) {
                    case "+":
                    case "=":
                        e.preventDefault();
                        handleImageZoomIn();
                        break;
                    case "-":
                    case "_":
                        e.preventDefault();
                        handleImageZoomOut();
                        break;
                    case "0":
                        e.preventDefault();
                        handleImageZoomReset();
                        break;
                }
                return;
            }

            if (!pdfRef.current || !canvasRef.current) return;

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    handlePrevPage();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    handleNextPage();
                    break;
                case "+":
                case "=":
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case "-":
                case "_":
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case "0":
                    e.preventDefault();
                    handleZoomReset();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            resizeObserver.disconnect();
            // Clear timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            // Remove wheel event listener
            if (fileType === "image" && containerRef.current) {
                containerRef.current.removeEventListener("wheel", handleWheel);
            }
            // Remove scroll listener
            if (canvasWrapper) {
                canvasWrapper.removeEventListener("scroll", handleScroll);
            }
            // Cancel any ongoing render task
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (err) {
                    // Handle cleanup error silently
                }
                renderTaskRef.current = null;
            }
            // Remove keyboard listener
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [pageNum, currentScale, fileType]);

    return (
        <div
            style={styles.container}
            ref={containerRef}
            className="pdf-viewer-container"
        >
            {/* Error State */}
            {error && !loading && (
                <div style={styles.errorContainer}>
                    <div style={styles.errorBox}>
                        <div style={styles.errorTitle}>Error Loading File</div>
                        <div style={styles.errorText}>{error}</div>
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.errorLink}
                            >
                                Open Document
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && !error && (
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <div style={styles.spinnerText}>
                        Loading {fileType === "image" ? "Image..." : "PDF..."}
                    </div>
                </div>
            )}

            {/* No URL State */}
            {!fileUrl && !loading && !error && (
                <div style={styles.errorContainer}>
                    <div style={styles.errorBox}>
                        <div style={styles.errorTitle}>No File</div>
                        <div style={styles.errorText}>
                            No file URL was provided
                        </div>
                    </div>
                </div>
            )}

            {/* File Content */}
            {!error && !loading && fileUrl && (
                <>
                    {fileType === "image" ? (
                        <>
                            {/* Image Display */}
                            <div
                                style={styles.imageContainer}
                                className="image-container"
                            >
                                <img
                                    ref={imageRef}
                                    src={fileUrl}
                                    alt="Document preview"
                                    crossOrigin="anonymous"
                                    style={{
                                        ...styles.image,
                                        // Safari iOS compatible zoom - use width/height instead of transform
                                        ...(isIOS ? {
                                            width: imageScale === 1 ? 'auto' : `${imageScale * 100}%`,
                                            height: imageScale === 1 ? 'auto' : `${imageScale * 100}%`,
                                            maxWidth: 'none',
                                            transform: 'none',
                                        } : {
                                            transform: `scale(${imageScale})`,
                                            transformOrigin: 'top left',
                                        }),
                                        // Responsive sizing based on screen
                                        ...(isMobile && !isIOS
                                            ? {
                                                  // Mobile non-iOS: allow natural size for scroll
                                                  maxWidth: "none",
                                                  minWidth: "auto",
                                              }
                                            : {}),
                                        // Desktop constraints
                                        ...(!isMobile && !isIOS
                                            ? {
                                                  maxWidth: "90vw",
                                                  maxHeight: "80vh",
                                              }
                                            : {}),
                                    }}
                                    draggable={false}
                                    onLoad={(e) => {
                                        setLoading(false);

                                        // Safari iOS specific handling
                                        if (isIOS) {
                                            const img = e.target;
                                            // Force reflow to ensure proper rendering
                                            img.style.display = 'none';
                                            img.offsetHeight; // Force reflow
                                            img.style.display = 'block';
                                            
                                            // Add scroll hint if image is larger than container
                                            const container = img.parentElement;
                                            if (
                                                img.naturalWidth *
                                                    imageScale >
                                                    container.clientWidth ||
                                                img.naturalHeight *
                                                    imageScale >
                                                    container.clientHeight
                                            ) {
                                                // Enable scroll for large images
                                            }
                                        } else {
                                            // Non-iOS handling
                                            const img = e.target;
                                            const container = img.parentElement;
                                            if (
                                                img.naturalWidth *
                                                    imageScale >
                                                    container.clientWidth ||
                                                img.naturalHeight *
                                                    imageScale >
                                                    container.clientHeight
                                            ) {
                                                // Enable scroll for large images
                                            }
                                        }
                                    }}
                                    onError={(e) => {
                                        // Safari iOS specific error handling
                                        if (isIOS) {
                                            // Try loading without crossOrigin for iOS
                                            const img = e.target;
                                            img.removeAttribute('crossorigin');
                                            img.src = fileUrl; // Retry without crossorigin
                                            
                                            img.onerror = () => {
                                                setError("Failed to load image");
                                                setLoading(false);
                                            };
                                        } else {
                                            setError("Failed to load image");
                                            setLoading(false);
                                        }
                                    }}
                                />
                            </div>

                            {/* Image Controls */}
                            <div
                                style={styles.controlsContainer}
                                className="pdf-viewer-controls"
                            >
                                {/* Zoom controls for images */}
                                {(!isMobile || isIOS) && (
                                    <>
                                        <button
                                            style={styles.button}
                                            onClick={handleImageZoomOut}
                                            title="Zoom Out"
                                        >
                                            −
                                        </button>

                                        <button
                                            style={styles.button}
                                            onClick={handleImageZoomReset}
                                            title="Reset Zoom"
                                        >
                                            Reset
                                        </button>

                                        <button
                                            style={styles.button}
                                            onClick={handleImageZoomIn}
                                            title="Zoom In"
                                        >
                                            +
                                        </button>
                                    </>
                                )}

                                <button
                                    style={styles.button}
                                    onClick={() =>
                                        window.open(fileUrl, "_blank")
                                    }
                                    title="Open in new tab"
                                >
                                    Open in New Tab
                                </button>
                            </div>
                        </>
                    ) : fileType === "pdf" ? (
                        <>
                            {/* PDF Page Info Overlay */}
                            {numPages > 0 && (
                                <div
                                    className="pdf-page-overlay"
                                    style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                                        color: "white",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        zIndex: 10,
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
                                    }}
                                >
                                    {pageNum} / {numPages}
                                </div>
                            )}
                            <div
                                style={styles.canvasWrapper}
                                className="pdf-canvas-wrapper"
                            >
                                <canvas ref={canvasRef} style={styles.canvas} />
                            </div>

                            {/* PDF Controls */}
                            {numPages >= 1 && (
                                <div
                                    style={styles.controlsContainer}
                                    className="pdf-viewer-controls"
                                >
                                    {numPages > 1 && (
                                        <>
                                            <button
                                                style={{
                                                    ...styles.button,
                                                    ...(pageNum <= 1
                                                        ? styles.buttonDisabled
                                                        : {}),
                                                }}
                                                onClick={handlePrevPage}
                                                disabled={pageNum <= 1}
                                            >
                                                ← Previous
                                            </button>

                                            <span style={styles.pageInfo}>
                                                {pageNum} / {numPages}
                                            </span>

                                            <button
                                                style={{
                                                    ...styles.button,
                                                    ...(pageNum >= numPages
                                                        ? styles.buttonDisabled
                                                        : {}),
                                                }}
                                                onClick={handleNextPage}
                                                disabled={pageNum >= numPages}
                                            >
                                                Next →
                                            </button>
                                        </>
                                    )}

                                    {/* Zoom controls - only on desktop */}
                                    {window.innerWidth > 768 && (
                                        <>
                                            <button
                                                style={styles.button}
                                                onClick={handleZoomOut}
                                                title="Zoom Out"
                                            >
                                                −
                                            </button>

                                            <button
                                                style={styles.button}
                                                onClick={handleZoomReset}
                                                title="Reset Zoom"
                                            >
                                                Reset
                                            </button>

                                            <button
                                                style={styles.button}
                                                onClick={handleZoomIn}
                                                title="Zoom In"
                                            >
                                                +
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={styles.errorContainer}>
                            <div style={styles.errorBox}>
                                <div style={styles.errorTitle}>
                                    Unsupported File Type
                                </div>
                                <div style={styles.errorText}>
                                    This file type cannot be previewed. Please
                                    download the file to view it.
                                </div>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.errorLink}
                                >
                                    Open File
                                </a>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
