//
// Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for code, datasets, models, and spaces.
// Configuration is loaded from config.yaml
//
// SECTION 1: CONFIGURATION AND STATE MANAGEMENT
//

import jsYaml from 'js-yaml';
import { getPlatformApiUrls } from './src/defineApiUrls.js';
import { getPlatformDisplay } from './src/defineRibbonVals.js';
import { filterItems, sortItems } from './src/filterAndSort.js';
import { fetchCodeRepos } from './src/fetchCodeRepos.js';
import { fetchHfRepos } from './src/fetchHfRepos.js';
import { renderItemList } from './src/render.js';

// Start fetching config immediately when the module loads (before DOMContentLoaded)
// so the fetch is in-flight while the DOM is being parsed.
const configPromise = fetch('config.yaml')
    .then(r => {
        if (!r.ok) throw new Error(`Failed to load config.yaml: HTTP ${r.status}`);
        return r.text();
    })
    .then(text => jsYaml.load(text));

// Module-scope lets — assigned after config loads, used by all functions below
let CONFIG;
let ORGANIZATION_NAME, HF_ORGANIZATION_NAME, CATALOG_REPO_NAME, PLATFORM, API_BASE_URL, REFRESH_INTERVAL_DAYS, ADDITIONAL_REPOS, ADDITIONAL_HF_REPOS;
let ORG_API_URL, REPO_API_URL;

// Build a reverse lookup from TAG_GROUPS (defined in tag-groups.js): raw tag → [canonical tags]
// A raw tag may appear in multiple groups, so the value is an array.
const tagLookup = Object.create(null);
if (typeof TAG_GROUPS !== 'undefined') {
    for (const [canonical, aliases] of Object.entries(TAG_GROUPS)) {
        for (const alias of aliases) {
            const key = alias.toLowerCase();
            if (tagLookup[key]) {
                tagLookup[key].push(canonical);
            } else {
                tagLookup[key] = [canonical];
            }
        }
    }
}


let releasesMap = {};

let allItems = {
    code: [],
    datasets: [],
    models: [],
    spaces: []
};
let tagsMap = {
    code: new Set(),
    datasets: new Set(),
    models: new Set(),
    spaces: new Set()
};
let fetchedData = {
    code: false,
    datasets: false,
    models: false,
    spaces: false
};

// Utility function to handle errors and display a user-friendly message
const handleError = (error, message) => {
    console.error(message, error);
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = `<div class="text-red-500 text-center col-span-full p-8 bg-red-100 rounded-lg">
        <p class="font-bold">Error loading items.</p>
        <p>${message}</p>
    </div>`;
};

//
// SECTION 1B: URL PARAMETER HANDLING
//

/**
 * Parses URL parameters from both query string (?key=value) and hash (#key=value).
 * Query parameters take precedence over hash parameters.
 * @returns {Object} An object containing the parsed parameters.
 */
