//
// Hugging Face Hub Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for Hugging Face datasets, models, and spaces.
//

// --- Global Constants and API Endpoints ---
const GITHUB_PAGES_BASE_URL = 'https://huggingface.co';
const ORGANIZATION_NAME = 'imageomics';
// Updated to fetch all repositories for the organization to enable cross-filtering
const API_URL = `https://huggingface.co/api/models?author=${ORGANIZATION_NAME}&full=true`;
const DATASET_URL = `https://huggingface.co/api/datasets?author=${ORGANIZATION_NAME}&full=true`;
const SPACES_URL = `https://huggingface.co/api/spaces?author=${ORGANIZATION_NAME}&full=true`;

// --- DOM Element References ---
const searchInput = document.getElementById('searchInput');
const repoTypeSelect = document.getElementById('repoType');
const sortBySelect = document.getElementById('sortBy');
const tagFilterSelect = document.getElementById('tagFilter');
const itemList = document.getElementById('itemList');
const emptyState = document.getElementById('emptyState');
const filterSpacer = document.getElementById('filterSpacer');

// Specific filter containers and dropdowns
const datasetFilters = document.getElementById('datasetFilters');
const modelFilters = document.getElementById('modelFilters');
const spaceFilters = document.getElementById('spaceFilters');

// Dataset-specific dropdowns
const taskFilterSelect = document.getElementById('taskFilter');
const sizeFilterSelect = document.getElementById('sizeFilter');

// Model-specific dropdowns
const libraryFilterSelect = document.getElementById('libraryFilter');
const modelDatasetFilterSelect = document.getElementById('modelDatasetFilter');

// Space-specific dropdowns
const spaceSdkFilterSelect = document.getElementById('spaceSdkFilter');
const spaceModelFilterSelect = document.getElementById('spaceModelFilter');
const spaceDatasetFilterSelect = document.getElementById('spaceDatasetFilter');

// --- Global State ---
// allData stores categorized data for populating filters.
let allData = { models: [], datasets: [], spaces: [] };
// allItems is a flattened list for rendering.
let allItems = [];

// --- Main Initialization ---
// Fetches data and sets up event listeners when the script loads.
document.addEventListener('DOMContentLoaded', () => {
    fetchAllData();
    setupEventListeners();
});

// --- Data Fetching ---
/**
 * Fetches all datasets, models, and spaces from the Hugging Face Hub API in parallel.
 * Once fetched, it populates the global state, populates the filters, and renders the items.
 */
async function fetchAllData() {
    setLoadingState(true);
    try {
        const [models, datasets, spaces] = await Promise.all([
            fetch(API_URL).then(res => res.json()),
            fetch(DATASET_URL).then(res => res.json()),
            fetch(SPACES_URL).then(res => res.json())
        ]);

        allData = {
            models: models.map(item => ({ ...item, repoType: 'model' })),
            datasets: datasets.map(item => ({ ...item, repoType: 'dataset' })),
            spaces: spaces.map(item => ({ ...item, repoType: 'space' }))
        };

        allItems = [...allData.models, ...allData.datasets, ...allData.spaces];

        populateFilters();
        renderItems();
    } catch (error) {
        console.error("Failed to fetch data from Hugging Face Hub:", error);
        itemList.innerHTML = `<p class="text-red-500 text-center col-span-full">Error loading data. Please try again later.</p>`;
    } finally {
        setLoadingState(false);
    }
}

// --- Event Handling ---
/**
 * Sets up event listeners for all interactive UI elements.
 */
function setupEventListeners() {
    const triggers = [
        searchInput, sortBySelect, tagFilterSelect,
        taskFilterSelect, sizeFilterSelect, libraryFilterSelect,
        modelDatasetFilterSelect, spaceSdkFilterSelect, spaceModelFilterSelect,
        spaceDatasetFilterSelect
    ];
    triggers.forEach(el => el.addEventListener('input', renderItems));

    // Handle repository type change separately to re-populate filters
    repoTypeSelect.addEventListener('change', () => {
        toggleFilterVisibility();
        populateFilters();
        renderItems();
    });
}

// --- UI Rendering and State Management ---
/**
 * Toggles the visibility of filter sections based on the selected repository type.
 */
function toggleFilterVisibility() {
    const selectedType = repoTypeSelect.value;
    datasetFilters.classList.toggle('hidden', selectedType !== 'dataset');
    modelFilters.classList.toggle('hidden', selectedType !== 'model');
    spaceFilters.classList.toggle('hidden', selectedType !== 'space');
    filterSpacer.classList.toggle('hidden', selectedType === '');
}

