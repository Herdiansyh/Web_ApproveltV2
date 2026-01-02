/**
 * CSRF Token Management Utilities
 * 
 * This utility handles CSRF token refresh to prevent mismatch errors
 * after login when switching between user accounts in the same browser.
 */

/**
 * Get current CSRF token from meta tag
 * @returns {string|null} The CSRF token or null if not found
 */
export const getCurrentCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
};

/**
 * Update CSRF token in meta tag
 * @param {string} token - The new CSRF token
 */
export const updateCsrfToken = (token) => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        meta.setAttribute('content', token);
    }
};

/**
 * Fetch fresh CSRF token from server
 * @returns {Promise<string>} The fresh CSRF token
 * @throws {Error} If unable to fetch token
 */
export const fetchFreshCsrfToken = async () => {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.token) {
            throw new Error('CSRF token not found in response');
        }

        return data.token;
    } catch (error) {
        throw error;
    }
};

/**
 * Refresh CSRF token and update meta tag
 * @returns {Promise<string>} The fresh CSRF token
 * @throws {Error} If unable to refresh token
 */
export const refreshCsrfToken = async () => {
    const freshToken = await fetchFreshCsrfToken();
    updateCsrfToken(freshToken);
    return freshToken;
};

/**
 * Get CSRF token with auto-refresh if needed
 * This function ensures we always have a valid token
 * @returns {Promise<string>} The CSRF token
 */
export const getValidCsrfToken = async () => {
    const currentToken = getCurrentCsrfToken();
    
    // If we have a token, try to use it first
    if (currentToken) {
        return currentToken;
    }
    
    // If no token found, fetch a fresh one
    try {
        return await refreshCsrfToken();
    } catch (error) {
        throw new Error('CSRF token tidak tersedia. Silakan refresh halaman.');
    }
};

/**
 * Setup CSRF token refresh after login
 * This should be called after successful login to ensure token sync
 */
export const setupCsrfTokenAfterLogin = async () => {
    try {
        // Refresh token to ensure we have the latest one
        await refreshCsrfToken();
    } catch (error) {
        // Don't throw error here, just log it as the token might still be valid
    }
};

/**
 * Enhanced fetch wrapper that includes CSRF token handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const fetchWithCsrf = async (url, options = {}) => {
    const defaultOptions = {
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    };

    // Only set Content-Type if not already set and body is not FormData
    if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    // Get current CSRF token
    const csrfToken = getCurrentCsrfToken();
    if (csrfToken) {
        defaultOptions.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        // Handle redirects (usually authentication issues)
        if (response.redirected || (response.status >= 300 && response.status < 400)) {
            throw new Error('Request di-redirect. Silakan login kembali.');
        }
        
        // Handle CSRF mismatch (419)
        if (response.status === 419) {
            
            try {
                // Refresh token and retry once
                const freshToken = await refreshCsrfToken();
                mergedOptions.headers['X-CSRF-TOKEN'] = freshToken;
                
                return await fetch(url, mergedOptions);
            } catch (refreshError) {
                throw new Error('CSRF token mismatch. Silakan refresh halaman.');
            }
        }
        
        // Check if response is HTML (error page) instead of expected JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html') && !response.ok) {
            // Server returned HTML error page
            throw new Error('Server error: Halaman error dikembalikan. Silakan periksa log server.');
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

export default {
    getCurrentCsrfToken,
    updateCsrfToken,
    fetchFreshCsrfToken,
    refreshCsrfToken,
    getValidCsrfToken,
    setupCsrfTokenAfterLogin,
    fetchWithCsrf,
};
