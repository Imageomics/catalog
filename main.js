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
const modalityFilterSelect = document.getElementById('modalityFilter');

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
        searchInput, repoTypeSelect, sortBySelect, tagFilterSelect,
        taskFilterSelect, modalityFilterSelect, libraryFilterSelect,
        modelDatasetFilterSelect, spaceSdkFilterSelect, spaceModelFilterSelect,
        spaceDatasetFilterSelect
    ];
    triggers.forEach(el => el.addEventListener('input', renderItems));
    repoTypeSelect.addEventListener('change', toggleFilterVisibility);
}

// --- UI Rendering and State Management ---
/**
 * Toggles the visibility of filter sections based on the selected repository type.
 * @param {Event} event - The change event from the repoType select dropdown.
 */
function toggleFilterVisibility(event) {
    const selectedType = event.target.value;
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
    const selectedModality = modalityFilterSelect.value;
    // Model filters
    const selectedLibrary = libraryFilterSelect.value;
    const selectedModelDataset = modelDatasetFilterSelect.value;
    // Space filters
    const selectedSdk = spaceSdkFilterSelect.value;
    const selectedSpaceModel = spaceModelFilterSelect.value;
    const selectedSpaceDataset = spaceDatasetFilterSelect.value;

    let filtered = allItems.filter(item => {
        const searchMatch = !searchTerm || item.id.toLowerCase().includes(searchTerm) || (item.cardData?.short_description || '').toLowerCase().includes(searchTerm);
        const repoMatch = !repoType || item.repoType === repoType;

        if (!searchMatch || !repoMatch) return false;

        // General Tag Filter (applies to all)
        if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) return false;

        // Type-specific filters
        switch (item.repoType) {
            case 'dataset':
                if (selectedTask && (!item.tags || !item.tags.includes(selectedTask))) return false;
                if (selectedModality && (!item.tags || !item.tags.includes(selectedModality))) return false;
                break;
            case 'model':
                if (selectedLibrary && item.library_name !== selectedLibrary) return false;
                if (selectedModelDataset && (!item.tags || !(item.tags.includes(selectedModelDataset) || item.tags.includes(`dataset:${selectedModelDataset}`)))) return false;
                break;
            case 'space':
                if (selectedSdk && item.sdk !== selectedSdk) return false;
                if (selectedSpaceModel && (!item.tags || !(item.tags.includes(selectedSpaceModel) || item.tags.includes(`model:${selectedSpaceModel}`)))) return false;
                if (selectedSpaceDataset && (!item.tags || !(item.tags.includes(selectedSpaceDataset) || item.tags.includes(`dataset:${selectedSpaceDataset}`)))) return false;
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
 * Populates all filter dropdowns with unique values extracted from the fetched data.
 */
function populateFilters() {
    const allTags = new Set();
    const datasetTasks = new Set();
    const datasetModalities = new Set();
    const modelLibraries = new Set();
    const spaceSDKs = new Set();

    // Extract all unique values from the data
    allData.datasets.forEach(d => (d.tags || []).forEach(tag => {
        allTags.add(tag);
        datasetTasks.add(tag); // For datasets, tasks & modalities are just tags
        datasetModalities.add(tag);
    }));
    allData.models.forEach(m => {
        (m.tags || []).forEach(tag => allTags.add(tag));
        if (m.library_name) modelLibraries.add(m.library_name);
    });
    allData.spaces.forEach(s => {
        (s.tags || []).forEach(tag => allTags.add(tag));
        if (s.sdk) spaceSDKs.add(s.sdk);
    });

    // --- Populate all dropdowns ---
    populateSelect(tagFilterSelect, [...allTags].sort(), 'All Tags');
    populateSelect(taskFilterSelect, [...datasetTasks].sort(), 'All Tasks');
    populateSelect(modalityFilterSelect, [...datasetModalities].sort(), 'All Modalities');
    populateSelect(libraryFilterSelect, [...modelLibraries].sort(), 'All Libraries');
    populateSelect(spaceSdkFilterSelect, [...spaceSDKs].sort(), 'All SDKs');

    // Populate cross-repo filters
    const allDatasetIds = allData.datasets.map(d => d.id).sort();
    const allModelIds = allData.models.map(m => m.id).sort();
    populateSelect(modelDatasetFilterSelect, allDatasetIds, 'All Datasets');
    populateSelect(spaceDatasetFilterSelect, allDatasetIds, 'All Datasets');
    populateSelect(spaceModelFilterSelect, allModelIds, 'All Models');
}

// --- DOM Element Creation ---
/**
 * Helper function to populate a <select> element with options.
 * @param {HTMLSelectElement} selectElement - The dropdown element to populate.
 * @param {string[]} options - An array of strings to use as options.
 * @param {string} defaultLabel - The label for the default "all" option.
 */
function populateSelect(selectElement, options, defaultLabel) {
    const currentValue = selectElement.value;
    selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
    selectElement.value = currentValue; // Preserve selection
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
    const prettyName = item.id.split('/')[1];
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
