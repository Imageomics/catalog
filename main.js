//
// Imageomics Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for Imageomics code, datasets, models, and spaces.
//
// SECTION 1: CONFIGURATION AND STATE MANAGEMENT
//
const ORGANISATION_NAME = "imageomics";
const API_BASE_URL = "https://huggingface.co/api/";
const REFRESH_INTERVAL_DAYS = 30; // Define what "new" means
const MAX_ITEMS = 100; // Limit the number of items to fetch
const FORKED_REPOS = [
    "Fish-Vista",
    "PhyloNN",
    "telemetry-dashboard",
    "docker-workshop"
];

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
        tag: document.getElementById('tagFilter')?.value || ''
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

            const ghResponse = await fetch(
                `https://api.github.com/orgs/${ORGANISATION_NAME}/repos?type=public&per_page=100`
            );

            if (!ghResponse.ok) {
                throw new Error(`GitHub error: ${ghResponse.status}`);
            }

            const repos = await ghResponse.json();

            items = repos
                .filter(repo => repo.name !== ".github") // skip .github repo
                .filter(repo => !repo.fork || FORKED_REPOS.includes(repo.name)) // keep non-forks + only specific forks
                .slice(0, MAX_ITEMS)
                .map(repo => {
                    const createdAt = new Date(repo.created_at);
                    const lastModified = new Date(repo.updated_at);
                    const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < REFRESH_INTERVAL_DAYS;

                    const tags = repo.topics || [];
                    tags.forEach(tag => tagsMap.code.add(tag.toLowerCase())); // stores globally for use in tags filter

                    return {
                        id: repo.full_name, // "Imageomics/<repo-name>", used as backup if can't get repo.name
                        repoType: "code",
                        createdAt,
                        lastModified,
                        isNew,
                        tags,
                        description: repo.description || "No description provided.",
                        html_url: repo.html_url,
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
        const response = await fetch(`${API_BASE_URL}${repoType}?author=${ORGANISATION_NAME}&full=true`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let hfItems = await response.json();

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
        const processedItems = hfItems.slice(0, MAX_ITEMS).map(item => {
            const createdAt = new Date(item.createdAt);
            const lastModified = new Date(item.lastModified);
            const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < REFRESH_INTERVAL_DAYS;

            // Extract tags from the YAML metadata (handling different structures)
            const tags = item.cardData?.tags || item.tags || [];
            tags.forEach(tag => tagsMap[repoType].add(tag.toLowerCase()));

            return {
                ...item,
                repoType,
                createdAt,
                lastModified,
                isNew,
                likes: item.likes || 0,
                tags: tags
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
        const repo = await fetch('https://api.github.com/repos/Imageomics/catalog').then(r => r.ok ? r.json() : {});
        if (repo.stargazers_count !== undefined) update('gh-stars', 'gh-star-container', repo.stargazers_count);
        if (repo.forks_count !== undefined) update('gh-forks', 'gh-fork-container', repo.forks_count);

        // 2. Get Version (Tag)
        const release = await fetch('https://api.github.com/repos/Imageomics/catalog/releases/latest').then(r => r.ok ? r.json() : {});
        if (release.tag_name) update('gh-tag', 'gh-version-container', release.tag_name);

    } catch (e) {
        console.warn("Could not fetch GitHub stats", e);
    }
};

//
// SECTION 3: RENDERING LOGIC
//

/**
 * Renders a single item card (code, dataset, model, or space) to HTML.
 * @param {Object} item - The item object to render.
 * @param {string} repoType - The type of repository.
 * @returns {string} The HTML string for the item card.
 */
const renderHubItemCard = (item, repoType) => {
    const lastUpdatedDate = new Date(item.lastModified).toLocaleDateString();
    const tagsHtml = item.tags.map(tag =>
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

    return `
        <div class="item-card rounded-xl shadow-lg p-6 flex flex-col justify-between dark:bg-slate-800 transition-colors duration-200">
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <h2 title="${prettyName}" class="text-xl font-bold text-gray-800 dark:text-gray-100 flex-1 line-clamp-3">
                        <a href="${itemUrl}" target="_blank" class="break-words hover:underline hover:text-[#0097b2] dark:hover:text-[#4fd1eb] transition-colors">
                            ${prettyName}
                        </a>
                    </h2>
                    <div class="flex-shrink-0 ml-2">
                        ${badgeHtml}
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

    // Step 1: Filter the items based on the search and tag filters
    const filtered = currentItems.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        const matchesTag = tagFilter === "" || item.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase());

        return matchesSearch && matchesTag;
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

document.addEventListener('DOMContentLoaded', async () => {

    const searchInput = document.getElementById('searchInput');
    const sortBySelect = document.getElementById('sortBy');
    const tagFilterSelect = document.getElementById('tagFilter');
    const repoTypeSelect = document.getElementById('repoType');

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

    // Add input and change event listeners
    searchInput.addEventListener('input', applyFiltersAndSort);
    sortBySelect.addEventListener('change', applyFiltersAndSort);
    tagFilterSelect.addEventListener('change', applyFiltersAndSort);

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
