//
// Hugging Face Hub Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for Hugging Face datasets, models, and spaces.
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
// SECTION 2: DATA FETCHING LOGIC
//

/**
 * Fetches items (datasets, models, or spaces) for a given organization from the Hugging Face API.
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
        if (repoType === "code" || repoType === "forked-code") {
            if (fetchedData.code) return allItems.code // reuse if already fetched
            
            const ghResponse = await fetch(
                `https://api.github.com/orgs/${ORGANISATION_NAME}/repos?type=public&per_page=100`
            );

            if (!ghResponse.ok) {
                throw new Error(`GitHub error: ${ghResponse.status}`);
            }

            const repos = await ghResponse.json();

            items = repos.slice(0, MAX_ITEMS).map(repo => {
                const createdAt = new Date(repo.created_at);
                const lastModified = new Date(repo.updated_at);
                const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < REFRESH_INTERVAL_DAYS;

                const tags = repo.topics || [];
                tags.forEach(tag => tagsMap.code.add(tag));

                return {
                    id: repo.full_name,                    // repo name from "imageomics/repo-name"
                    createdAt,
                    lastModified,
                    isNew,
                    tags,
                    description: repo.description || "No description provided.",
                    html_url: repo.html_url,
                    cardData: {
                        pretty_name: repo.name,
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
            tags.forEach(tag => tagsMap[repoType].add(tag));

            return {
                ...item,
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

//
// SECTION 3: RENDERING LOGIC
//

/**
 * Renders a single item card (dataset, model, or space) to HTML.
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
    // datasets have prett_name, models have model_name, spaces have title
    const prettyName = item.cardData?.pretty_name || item.cardData?.model_name || item.cardData?.title || item.id.split('/')[1];

    // Use the description from cardData, with fallbacks
    const displayDescription = item.cardData?.description ||  item.cardData?.model_description ||  item.description || 'No description provided.';

    // Construct the correct URL based on the repository type
    let itemUrl = `https://huggingface.co/${item.id}`;
    let linkText = "View on Hub"; // default
    if (repoType === 'code' || repoType === "forked-code") {
        itemUrl = item.html_url;
        linkText = "View Repo";
    } else if (repoType === 'datasets') {
        itemUrl = `https://huggingface.co/datasets/${item.id}`;
    } else if (repoType === 'spaces') {
        itemUrl = `https://huggingface.co/spaces/${item.id}`;
    }

    // stars for GitHub repos
    const badgeHtml = (() => {
        if (item.isNew) {
            return `<span class="new-badge inline-block text-xs font-bold text-white rounded-full px-2 py-1">
                        New!
                    </span>`;
        }

        if (typeof item.cardData.stars === "number") {
            return `<span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        ⭐ ${item.cardData.stars}
                    </span>`;
        }

        if (typeof item.likes === "number") {
        return `
        <span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
            ❤️ ${item.likes}
        </span>`;
    }
        return "";
    })();

    return `
        <div class="item-card rounded-xl shadow-lg p-6 flex flex-col justify-between">
            <div>
                <div class="flex items-start justify-between mb-2 gap-2">
                    <h2 class="text-xl font-bold text-gray-800 break-all flex-1">
                        ${prettyName}
                    </h2>
                    <div class="flex-shrink-0">
                        ${badgeHtml}
                    </div>
                </div>
                <p class="text-sm text-gray-600 h-20 overflow-y-auto mb-4">
                    ${displayDescription}
                </p>
            </div>
            <div>
                <div class="flex flex-wrap gap-2 max-h-[2.5rem] overflow-y-auto tag-container pb-2">
                    ${tagsHtml}
                </div>
                <div class="flex justify-between items-center mt-4 text-xs text-gray-400">
                    <span>Updated: ${lastUpdatedDate}</span>
                    <a href="${itemUrl}" target="_blank" class="text-[#5d8095] hover:text-[#0097b2] font-medium transition-colors">
                        ${linkText}
                    </a>
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
 */
const applyFiltersAndSort = async () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const repoType = document.getElementById('repoType').value;
    let currentItems;
    if (repoType === "forked-code") {
        // ensure code repos are loaded before filtering
        if (!fetchedData.code) {
            await fetchHubItems("code"); 
        }
        currentItems = allItems.code.filter(item => {
            // checks pretty-name or converts full_name to repo name only as backup
            return FORKED_REPOS.some(forked => forked.toLowerCase() === (item.cardData?.pretty_name || item.id.split('/')[1]).toLowerCase());
        });
    } else {
        currentItems = allItems[repoType];
    }

    // Step 1: Filter the items based on the search and tag filters
    const filtered = currentItems.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchTerm) ||
                              item.description?.toLowerCase().includes(searchTerm) ||
                              item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        const matchesTag = tagFilter === "" || item.tags.includes(tagFilter);

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
        case 'createdAt':
            sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;
        case 'lastModified':
        default:
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

    // Use "code" tags for "forked-code"
    const mapKey = repoType === "forked-code" ? "code" : repoType;
    const sortedTags = Array.from(tagsMap[mapKey]).sort();

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

    // Add input and change event listeners
    searchInput.addEventListener('input', applyFiltersAndSort);
    sortBySelect.addEventListener('change', applyFiltersAndSort);
    tagFilterSelect.addEventListener('change', applyFiltersAndSort);

    repoTypeSelect.addEventListener('change', async (event) => {
        const newRepoType = event.target.value;
        await fetchHubItems(newRepoType);
        populateTagFilter(newRepoType);
        await applyFiltersAndSort();
    });

    // Initial fetch for "datasets"
    await fetchHubItems(repoTypeSelect.value);
    populateTagFilter(repoTypeSelect.value);
    await applyFiltersAndSort(); // Initial render with default filters
});
