//
// Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for code, datasets, models, and spaces.
// Configuration is loaded from config.yaml
//
// SECTION 1: CONFIGURATION AND STATE MANAGEMENT
//

import jsYaml from 'js-yaml';

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
let ORGANIZATION_NAME, CATALOG_REPO_NAME, API_BASE_URL, REFRESH_INTERVAL_DAYS, ADDITIONAL_REPOS, ADDITIONAL_HF_REPOS;

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

/**
 * Normalizes a raw tag string.
 * - Returns null for Hugging Face system metadata tags
 * - Maps known aliases to their canonical tag via TAG_GROUPS.
 * - Falls back to the lowercased original if no mapping exists.
 * @param {string} tag
 * @returns {string|null}
 */
const normalizeTag = (tag) => {
    const lower = String(tag).toLowerCase();

    // OPTION LINE -- REMOVE IF UNWANTED
    // Removes Hugging Face auto-generated system tags (e.g. "license:mit", "format:parquet").
    // These are identified by the presence of a colon. To include auto-generated tags in the
    // catalog, remove the following line.
    if (lower.includes(':')) return null;
    return tagLookup[lower] ?? [lower];
};

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
// SECTION 2: DATA FETCHING LOGIC
//

/**
 * Fetches items (code, datasets, models, or spaces) for a given organization from the GitHub or Hugging Face API.
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

    try {
        let items = [];

        // github api requests for code
        if (repoType === "code") {
            if (fetchedData.code) return allItems.code // reuse if already fetched

            // Paginate through all public repos (GitHub API returns max 100 per page)
            let allRepos = [];
            let nextUrl = `https://api.github.com/orgs/${ORGANIZATION_NAME}/repos?type=public&per_page=100`;
            while (nextUrl) {
                const ghResponse = await fetch(nextUrl);

                if (!ghResponse.ok) {
                    throw new Error(`GitHub error: ${ghResponse.status}`);
                }

                const page = await ghResponse.json();
                allRepos = allRepos.concat(page);

                // Parse the Link header to find the next page URL, if any
                const linkHeader = ghResponse.headers.get('Link');
                const match = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                nextUrl = match ? match[1] : null;
            }

            // For org-owned entries in ADDITIONAL_REPOS, reuse data already in allRepos to avoid redundant API calls.
            // Only fetch entries that belong to a different org (external repos).
            const allReposByFullName = new Map(allRepos.map(r => [r.full_name, r]));
            const toFetch = ADDITIONAL_REPOS.filter(ownerRepo => !allReposByFullName.has(ownerRepo));
            const fromAllRepos = ADDITIONAL_REPOS.map(ownerRepo => allReposByFullName.get(ownerRepo)).filter(Boolean);

            const fetchedExternalData = await Promise.all(
                toFetch.map(ownerRepo =>
                    fetch(`https://api.github.com/repos/${ownerRepo}`)
                        .then(r => {
                            if (!r.ok) {
                                console.warn(`Failed to fetch additional repo "${ownerRepo}": HTTP ${r.status}`);
                                return null;
                            }
                            return r.json();
                        })
                        .catch(err => {
                            console.warn(`Network error fetching additional repo "${ownerRepo}":`, err);
                            return null;
                        })
                )
            );
            const additionalRepos = [...fromAllRepos, ...fetchedExternalData.filter(Boolean)];

            // Keep only non-forks from org; deduplicate against additional repos by full_name
            const orgRepoNames = new Set(additionalRepos.map(r => r.full_name));
            const orgNonForks = allRepos.filter(repo => repo.name !== ".github" && !repo.fork && !orgRepoNames.has(repo.full_name));

            // Process additional repos and all remaining org non-forks to include metadata and 'new' flag as appropriate
            items = [...additionalRepos, ...orgNonForks]
                .map(repo => {
                    const createdAt = new Date(repo.created_at);
                    const lastModified = new Date(repo.updated_at);
                    const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < REFRESH_INTERVAL_DAYS;

                    const rawTags = (repo.topics || []).map(t => t.toLowerCase());
                    const tags = [...new Set(rawTags.flatMap(normalizeTag).filter(Boolean))];
                    const displayTags = rawTags.filter(t => !t.includes(':'));
                    tags.forEach(tag => tagsMap.code.add(tag));

                    const release = releasesMap[repo.full_name] ?? null;

                    return {
                        id: repo.full_name, // "Imageomics/<repo-name>", used as backup if can't get repo.name
                        repoType: "code",
                        createdAt,
                        lastModified,
                        isNew,
                        archived: repo.archived || false,
                        tags,
                        rawTags,
                        displayTags,
                        description: repo.description || "No description provided.",
                        html_url: repo.html_url,
                        hasNewRelease: release?.isNew ?? false,
                        latestReleaseUrl: release?.url ?? null,
                        latestReleaseTag: release?.tag ?? null,
                        cardData: {
                            pretty_name: repo.name, // <repo-name>, the one used for card title display
                            description: repo.description,
                            stars: repo.stargazers_count
                        }
                    };
                });

            allItems.code = items;
            fetchedData.code = true;

            skeletons.forEach(s => s.classList.add('hidden'));

            return items;
        }

        // hugging face api requests for datasets/models/spaces
        const response = await fetch(`${API_BASE_URL}${repoType}?author=${ORGANIZATION_NAME}&full=true`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let hfItems = await response.json();

        // Fetch additional HF repos of this type from outside the org
        const additionalForType = ADDITIONAL_HF_REPOS.filter(entry => entry.type === repoType);
        if (additionalForType.length) {
            const orgIds = new Set(hfItems.map(item => item.id));
            const toFetch = additionalForType.filter(entry => !orgIds.has(entry.repo));

            const fetched = await Promise.all(
                toFetch.map(entry =>
                    fetch(`${API_BASE_URL}${repoType}/${entry.repo}`)
                        .then(r => {
                            if (!r.ok) {
                                console.warn(`Failed to fetch additional HF repo "${entry.repo}": HTTP ${r.status}`);
                                return null;
                            }
                            return r.json();
                        })
                        .catch(err => {
                            console.warn(`Network error fetching additional HF repo "${entry.repo}":`, err);
                            return null;
                        })
                )
            );
            hfItems = [...hfItems, ...fetched.filter(Boolean)];
        }

        // Step 2: If we are fetching models, get the full details for each one.
        if (repoType === 'models') {
            const detailPromises = hfItems.map(item =>
                fetch(`${API_BASE_URL}models/${item.id}`).then(res => {
                    if (!res.ok) {
                        console.error(`Failed to fetch details for ${item.id}`);
                        return null; // Return null for failed requests
                    }
                    return res.json();
                })
            );

            // Wait for all detail requests to complete in parallel.
            const detailedItems = await Promise.all(detailPromises);

            // Filter out any models that failed to fetch and assign the detailed list.
            hfItems = detailedItems.filter(Boolean);
        }

        // Process the data to include metadata and a 'new' flag
        const processedItems = hfItems.map(item => {
            const createdAt = new Date(item.createdAt);
            const lastModified = new Date(item.lastModified);
            const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < REFRESH_INTERVAL_DAYS;

            // Extract tags from the YAML metadata (handling different structures)
            const rawTags = (item.cardData?.tags || item.tags || []).map(t => String(t).toLowerCase());
            const tags = [...new Set(rawTags.flatMap(normalizeTag).filter(Boolean))];
            const displayTags = rawTags.filter(t => !t.includes(':'));
            tags.forEach(tag => tagsMap[repoType].add(tag));

            return {
                ...item,
                repoType,
                createdAt,
                lastModified,
                isNew,
                archived: false,
                likes: item.likes || 0,
                tags,
                rawTags,
                displayTags
            };
        });

        allItems[repoType] = processedItems;
        fetchedData[repoType] = true;

        skeletons.forEach(s => s.classList.add('hidden'));

        return processedItems;
    } catch (error) {
        handleError(error, `Failed to fetch ${repoType}. Please check your network connection or the API.`);
        return [];
    }
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
        // 1. Get Stars & Forks
        const repo = await fetch(`https://api.github.com/repos/${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}`).then(r => r.ok ? r.json() : {});
        if (repo.stargazers_count !== undefined) update('gh-stars', 'gh-star-container', repo.stargazers_count);
        if (repo.forks_count !== undefined) update('gh-forks', 'gh-fork-container', repo.forks_count);

        // 2. Get Version (Tag)
        const release = await fetch(`https://api.github.com/repos/${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}/releases/latest`).then(r => r.ok ? r.json() : {});
        if (release.tag_name) update('gh-tag', 'gh-version-container', release.tag_name);

    } catch (e) {
        console.warn("Could not fetch GitHub stats", e);
    }
};

//
// SECTION 3: RENDERING LOGIC
//

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param {string} str - The input string.
 * @returns {string} The escaped string.
 */
