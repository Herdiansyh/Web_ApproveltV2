import React, { useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOptimizedNavigation } from '@/Hooks/useOptimizedNavigation';

export default function OptimizedPagination({ links, className = "" }) {
    const { navigateWithCache } = useOptimizedNavigation();
    const [loadingPage, setLoadingPage] = useState(null);

    const handlePageClick = useCallback((url, page) => {
        if (!url || url === '#') return;
        
        setLoadingPage(page);
        
        navigateWithCache(url, {
            onFinish: () => setLoadingPage(null),
            preserveScroll: true
        });
    }, [navigateWithCache]);

    if (!links || links.length <= 3) return null;

    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 mt-6 ${className}`}>
            {links.map((link, index) => {
                const pageNumber = getPageNumber(link.label);
                const isActive = link.active;
                const isLoading = loadingPage === pageNumber;
                
                // Skip "Previous" and "Next" text links, create custom buttons instead
                if (link.label.includes('Previous') || link.label.includes('Next')) {
                    return null;
                }
                
                // Handle first page
                if (index === 1 && link.label !== '1') {
                    return (
                        <Button
                            key="first"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageClick(links[1].url, 1)}
                            disabled={isLoading}
                            className="min-w-[2.5rem]"
                        >
                            1
                        </Button>
                    );
                }
                
                // Handle last page
                if (index === links.length - 2 && link.label !== String(links.length - 2)) {
                    return (
                        <React.Fragment key="last-fragment">
                            <span className="px-2 text-sm text-muted-foreground">...</span>
                            <Button
                                key="last"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageClick(links[links.length - 2].url, links.length - 2)}
                                disabled={isLoading}
                                className="min-w-[2.5rem]"
                            >
                                {links.length - 2}
                            </Button>
                        </React.Fragment>
                    );
                }
                
                return (
                    <Button
                        key={index}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageClick(link.url, pageNumber)}
                        disabled={isLoading || !link.url}
                        className={`min-w-[2.5rem] ${isActive ? 'pointer-events-none' : ''}`}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            link.label
                        )}
                    </Button>
                );
            })}
            
            {/* Custom Previous/Next buttons */}
            <div className="flex gap-1 ml-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const prevLink = links.find(link => link.label.includes('Previous'));
                        if (prevLink?.url) {
                            handlePageClick(prevLink.url, 'prev');
                        }
                    }}
                    disabled={!links.find(link => link.label.includes('Previous') && link.url)}
                    className="px-3"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const nextLink = links.find(link => link.label.includes('Next'));
                        if (nextLink?.url) {
                            handlePageClick(nextLink.url, 'next');
                        }
                    }}
                    disabled={!links.find(link => link.label.includes('Next') && link.url)}
                    className="px-3"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

function getPageNumber(label) {
    // Extract number from label, handling HTML entities
    const cleanLabel = label.replace(/&[^;]+;/g, '');
    const match = cleanLabel.match(/\d+/);
    return match ? parseInt(match[0]) : cleanLabel;
}