const parseUrlParams = () => {
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
const updateUrlParams = (state) => {
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
const getCurrentState = () => {
    return {
        type: document.getElementById('repoType')?.value || 'all',
        q: document.getElementById('searchInput')?.value || '',
        sort: document.getElementById('sortBy')?.value || 'lastModified',
        tag: document.getElementById('tagFilter')?.value || '',
        archived: document.getElementById('archiveFilter')?.value || 'active'
    };
};

//
// SECTION 2: DATA FETCHING
//

/**
 * Fetches items (code, datasets, models, or spaces) for a given organization from the specified code platform or Hugging Face API.
 * @async
 * @param {string} repoType - The type of repository to fetch ("code", "datasets", "models", or "spaces").
 * @returns {Promise<Array>} An array of item objects.
 */
const fetchHubItems = async (repoType) => {
    if (fetchedData[repoType]) {
        return allItems[repoType];
    }

    const skeletons = document.querySelectorAll('.skeleton-card');
    skeletons.forEach(s => s.classList.remove('hidden'));

    let items = []

    if (repoType === 'code') {
        items = await fetchCodeRepos(
            PLATFORM,
            ADDITIONAL_REPOS,
            ORG_API_URL,
            REPO_API_URL,
            REFRESH_INTERVAL_DAYS,
            releasesMap,
            tagLookup
        );
    } else {
        items = await fetchHfRepos(
            repoType,
            ADDITIONAL_HF_REPOS,
            API_BASE_URL,
            HF_ORGANIZATION_NAME,
            REFRESH_INTERVAL_DAYS,
            tagLookup
        );
    }

    // Store fetched items and mark as fetched
    allItems[repoType] = items;
    fetchedData[repoType] = true;
    items.forEach(item => {
        item.tags.forEach(tag => tagsMap[repoType].add(tag));
    });

    skeletons.forEach(s => s.classList.add('hidden'));

    return items;
};

/**
 * Fetches statistics for the Catalog repository itself (Stars, Forks, Version)
 * populates the badge in the top right corner.
 */
const fetchCatalogStats = async () => {
    // Helper: Updates text, shows the specific stat, and ensures the divider is visible
    const update = (textId, containerId, value) => {
        const el = document.getElementById(textId);
        const container = document.getElementById(containerId);
        if (el && container && value !== undefined) {
            el.innerText = value;
            if (value != 0) {
                container.classList.remove('hidden');
                container.classList.add('flex');
            }
        }
    };

    try {
        //TODO: Update stars and forks to support other platforms (GitLab, Codeberg) once implemented
        // 1. Get Stars & Forks
        const repo = await fetch(`${REPO_API_URL}${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}`).then(r => r.ok ? r.json() : {});
        if (repo.stargazers_count !== undefined) update('gh-stars', 'gh-star-container', repo.stargazers_count);
        if (repo.forks_count !== undefined) update('gh-forks', 'gh-fork-container', repo.forks_count);

        // 2. Get Version (Tag)
        // TODO: Import from package.json
        const release = await fetch(`${REPO_API_URL}${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}/releases/latest`).then(r => r.ok ? r.json() : {});
        if (release.tag_name) update('gh-tag', 'gh-version-container', release.tag_name);

    } catch (e) {
        console.warn("Could not fetch Code Repo stats", e);
    }
};

//
// SECTION 3: SEARCH, FILTER, AND SORT LOGIC
//

/**
 * Applies all filters and sorting to the items and re-renders the list.
 * @param {boolean} updateUrl - Whether to update the URL with the current state (default: true).
 */
const applyFiltersAndSort = async (updateUrl = true) => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const repoType = document.getElementById('repoType').value;
    const archiveFilter = document.getElementById('archiveFilter').value;
    let currentItems;

    // Update URL with current state if requested
    if (updateUrl) {
        updateUrlParams(getCurrentState());
    }

    if (repoType === "all") {
        currentItems = [
            ...allItems.code,
            ...allItems.datasets,
            ...allItems.models,
            ...allItems.spaces
        ];
    } else {
        currentItems = allItems[repoType];
    }

    const filtered = filterItems(currentItems, { searchTerm, tagFilter, archiveFilter });
    const sorted = sortItems(filtered, sortBy);
    renderItemList(sorted, repoType);
};

/**
 * Populates the tag filter dropdown with unique tags for the current repository type.
 */
const populateTagFilter = (repoType) => {
    const tagFilterElement = document.getElementById('tagFilter');
    tagFilterElement.innerHTML = '<option value="">All Tags</option>'; // Reset the options

    let allTags = [];

    if (repoType === "all") {
        // Merge tags from ALL repo types
        allTags = [
            ...tagsMap.code,
            ...tagsMap.datasets,
            ...tagsMap.models,
            ...tagsMap.spaces
        ];
    } else {
        allTags = [...tagsMap[repoType]];
    }

    // remove duplicates and sort tags
    // tagsMap already contains normalized (lowercase) tags, so Set automatically handles duplicates
    const sortedTags = Array.from(new Set(allTags)).sort();

    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilterElement.appendChild(option);
    });
};

//
// SECTION 4: EVENT LISTENERS AND INITIALIZATION
//

/**
 * Initializes UI elements from configuration values.
 * This sets up the header, logo, repo ribbon, and dynamic styles.
 */