const escapeHTML = (str) => {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
};

/**
 * Adds word break opportunities after underscores to allow proper text wrapping.
 * @param {string} str - The input string.
 * @returns {string} The string with <wbr> tags inserted after underscores.
 */
const addWordBreakOpportunities = (str) => {
    if (!str) return "";
    // Replace underscores with underscore + word break opportunity
    return str.replace(/_/g, '_<wbr>');
};

/**
 * Renders a single item card (code, dataset, model, or space) to HTML.
 * @param {Object} item - The item object to render.
 * @param {string} repoType - The type of repository.
 * @returns {string} The HTML string for the item card.
 */
const renderHubItemCard = (item, repoType) => {
    const lastUpdatedDate = new Date(item.lastModified).toLocaleDateString();
    const tagsHtml = (item.displayTags || item.rawTags || []).map(tag =>
        `<span class="tag text-xs font-semibold px-2 py-1 rounded-full">${tag}</span>`
    ).join('');

    // Use pretty_name for the heading, with a fallback
    // HF API keys for CardData: https://huggingface.co/docs/huggingface_hub/main/en/package_reference/cards#huggingface_hub.CardData
    // datasets have pretty_name, models have model_name, spaces have title
    const prettyName = item.cardData?.pretty_name || item.cardData?.model_name || item.cardData?.title || item.id.split('/')[1];

    // Use the description from cardData, with fallbacks
    const displayDescription = item.cardData?.description || item.cardData?.model_description || item.description || 'No description provided.';

    // Construct the correct URL based on the repository type
    let itemUrl;

    switch (item.repoType) {
        case "code":
            itemUrl = item.html_url;
            break;
        case "datasets":
            itemUrl = `https://huggingface.co/datasets/${item.id}`;
            break;
        case "spaces":
            itemUrl = `https://huggingface.co/spaces/${item.id}`;
            break;
        case "models":
            itemUrl = `https://huggingface.co/${item.id}`;
            break;
        default:
            // fallback for "all"
            itemUrl = `https://huggingface.co/${item.id}`;
            break;
    }

    // stars for GitHub repos
    const badgeHtml = (() => {
        if (item.isNew) {
            return `<span class="new-badge inline-block text-xs font-bold text-white rounded-full px-2 py-1">
                        New!
                    </span>`;
        }

        if (typeof item.cardData.stars === "number" && item.cardData.stars > 0) {
            return `<span class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        ⭐ ${item.cardData.stars}
                    </span>`;
        }

        if (typeof item.likes === "number" && item.likes > 0) {
            return `
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            ❤️ ${item.likes}
        </span>`;
        }
        return "";
    })();

    const escapedTitle = escapeHTML(prettyName);
    const displayTitle = addWordBreakOpportunities(escapedTitle);

    return `
        <div class="item-card rounded-xl shadow-lg p-6 flex flex-col justify-between bg-white dark:bg-slate-800 transition-colors duration-200">
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <h2 title="${escapedTitle}" class="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1 line-clamp-3">
                        <a href="${itemUrl}" target="_blank" class="break-words hover:underline transition-colors item-link">
                            ${displayTitle}
                        </a>
                    </h2>
                    <div class="flex-shrink-0 ml-2 flex flex-row items-center gap-2">
                        ${badgeHtml}
                        ${(item.repoType === 'code' && item.hasNewRelease)
                            ? `<a href="${item.latestReleaseUrl}" target="_blank" rel="noopener noreferrer"
                                  class="release-badge inline-block text-xs font-bold text-white rounded-full px-2 py-1 hover:opacity-80 transition-opacity"
                                  title="New release: ${escapeHTML(item.latestReleaseTag)}">
                                  🚀 ${escapeHTML(item.latestReleaseTag)}
                               </a>`
                            : ''}
                    </div>
                </div>
            </div>

            <p class="flex-grow basis-0 min-h-[5rem] overflow-y-auto text-sm text-gray-600 dark:text-gray-400 mb-4 dark:[color-scheme:dark]">
                ${displayDescription}
            </p>

            <div>
                <div class="flex flex-wrap gap-2 max-h-[2.5rem] overflow-y-auto tag-container pb-2 dark:[color-scheme:dark]">
                    ${tagsHtml}
                </div>
                <div class="flex justify-between items-center mt-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>Updated: ${lastUpdatedDate}</span>
                    ${item.archived ? `<span class="archived-badge text-xs font-medium px-2.5 py-1 rounded-full">Archived</span>` : ''}
                </div>
            </div>
        </div>
    `;
};

