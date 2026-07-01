/**
 * This module manages URL parameters for the catalog application: parsing, updating, and reflecting the
 * current filter state in the URL for shareable searches.
 */

/**
 * Parses URL parameters from both query string (?key=value) and hash (#key=value).
 * Query parameters take precedence over hash parameters.
 * @returns {Object} An object containing the parsed parameters.
 */
export const parseUrlParams = () => {
    const params = {};

    // Parse query string parameters (e.g., ?type=datasets&q=fish)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    // Parse hash parameters (e.g., #type=datasets&q=fish)
    const hash = window.location.hash.slice(1); // Remove the leading '#'
    const hashParams = new URLSearchParams(hash);

    // Hash parameters first (lower precedence)
    for (const [key, value] of hashParams) {
        params[key] = value;
    }

    // Query parameters override hash parameters (higher precedence)
    for (const [key, value] of urlParams) {
        params[key] = value;
    }

    return params;
};

/**
 * Updates the URL hash with the current filter state without triggering a page reload.
 * @param {Object} state - The current state object with type, q, sort, tag properties.
 */
export const updateUrlParams = (state) => {
    const params = new URLSearchParams();

    // Only add non-default values to the URL
    if (state.type && state.type !== 'all') {
        params.set('type', state.type);
    }
    if (state.q && state.q.trim() !== '') {
        params.set('q', state.q);
    }
    if (state.sort && state.sort !== 'lastModified') {
        params.set('sort', state.sort);
    }
    if (state.tag && state.tag !== '') {
        params.set('tag', state.tag);
    }
    if (state.archived && state.archived !== 'active') {
        params.set('archived', state.archived);
    }

    const paramString = params.toString();
    const newHash = paramString ? `#${paramString}` : '';

    // Build the new URL preserving the pathname and any query parameters when clearing hash
    const baseUrl = window.location.pathname + window.location.search;
    const newUrl = newHash ? baseUrl + newHash : baseUrl;

    // Update the URL without triggering a page reload
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (currentUrl !== newUrl) {
        history.replaceState(null, '', newUrl);
    }
};

/**
 * Gets the current filter state from form elements.
 * @returns {Object} The current state object.
 */
export const getCurrentState = () => {
    return {
        type: document.getElementById('repoType')?.value || 'all',
        q: document.getElementById('searchInput')?.value || '',
        sort: document.getElementById('sortBy')?.value || 'lastModified',
        tag: document.getElementById('tagFilter')?.value || '',
        archived: document.getElementById('archiveFilter')?.value || 'active'
    };
};