const initializeUIFromConfig = () => {
    // Set header logo
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.src = CONFIG.LOGO_URL;
        logoImg.alt = CONFIG.ORG_NAME + ' Logo';

        logoImg.onload = () => {
            logoImg.classList.remove('opacity-0');
        };
    }

    // Set header title and description
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = CONFIG.CATALOG_TITLE || `${CONFIG.ORG_NAME} Catalog`;
        headerTitle.style.color = CONFIG.COLORS.primary;
    }

    const headerDesc = document.getElementById('header-description');
    if (headerDesc) {
        headerDesc.textContent = CONFIG.CATALOG_DESCRIPTION;
    }

    // Set Code Repo ribbon link, SVG path, display name, and colors
    const repoRibbon = document.getElementById('repo-ribbon');
    const platformDisplay = getPlatformDisplay(PLATFORM);
    if (repoRibbon && platformDisplay) {
        repoRibbon.href = `${platformDisplay.ribbonUrl}${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}`;
        const pathElement = document.getElementById('repo-ribbon-icon');
        pathElement.setAttribute('d', platformDisplay.path);
        const platformDisplayName = document.getElementById('platform-display-name');
        platformDisplayName.textContent = platformDisplay.displayName || PLATFORM;
        repoRibbon.style.backgroundColor = CONFIG.COLORS.secondary;
        repoRibbon.style.setProperty('--hover-color', CONFIG.COLORS.primary);
        repoRibbon.addEventListener('mouseenter', function () {
            this.style.backgroundColor = CONFIG.COLORS.primary;
        });
        repoRibbon.addEventListener('mouseleave', function () {
            this.style.backgroundColor = CONFIG.COLORS.secondary;
        });
    }

    // Set focus ring colors for form inputs and link hover colors
    const style = document.createElement('style');
    style.textContent = `
        .focus\\:ring-2:focus { --tw-ring-color: var(--color-accent) !important; }
        .item-link:hover { color: var(--color-accent) !important; }
        .dark .item-link:hover { color: var(--color-accent-dark) !important; }
    `;
    document.head.appendChild(style);
};