/**
 * Renders the list of items to the DOM.
 * @param {Array} items - The array of item objects to render.
 * @param {string} repoType - The type of repository.
 */
const renderItemList = (items, repoType) => {
    const itemListElement = document.getElementById('itemList');
    const emptyStateElement = document.getElementById('emptyState');

    if (items.length === 0) {
        itemListElement.innerHTML = '';
        emptyStateElement.classList.remove('hidden');
    } else {
        itemListElement.innerHTML = items.map(item => renderHubItemCard(item, repoType)).join('');
        emptyStateElement.classList.add('hidden');
    }
};

//
// SECTION 4: SEARCH, FILTER, AND SORT LOGIC
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

    // Step 1: Filter the items based on the search, tag, and archive filters
    const filtered = currentItems.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            item.rawTags?.some(tag => tag.includes(searchTerm));

        const matchesTag = tagFilter === "" || item.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase());

        const matchesArchive = archiveFilter === "all" || !item.archived;

        return matchesSearch && matchesTag && matchesArchive;
    });

    // Step 2: Sort the filtered items
    let sorted = [...filtered];
    switch (sortBy) {
        case 'alphabetical_asc':
            sorted.sort((a, b) => a.id.localeCompare(b.id));
            break;

        case 'alphabetical_desc':
            sorted.sort((a, b) => b.id.localeCompare(a.id));
            break;

        case 'stars_desc':
            sorted.sort((a, b) => {
                const aVal = a.cardData.stars ?? a.likes ?? 0;
                const bVal = b.cardData.stars ?? b.likes ?? 0;
                return bVal - aVal; // highest to lowest
            });
            break;

        case 'stars_asc':
            sorted.sort((a, b) => {
                const aVal = a.cardData.stars ?? a.likes ?? 0;
                const bVal = b.cardData.stars ?? b.likes ?? 0;
                return aVal - bVal; // lowest to highest
            });
            break;

        case 'createdAt':
            sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;

        case 'lastModified':
            sorted.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
            break;

        default: // default to lastModified logic
            sorted.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
            break;
    }

    // Step 3: Render the sorted and filtered list
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
// SECTION 5: EVENT LISTENERS AND INITIALIZATION
//

