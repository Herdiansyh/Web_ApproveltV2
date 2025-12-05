import { useState, useEffect, useCallback } from 'react';
import { useDataCache } from '@/Contexts/DataContext';

export const useInfiniteScroll = (fetchUrl, initialData = []) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const { getCachedData, updateCache } = useDataCache();

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        
        try {
            const cacheKey = `${fetchUrl}_page_${page}`;
            const cachedData = getCachedData(cacheKey, 60000); // 1 minute cache for pagination
            
            if (cachedData) {
                setData(prev => [...prev, ...cachedData.data]);
                setHasMore(cachedData.next_page_url !== null);
                setPage(prev => prev + 1);
            } else {
                // Fetch new data
                const response = await fetch(`${fetchUrl}?page=${page}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    }
                });
                
                const newData = await response.json();
                
                setData(prev => [...prev, ...newData.data]);
                setHasMore(newData.next_page_url !== null);
                setPage(prev => prev + 1);
                
                // Cache the result
                updateCache(cacheKey, newData);
            }
        } catch (error) {
            console.error('Error loading more data:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchUrl, page, loading, hasMore, getCachedData, updateCache]);

    const reset = useCallback(() => {
        setData(initialData);
        setPage(1);
        setHasMore(true);
        setLoading(false);
    }, [initialData]);

    return {
        data,
        loading,
        hasMore,
        loadMore,
        reset
    };
};

export default useInfiniteScroll;