/**
 * Sets the loading state of the UI, showing or hiding skeleton cards.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        itemList.innerHTML = `
            <div class="skeleton-card skeleton rounded-xl p-6 h-64"></div>
            <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden sm:block"></div>
            <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden lg:block"></div>
            <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden xl:block"></div>
        `;
    } else {
        itemList.innerHTML = '';
    }
}

/**
 * Renders the filtered and sorted items to the DOM.
 */
function renderItems() {
    const filteredAndSortedItems = filterAndSortData();
    itemList.innerHTML = '';

    if (filteredAndSortedItems.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredAndSortedItems.forEach(item => {
            const card = createItemCard(item);
            itemList.appendChild(card);
        });
    }
}

// --- Filtering and Sorting Logic ---
/**
 * Filters and sorts the data based on the current values of the UI controls.
 * @returns {Array} The filtered and sorted array of items.
 */
function filterAndSortData() {
    const searchTerm = searchInput.value.toLowerCase();
    const repoType = repoTypeSelect.value;
    const sortBy = sortBySelect.value;

    // --- Get values from all filters ---
    const selectedTag = tagFilterSelect.value;
    // Dataset filters
    const selectedTask = taskFilterSelect.value;
    const selectedSize = sizeFilterSelect.value;
    // Model filters
    const selectedLibrary = libraryFilterSelect.value;
    const selectedModelDataset = modelDatasetFilterSelect.value;
    // Space filters
    const selectedSdk = spaceSdkFilterSelect.value;
    const selectedSpaceModel = spaceModelFilterSelect.value;
    const selectedSpaceDataset = spaceDatasetFilterSelect.value;

    let filtered = allItems.filter(item => {
        const searchMatch = !searchTerm || item.id.toLowerCase().includes(searchTerm) || (item.cardData?.short_description || '').toLowerCase().includes(searchTerm) || (item.cardData?.pretty_name || '').toLowerCase().includes(searchTerm);
        const repoMatch = !repoType || item.repoType === repoType;

        if (!searchMatch || !repoMatch) return false;

        // General Tag Filter (applies to all)
        if (selectedTag && (!item.cardData?.tags || !item.cardData.tags.includes(selectedTag))) return false;

        // Type-specific filters based on YAML data
        switch (item.repoType) {
            case 'dataset':
                if (selectedTask && (!item.cardData?.task_categories || !item.cardData.task_categories.includes(selectedTask))) return false;
                if (selectedSize && (!item.cardData?.size_categories || !item.cardData.size_categories.includes(selectedSize))) return false;
                break;
            case 'model':
                if (selectedLibrary && item.library_name !== selectedLibrary) return false;
                if (selectedModelDataset && (!item.cardData?.datasets || !item.cardData.datasets.includes(selectedModelDataset))) return false;
                break;
            case 'space':
                if (selectedSdk && item.sdk !== selectedSdk) return false;
                if (selectedSpaceModel && (!item.cardData?.models || !item.cardData.models.includes(selectedSpaceModel))) return false;
                if (selectedSpaceDataset && (!item.cardData?.datasets || !item.cardData.datasets.includes(selectedSpaceDataset))) return false;
                break;
        }
        return true;
    });

    // --- Sorting Logic ---
    filtered.sort((a, b) => {
        if (sortBy === 'id') {
            return a.id.localeCompare(b.id);
        } else if (sortBy === 'lastModified') {
            return new Date(b.lastModified) - new Date(a.lastModified);
        } else if (sortBy === 'created_at' && a.cardData?.created_at && b.cardData?.created_at) {
            return new Date(b.cardData.created_at) - new Date(a.cardData.created_at);
        }
        return 0;
    });

    return filtered;
}

/**
 * Populates filter dropdowns dynamically based on the selected repository type.
 * It also hides filters that have no available options.
 */
