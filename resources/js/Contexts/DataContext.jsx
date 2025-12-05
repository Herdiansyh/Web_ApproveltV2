import React, { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

export const useDataCache = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataCache must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const [cache, setCache] = useState({
        submissions: null,
        submissionsForDivision: null,
        submissionsHistory: null,
        lastFetch: {},
    });

    const [loading, setLoading] = useState(false);

    const updateCache = useCallback((key, data) => {
        setCache(prev => ({
            ...prev,
            [key]: data,
            lastFetch: {
                ...prev.lastFetch,
                [key]: Date.now()
            }
        }));
    }, []);

    const getCachedData = useCallback((key, maxAge = 5 * 60 * 1000) => { // 5 minutes cache
        const data = cache[key];
        const lastFetch = cache.lastFetch[key];
        
        if (!data || !lastFetch) return null;
        
        const isExpired = Date.now() - lastFetch > maxAge;
        return isExpired ? null : data;
    }, [cache]);

    const clearCache = useCallback((key) => {
        if (key) {
            setCache(prev => ({
                ...prev,
                [key]: null,
                lastFetch: {
                    ...prev.lastFetch,
                    [key]: null
                }
            }));
        } else {
            setCache({
                submissions: null,
                submissionsForDivision: null,
                submissionsHistory: null,
                lastFetch: {},
            });
        }
    }, []);

    return (
        <DataContext.Provider value={{
            cache,
            loading,
            setLoading,
            updateCache,
            getCachedData,
            clearCache
        }}>
            {children}
        </DataContext.Provider>
    );
};

export default DataProvider;
