import { router } from '@inertiajs/react';
import { useDataCache } from '@/Contexts/DataContext';

export const useOptimizedNavigation = () => {
    const { getCachedData, updateCache, setLoading, clearCache } = useDataCache();

    const navigateWithCache = (url, options = {}) => {
        const cacheKey = getCacheKeyFromUrl(url);
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData && !options.forceRefresh) {
            // Use cached data for instant navigation
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
                replace: true, // Don't add to history
                ...options,
                onSuccess: (page) => {
                    // Update cache with fresh data
                    updateCache(cacheKey, page.props);
                    options.onSuccess?.(page);
                },
                onStart: () => {
                    setLoading(false); // No loading indicator for cached navigation
                    options.onStart?.();
                }
            });
        } else {
            // Normal navigation with loading
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
                ...options,
                onSuccess: (page) => {
                    updateCache(cacheKey, page.props);
                    options.onSuccess?.(page);
                },
                onStart: () => {
                    setLoading(true);
                    options.onStart?.();
                },
                onFinish: () => {
                    setLoading(false);
                    options.onFinish?.();
                }
            });
        }
    };

    const refreshData = (url) => {
        const cacheKey = getCacheKeyFromUrl(url);
        clearCache(cacheKey);
        navigateWithCache(url, { forceRefresh: true });
    };

    return {
        navigateWithCache,
        refreshData
    };
};

const getCacheKeyFromUrl = (url) => {
    if (url.includes('/submissions')) {
        if (url.includes('/for-division')) return 'submissionsForDivision';
        if (url.includes('/history')) return 'submissionsHistory';
        return 'submissions';
    }
    return 'other';
};

export default useOptimizedNavigation;