function populateFilters() {
    const repoType = repoTypeSelect.value;

    // Clear all specific filters to start fresh
    const allSpecificSelects = [
        taskFilterSelect, sizeFilterSelect, libraryFilterSelect, modelDatasetFilterSelect,
        spaceSdkFilterSelect, spaceModelFilterSelect, spaceDatasetFilterSelect
    ];
    allSpecificSelects.forEach(sel => {
        sel.innerHTML = '';
        sel.parentElement.classList.add('hidden'); // Hide wrapper by default
    });

    // Determine which items to scan for populating filters
    const itemsToScan = repoType ? allData[repoType + 's'] : allItems;
    
    // Populate the generic "Tags" dropdown from the 'tags' YAML key
    const allTags = new Set();
    itemsToScan.forEach(item => {
        (item.cardData?.tags || []).forEach(tag => allTags.add(tag));
    });
    populateSelect(tagFilterSelect, [...allTags].sort(), "All Tags");

    // Populate repo-specific filters only if a type is selected
    if (repoType === 'dataset') {
        const tasks = new Set();
        const sizes = new Set();
        allData.datasets.forEach(d => {
            (d.cardData?.task_categories || []).forEach(task => tasks.add(task));
            (d.cardData?.size_categories || []).forEach(size => sizes.add(size));
        });
        populateSelect(taskFilterSelect, [...tasks].sort(), "All Tasks");
        populateSelect(sizeFilterSelect, [...sizes].sort(), "All Sizes");
    } else if (repoType === 'model') {
        const libraries = new Set();
        const datasets = new Set();
        allData.models.forEach(m => {
            if (m.library_name) libraries.add(m.library_name);
            (m.cardData?.datasets || []).forEach(ds => datasets.add(ds));
        });
        populateSelect(libraryFilterSelect, [...libraries].sort(), "All Libraries");
        populateSelect(modelDatasetFilterSelect, [...datasets].sort(), "All Datasets");
    } else if (repoType === 'space') {
        const sdks = new Set();
        const models = new Set();
        const datasets = new Set();
        allData.spaces.forEach(s => {
            if (s.sdk) sdks.add(s.sdk);
            (s.cardData?.models || []).forEach(model => models.add(model));
            (s.cardData?.datasets || []).forEach(ds => datasets.add(ds));
        });
        populateSelect(spaceSdkFilterSelect, [...sdks].sort(), "All SDKs");
        populateSelect(spaceModelFilterSelect, [...models].sort(), "All Models");
        populateSelect(spaceDatasetFilterSelect, [...datasets].sort(), "All Datasets");
    }
}


// --- DOM Element Creation ---
/**
 * Helper function to populate a <select> element and hide its parent if it has no options.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 * @param {Array<string>} options - An array of strings to use as options.
 * @param {string} defaultLabel - The label for the default "all" option.
 */
function populateSelect(selectElement, options, defaultLabel) {
    const parentWrapper = selectElement.parentElement;
    const currentValue = selectElement.value;
    
    selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;
    options.forEach(optionText => {
        const optionElement = document.createElement('option');
        optionElement.value = optionText;
        optionElement.textContent = optionText;
        selectElement.appendChild(optionElement);
    });
    
    selectElement.value = currentValue;

    // Hide/show parent wrapper (which includes the label) if there are no options
    if (options.length > 0) {
        parentWrapper.classList.remove('hidden');
    } else {
        parentWrapper.classList.add('hidden');
    }
}

/**
 * Creates an HTML element for a single catalog item.
 * @param {object} item - The item data object from the API.
 * @returns {HTMLElement} The created card element.
 */
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card relative flex flex-col bg-white rounded-xl shadow-md p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1';

    const repoUrl = `${GITHUB_PAGES_BASE_URL}/${item.id}`;
    // Prioritize pretty_name from metadata, fall back to parsing the ID.
    const prettyName = item.cardData?.pretty_name || item.id.split('/')[1];
    const shortDescription = item.cardData?.short_description || 'No description available.';
    const createdAt = item.cardData?.created_at ? new Date(item.cardData.created_at) : null;
    const isNew = createdAt && (new Date() - createdAt) < 7 * 24 * 60 * 60 * 1000; // Is it newer than 7 days?

    // --- Create sections for identifiers like library, SDK, etc. ---
    const identifiers = {};
    if (item.repoType === 'model' && item.library_name) identifiers['Library'] = [item.library_name];
    if (item.repoType === 'space' && item.sdk) identifiers['SDK'] = [item.sdk];

    const identifierSections = Object.entries(identifiers).map(([key, value]) => {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
        const identifierList = value.map(id => `<span class="bg-gray-100 rounded-full px-2 py-0.5">${id}</span>`).join('');
        return `
            <div class="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                <span class="font-bold">${displayKey}:</span>
                <div class="flex-grow overflow-x-auto tag-container"><div class="flex flex-nowrap gap-2">${identifierList}</div></div>
            </div>`;
    }).join('');

    card.innerHTML = `
        <div class="flex-grow">
            <h2 class="text-xl font-bold mb-2">
                <a href="${repoUrl}" class="text-[#5d8095] hover:underline" target="_blank" rel="noopener noreferrer">${prettyName}</a>
            </h2>
            ${isNew ? '<span class="new-badge absolute top-4 right-4 bg-[#9bcb5e] text-[#92991c] text-xs font-semibold px-2.5 py-1 rounded-full">NEW!</span>' : ''}
            <p class="text-gray-500 text-sm mb-4 line-clamp-3 overflow-y-auto max-h-24">${shortDescription}</p>
            <div class="space-y-2 mb-4">${identifierSections}</div>
        </div>
        <div class="text-xs text-gray-400 mt-2">
            <p>Created: ${createdAt ? createdAt.toLocaleDateString() : 'N/A'}</p>
            <p>Last Updated: ${new Date(item.lastModified).toLocaleDateString()}</p>
        </div>
    `;
    return card;
}
