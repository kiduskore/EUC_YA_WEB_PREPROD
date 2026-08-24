/**
 * @fileoverview Enhanced, type-safe API client for the EUC dashboard.
 * Implements standard error handling, cache busting, and telemetry hooks.
 */

/**
 * @typedef {Object} ApiOptions
 * @property {string} [method='GET'] - The HTTP method
 * @property {Object} [body] - The JSON payload to send
 * @property {Object} [headers] - Additional HTTP headers
 * @property {string} [cache='no-store'] - Cache policy
 */

/**
 * Core API Client for communicating with the Flask backend.
 * @param {string} url - The API endpoint route
 * @param {ApiOptions} options - Fetch options
 * @returns {Promise<any>} The parsed JSON response or null on explicit 204
 * @throws {Error} When the network fails or the server returns an error payload
 */
export const apiClient = async (url, options = {}) => {
    try {
        options.cache = options.cache || 'no-store'; // Prevent aggressive iOS Safari caching
        
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
            
            // Extract CSRF token from cookie
            const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
            const csrfToken = csrfCookie ? csrfCookie.split('=')[1] : '';
            
            options.headers = { 
                'Content-Type': 'application/json', 
                'X-CSRF-Token': csrfToken,
                ...(options.headers || {}) 
            };
        }

        // Hard cache-buster for older iOS Safari versions on GET requests
        const isGetRequest = !options.method || options.method === 'GET';
        const finalUrl = isGetRequest 
            ? `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}` 
            : url;

        const response = await fetch(finalUrl, options);

        // Security / Auth guard
        if (response.status === 401) { 
            console.warn(`[API] Unauthorized access attempt to ${url}. Redirecting to login.`);
            window.location.href = '/login'; 
            return null; 
        }

        // Empty response guard
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        // Standardized backend error handling guard
        if (!response.ok || data.error) {
            const errorMessage = data.error || `HTTP ${response.status} - ${response.statusText}`;
            console.error(`[API Error] ${url}:`, errorMessage);
            throw new Error(errorMessage);
        }

        return data;
    } catch (e) {
        console.error(`[API Exception] Failed to fetch ${url}:`, e);
        throw e; // Rethrow to allow UI layer to present error toasts/alerts
    }
};
