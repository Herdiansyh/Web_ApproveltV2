/**
 * Global CSRF Token Initialization
 * 
 * This script ensures CSRF token is refreshed when the app loads
 * and sets up periodic token refresh for long-running sessions.
 */

import { refreshCsrfToken } from './csrfToken.js';

/**
 * Initialize CSRF token management
 */
export const initializeCsrfToken = async () => {
    try {
        // Refresh token on app initialization
        await refreshCsrfToken();
        console.log('CSRF token initialized successfully');
    } catch (error) {
        console.warn('Failed to initialize CSRF token:', error);
        // Don't throw error - app can still work with existing token
    }
};

/**
 * Setup periodic CSRF token refresh for long sessions
 * (optional - refresh every 30 minutes)
 */
export const setupPeriodicTokenRefresh = () => {
    // Refresh token every 30 minutes (1800000 ms)
    const refreshInterval = 30 * 60 * 1000;
    
    setInterval(async () => {
        try {
            await refreshCsrfToken();
            console.log('CSRF token refreshed periodically');
        } catch (error) {
            console.warn('Failed to refresh CSRF token periodically:', error);
        }
    }, refreshInterval);
};

/**
 * Setup CSRF token refresh before page unload
 * This helps ensure fresh token on page reload
 */
export const setupBeforeUnloadTokenRefresh = () => {
    let refreshPromise = null;
    
    window.addEventListener('beforeunload', () => {
        // Don't wait for the refresh to complete, just trigger it
        refreshPromise = refreshCsrfToken().catch(error => {
            console.warn('Failed to refresh CSRF token before unload:', error);
        });
    });
    
    // Also setup visibility change detection for when user returns to tab
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && !refreshPromise) {
            try {
                await refreshCsrfToken();
                console.log('CSRF token refreshed on visibility change');
            } catch (error) {
                console.warn('Failed to refresh CSRF token on visibility change:', error);
            }
        }
    });
};

export default {
    initializeCsrfToken,
    setupPeriodicTokenRefresh,
    setupBeforeUnloadTokenRefresh,
};