/**
 * Initializes UI elements from configuration values.
 * This sets up the header, logo, GitHub ribbon, and dynamic styles.
 */
const initializeUIFromConfig = () => {
    // Set header logo
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.src = CONFIG.LOGO_URL;
        logoImg.alt = CONFIG.GITHUB_ORG_NAME + ' Logo';

        logoImg.onload = () => {
            logoImg.classList.remove('opacity-0');
        };
    }

    // Set header title and description
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = CONFIG.CATALOG_TITLE;
        headerTitle.style.color = CONFIG.COLORS.primary;
    }

    const headerDesc = document.getElementById('header-description');
    if (headerDesc) {
        headerDesc.textContent = CONFIG.CATALOG_DESCRIPTION;
    }

    // Set GitHub ribbon link and colors
    const githubRibbon = document.getElementById('github-ribbon');
    if (githubRibbon) {
        githubRibbon.href = `https://github.com/${ORGANIZATION_NAME}/${CATALOG_REPO_NAME}`;
        githubRibbon.style.backgroundColor = CONFIG.COLORS.secondary;
        githubRibbon.style.setProperty('--hover-color', CONFIG.COLORS.primary);
        githubRibbon.addEventListener('mouseenter', function () {
            this.style.backgroundColor = CONFIG.COLORS.primary;
        });
        githubRibbon.addEventListener('mouseleave', function () {
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

        // Validate required fields so devs get a clear error instead of a cryptic crash
        const missing = [];
        if (!CONFIG.ORGANIZATION_NAME)                 missing.push('ORGANIZATION_NAME');
        if (!CONFIG.API_BASE_URL)                      missing.push('API_BASE_URL');
        if (CONFIG.REFRESH_INTERVAL_DAYS == null)      missing.push('REFRESH_INTERVAL_DAYS');
        if (!Array.isArray(CONFIG.ADDITIONAL_REPOS))   missing.push('ADDITIONAL_REPOS (must be a list)');
        // ADDITIONAL_HF_REPOS is optional; default to empty array if absent
        if (CONFIG.ADDITIONAL_HF_REPOS == null) {
            CONFIG.ADDITIONAL_HF_REPOS = [];
        } else if (!Array.isArray(CONFIG.ADDITIONAL_HF_REPOS)) {
            missing.push('ADDITIONAL_HF_REPOS (must be a list of {repo, type} objects)');
        }
        if (!CONFIG.COLORS || typeof CONFIG.COLORS !== 'object') {
            missing.push('COLORS (must be an object with primary, secondary, accent, accentDark, tag)');
        } else {
            const missingColors = ['primary', 'secondary', 'accent', 'accentDark', 'tag'].filter(k => !CONFIG.COLORS[k]);
            if (missingColors.length) missing.push(`COLORS keys: ${missingColors.join(', ')}`);
        }
        if (missing.length) throw new Error(`config.yaml is missing required fields: ${missing.join('; ')}`);
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
            ORGANIZATION_NAME: '', CATALOG_REPO_NAME: '', GITHUB_ORG_NAME: '',
            CATALOG_TITLE: 'Catalog', CATALOG_DESCRIPTION: '',
            LOGO_URL: '', FAVICON_URL: '',
            COLORS: { primary: '#92991c', secondary: '#5d8095', accent: '#0097b2', accentDark: '#4fd1eb', tag: '#9bcb5e' },
            API_BASE_URL: 'https://huggingface.co/api/', REFRESH_INTERVAL_DAYS: 30,
            ADDITIONAL_REPOS: [], ADDITIONAL_HF_REPOS: [], FONT_FAMILY: 'Inter'
        };
    }

    // Assign module-scope variables used by all functions
    ORGANIZATION_NAME     = CONFIG.ORGANIZATION_NAME;
    CATALOG_REPO_NAME     = CONFIG.CATALOG_REPO_NAME;
    API_BASE_URL          = CONFIG.API_BASE_URL;
    REFRESH_INTERVAL_DAYS = CONFIG.REFRESH_INTERVAL_DAYS;
    ADDITIONAL_REPOS      = CONFIG.ADDITIONAL_REPOS;
    ADDITIONAL_HF_REPOS   = CONFIG.ADDITIONAL_HF_REPOS;

    // Apply CSS custom properties and document metadata
    document.title = CONFIG.CATALOG_TITLE || 'Catalog';
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
    // Guard: if ORGANIZATION_NAME is missing (e.g. config.yaml failed to load),
    // stop here — proceeding would fire requests like ?author=&full=true which
    // could return unbounded results from the Hugging Face API.
    if (!ORGANIZATION_NAME) return;

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