document.addEventListener('DOMContentLoaded', async () => {
    // Load config before anything else
    try {
        CONFIG = await configPromise;
    } catch (error) {
        console.error('Error loading config.yaml:', error);
        // Render visible error banner
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #fee; color: #c33; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000; max-width: 90%; text-align: center;';
        errorDiv.innerHTML = `<strong>Configuration Error:</strong> ${error.message}. Using default settings.`;
        document.body.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 10000);
        // Fall back to defaults so the page isn't completely broken
        CONFIG = {
            ORGANIZATION_NAME: '', HF_ORGANIZATION_NAME: '', CATALOG_REPO_NAME: '', ORG_NAME: '',
            CATALOG_TITLE: 'Catalog', CATALOG_DESCRIPTION: '',
            LOGO_URL: '', FAVICON_URL: '',
            COLORS: { primary: '#92991c', secondary: '#5d8095', accent: '#0097b2', accentDark: '#4fd1eb', tag: '#9bcb5e' },
            PLATFORM: 'github',
            API_BASE_URL: 'https://huggingface.co/api/', REFRESH_INTERVAL_DAYS: 30,
            ADDITIONAL_REPOS: [], ADDITIONAL_HF_REPOS: [], FONT_FAMILY: 'Inter'
        };
    }

    // Assign module-scope variables used by all functions
    ORGANIZATION_NAME     = CONFIG.ORGANIZATION_NAME;
    HF_ORGANIZATION_NAME  = CONFIG.HF_ORGANIZATION_NAME;
    CATALOG_REPO_NAME     = CONFIG.CATALOG_REPO_NAME;
    PLATFORM              = CONFIG.PLATFORM;
    ORG_API_URL           = getPlatformApiUrls(PLATFORM, ORGANIZATION_NAME).org;
    REPO_API_URL          = getPlatformApiUrls(PLATFORM, ORGANIZATION_NAME).repo;
    API_BASE_URL          = CONFIG.API_BASE_URL;
    REFRESH_INTERVAL_DAYS = CONFIG.REFRESH_INTERVAL_DAYS;
    ADDITIONAL_REPOS      = CONFIG.ADDITIONAL_REPOS;
    ADDITIONAL_HF_REPOS   = CONFIG.ADDITIONAL_HF_REPOS;

    // Guard: if ORGANIZATION_NAME or HF_ORGANIZATION_NAME is missing (e.g. config.yaml failed to load),
    // stop here — proceeding would fire requests like ?author=&full=true which
    // could return unbounded results from the Hugging Face API.
    if (!ORGANIZATION_NAME || !HF_ORGANIZATION_NAME){
        console.error("Organization name is missing for one or both APIs. Halting initialization.");
        return;
    }

    // Apply CSS custom properties and document metadata
    document.title = CONFIG.CATALOG_TITLE || `${CONFIG.ORG_NAME} Catalog`;
    document.documentElement.style.setProperty('--color-primary',     CONFIG.COLORS?.primary     || '#92991c');
    document.documentElement.style.setProperty('--color-secondary',   CONFIG.COLORS?.secondary   || '#5d8095');
    document.documentElement.style.setProperty('--color-accent',      CONFIG.COLORS?.accent      || '#0097b2');
    document.documentElement.style.setProperty('--color-accent-dark', CONFIG.COLORS?.accentDark  || '#4fd1eb');
    document.documentElement.style.setProperty('--color-tag',         CONFIG.COLORS?.tag         || '#9bcb5e');
    const fontFamily = CONFIG.FONT_FAMILY || 'Inter';
    document.documentElement.style.setProperty('--font-family', fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily);

    // Update Google Fonts link
    if (CONFIG.FONT_FAMILY) {
        const fontFamily = CONFIG.FONT_FAMILY.replace(/\s+/g, '+');
        const fontLink = document.getElementById('font-link');
        if (fontLink) fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;500;600;700&display=swap`;
    }

    // Set favicon
    const faviconLink = document.getElementById('favicon-link');
    if (faviconLink && CONFIG.FAVICON_URL) faviconLink.href = CONFIG.FAVICON_URL;

    // Initialize UI from config
    initializeUIFromConfig();

    const searchInput = document.getElementById('searchInput');
    const sortBySelect = document.getElementById('sortBy');
    const tagFilterSelect = document.getElementById('tagFilter');
    const repoTypeSelect = document.getElementById('repoType');
    const archiveFilterSelect = document.getElementById('archiveFilter');

    // Parse URL parameters to restore state
    const urlParams = parseUrlParams();

    // Apply URL parameters to form elements if they exist
    const validRepoTypes = ['all', 'code', 'datasets', 'models', 'spaces'];
    if (urlParams.type && validRepoTypes.includes(urlParams.type)) {
        repoTypeSelect.value = urlParams.type;
    }

    if (urlParams.q) {
        searchInput.value = urlParams.q;
    }

    const validSortValues = ['lastModified', 'createdAt', 'stars_desc', 'stars_asc', 'alphabetical_asc', 'alphabetical_desc'];
    if (urlParams.sort && validSortValues.includes(urlParams.sort)) {
        sortBySelect.value = urlParams.sort;
    }

    const initialType = repoTypeSelect.value;

    // Restore archive filter from URL
    const validArchiveValues = ['active', 'all'];
    if (urlParams.archived && validArchiveValues.includes(urlParams.archived)) {
        archiveFilterSelect.value = urlParams.archived;
    }

    // Add input and change event listeners
    searchInput.addEventListener('input', applyFiltersAndSort);
    sortBySelect.addEventListener('change', applyFiltersAndSort);
    tagFilterSelect.addEventListener('change', applyFiltersAndSort);
    archiveFilterSelect.addEventListener('change', applyFiltersAndSort);

    repoTypeSelect.addEventListener('change', async (event) => {
        const newRepoType = event.target.value;

        if (newRepoType === "all") {
            // Fetch EVERYTHING
            await Promise.all([
                fetchHubItems("code"),
                fetchHubItems("datasets"),
                fetchHubItems("models"),
                fetchHubItems("spaces")
            ]);

            populateTagFilter("all");
        } else {
            await fetchHubItems(newRepoType);
            populateTagFilter(newRepoType);
        }

        await applyFiltersAndSort();
    });

    // Initialize the Catalog Badge (Stars/Forks/Version)
    fetchCatalogStats();

    // Load pre-built release data (written by scripts/fetch-releases.js at build time)
    releasesMap = await fetch('./releases.json')
        .then(res => res.ok ? res.json() : {})
        .catch(() => ({}));

    //
    // >>> INITIAL PAGE LOAD HANDLING <<<
    //
    if (initialType === "all") {
        // If default is ALL, fetch everything at startup
        await Promise.all([
            fetchHubItems("code"),
            fetchHubItems("datasets"),
            fetchHubItems("models"),
            fetchHubItems("spaces")
        ]);

        populateTagFilter("all");
    } else {
        // Otherwise fetch just the default repo
        await fetchHubItems(initialType);
        populateTagFilter(initialType);
    }

    // Apply tag filter from URL after tags have been populated
    if (urlParams.tag) {
        // Check if the tag exists in the options
        const normalizedUrlTag = urlParams.tag.toLowerCase();
        const tagOption = Array.from(tagFilterSelect.options).find(opt => opt.value.toLowerCase() === normalizedUrlTag);
        if (tagOption) {
            tagFilterSelect.value = tagOption.value;
        }
    }

    // Render initially without updating URL, then sync URL once to reflect actual applied state
    // (handles cases where URL params were invalid and not applied)
    await applyFiltersAndSort(false);
    updateUrlParams(getCurrentState());
});

//
// THEME TOGGLE LOGIC
//
const themeToggleBtn = document.getElementById('themeToggleBtn');

themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
});
