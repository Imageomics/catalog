//
// Hugging Face Hub Catalog - Frontend Logic
// This script handles data fetching, searching, filtering, and rendering for Hugging Face datasets, models, and spaces.
//
// --- Global Constants and API Endpoints ---
const GITHUB_PAGES_BASE_URL = 'https://huggingface.co';
const ORGANIZATION_NAME = 'imageomics';
const API_URL = 'https://huggingface.co/api/models';
const DATASET_URL = 'https://huggingface.co/api/datasets';
const SPACES_URL = 'https://huggingface.co/api/spaces';

// --- DOM Element References ---
// We select all the necessary elements from the HTML file to interact with them.
const searchInput = document.getElementById('searchInput');
const repoTypeSelect = document.getElementById('repoType');
const sortBySelect = document.getElementById('sortBy');
const tagFilterSelect = document.getElementById('tagFilter');
const itemList = document.getElementById('itemList');
const emptyState = document.getElementById('emptyState');

// Specific filter containers and dropdowns that are shown/hidden dynamically.
const datasetFilters = document.getElementById('datasetFilters');
const modelFilters = document.getElementById('modelFilters');
const spaceFilters = document.getElementById('spaceFilters');
const taskFilterSelect = document.getElementById('taskFilter');
const modalityFilterSelect = document.getElementById('modalityFilter');
const libraryFilterSelect = document.getElementById('libraryFilter');
const modelDatasetFilterSelect = document.getElementById('modelDatasetFilter');
const sdkFilterSelect = document.getElementById('sdkFilter');
const spaceModelFilterSelect = document.getElementById('spaceModelFilter');
const spaceDatasetFilterSelect = document.getElementById('spaceDatasetFilter');

// --- Global State Variables ---
// `allItems` stores all fetched data to avoid re-fetching on every filter change.
let allItems = [];
// `currentRepoType` tracks the currently selected repository type.
let currentRepoType = 'datasets';

// --- Event Listeners ---
// The main event listeners for user interactions.
document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial data when the page loads (defaults to datasets).
    fetchItems(DATASET_URL, 'datasets');
});

// `input` event on the search bar triggers a re-render of the items.
searchInput.addEventListener('input', renderItems);
// `change` event on the repository type dropdown triggers a new data fetch.
repoTypeSelect.addEventListener('change', () => {
    currentRepoType = repoTypeSelect.value;
    // Show a loading skeleton while the new data is fetched.
    itemList.innerHTML = `
        <div class="skeleton-card skeleton rounded-xl p-6 h-64"></div>
        <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden sm:block"></div>
        <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden lg:block"></div>
        <div class="skeleton-card skeleton rounded-xl p-6 h-64 hidden xl:block"></div>
    `;

    // Reset all dynamic filter dropdowns to their default state.
    tagFilterSelect.value = "";
    taskFilterSelect.value = "";
    modalityFilterSelect.value = "";
    libraryFilterSelect.value = "";
    modelDatasetFilterSelect.value = "";
    sdkFilterSelect.value = "";
    spaceModelFilterSelect.value = "";
    spaceDatasetFilterSelect.value = "";

    // Hide all dynamic filter containers before deciding which one to show.
    datasetFilters.classList.add('hidden');
    modelFilters.classList.add('hidden');
    spaceFilters.classList.add('hidden');

    // Fetch data and show the appropriate filters based on the selected repository type.
    switch (currentRepoType) {
        case 'datasets':
            fetchItems(DATASET_URL, 'datasets');
            datasetFilters.classList.remove('hidden');
            break;
        case 'models':
            fetchItems(API_URL, 'models');
            modelFilters.classList.remove('hidden');
            break;
        case 'spaces':
            fetchItems(SPACES_URL, 'spaces');
            spaceFilters.classList.remove('hidden');
            break;
    }
});

// Listeners for all filter and sort dropdowns to trigger a re-render.
sortBySelect.addEventListener('change', renderItems);
tagFilterSelect.addEventListener('change', renderItems);
taskFilterSelect.addEventListener('change', renderItems);
modalityFilterSelect.addEventListener('change', renderItems);
libraryFilterSelect.addEventListener('change', renderItems);
modelDatasetFilterSelect.addEventListener('change', renderItems);
sdkFilterSelect.addEventListener('change', renderItems);
spaceModelFilterSelect.addEventListener('change', renderItems);
spaceDatasetFilterSelect.addEventListener('change', renderItems);

// --- Core Functions ---

/**
 * Fetches items from the Hugging Face API for a given repository type.
 * @param {string} url The API endpoint URL.
 * @param {string} type The type of repository ('datasets', 'models', or 'spaces').
 */
async function fetchItems(url, type) {
    try {
        const response = await fetch(`${url}?author=${ORGANIZATION_NAME}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allItems = await response.json();
        
        // Populate the filter dropdowns with unique options from the fetched data.
        populateFilters(allItems, type);

        // Render the items for the first time after fetching.
        renderItems();
    } catch (error) {
        console.error('Could not fetch items:', error);
        itemList.innerHTML = `<p class="text-red-500 text-center col-span-full">Error fetching data. Please try again later.</p>`;
    }
}

/**
 * Populates the filter dropdowns based on the repository type.
 * It gathers all unique tags, tasks, etc., and adds them as options.
 * @param {Array<Object>} items The list of repository items.
 * @param {string} type The type of repository.
 */
function populateFilters(items, type) {
    // Use `Set` to automatically handle unique values.
    const allTags = new Set();
    const allTasks = new Set();
    const allModalities = new Set();
    const allLibraries = new Set();
    const allDatasets = new Set();
    const allSDKs = new Set();
    const allModels = new Set();

    items.forEach(item => {
        if (item.cardData) {
            // All repository types have tags.
            if (item.cardData.tags) {
                item.cardData.tags.forEach(tag => allTags.add(tag));
            }

            // Populate type-specific filters based on the current repository type.
            if (type === 'datasets') {
                if (item.cardData.tasks) {
                    item.cardData.tasks.forEach(task => allTasks.add(task));
                }
                if (item.cardData.modalities) {
                    item.cardData.modalities.forEach(modality => allModalities.add(modality));
                }
            } else if (type === 'models') {
                if (item.cardData.library_name) {
                    allLibraries.add(item.cardData.library_name);
                }
                if (item.cardData.datasets) {
                    item.cardData.datasets.forEach(dataset => allDatasets.add(dataset));
                }
            } else if (type === 'spaces') {
                if (item.cardData.sdk) {
                    allSDKs.add(item.cardData.sdk);
                }
                if (item.cardData.models) {
                    item.cardData.models.forEach(model => allModels.add(model));
                }
                if (item.cardData.datasets) {
                    item.cardData.datasets.forEach(dataset => allDatasets.add(dataset));
                }
            }
        }
    });

    // Render the collected unique options into their respective select elements.
    renderOptions(tagFilterSelect, Array.from(allTags).sort());

    if (type === 'datasets') {
        renderOptions(taskFilterSelect, Array.from(allTasks).sort());
        renderOptions(modalityFilterSelect, Array.from(allModalities).sort());
    } else if (type === 'models') {
        renderOptions(libraryFilterSelect, Array.from(allLibraries).sort());
        renderOptions(modelDatasetFilterSelect, Array.from(allDatasets).sort());
    } else if (type === 'spaces') {
        renderOptions(sdkFilterSelect, Array.from(allSDKs).sort());
        renderOptions(spaceModelFilterSelect, Array.from(allModels).sort());
        renderOptions(spaceDatasetFilterSelect, Array.from(allDatasets).sort());
    }
}

/**
 * Helper function to render options in a given select element.
 * It clears existing options and adds new ones.
 * @param {HTMLSelectElement} selectElement The select element to populate.
 * @param {Array<string>} options The options to add.
 */
function renderOptions(selectElement, options) {
    // Start from index 1 to preserve the "All..." option.
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    options.forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option;
        newOption.textContent = option;
        selectElement.appendChild(newOption);
    });
}

/**
 * Renders the filtered and sorted items to the UI.
 * This is the main function that updates the item list on the page.
 */
function renderItems() {
    // Start with a copy of all items to filter.
    let filteredItems = [...allItems];
    const searchTerm = searchInput.value.toLowerCase();
    const selectedTag = tagFilterSelect.value;
    const sortBy = sortBySelect.value;

    // --- Filtering Logic ---
    // Filter by type-specific dropdowns first.
    if (currentRepoType === 'datasets') {
        const selectedTask = taskFilterSelect.value;
        const selectedModality = modalityFilterSelect.value;
        if (selectedTask) {
            filteredItems = filteredItems.filter(item => item.cardData?.tasks?.includes(selectedTask));
        }
        if (selectedModality) {
            filteredItems = filteredItems.filter(item => item.cardData?.modalities?.includes(selectedModality));
        }
    } else if (currentRepoType === 'models') {
        const selectedLibrary = libraryFilterSelect.value;
        const selectedDataset = modelDatasetFilterSelect.value;
        if (selectedLibrary) {
            filteredItems = filteredItems.filter(item => item.cardData?.library_name === selectedLibrary);
        }
        if (selectedDataset) {
            filteredItems = filteredItems.filter(item => item.cardData?.datasets?.includes(selectedDataset));
        }
    } else if (currentRepoType === 'spaces') {
        const selectedSDK = sdkFilterSelect.value;
        const selectedModel = spaceModelFilterSelect.value;
        const selectedDataset = spaceDatasetFilterSelect.value;
        if (selectedSDK) {
            filteredItems = filteredItems.filter(item => item.cardData?.sdk === selectedSDK);
        }
        if (selectedModel) {
            filteredItems = filteredItems.filter(item => item.cardData?.models?.includes(selectedModel));
        }
        if (selectedDataset) {
            filteredItems = filteredItems.filter(item => item.cardData?.datasets?.includes(selectedDataset));
        }
    }

    // Filter by search term across multiple fields (name, description, tags, etc.).
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => {
            const prettyName = item.cardData?.pretty_name || item.id.split('/')[1];
            const description = item.cardData?.description || '';
            const allIdentifiers = [
                prettyName,
                description,
                ...(item.cardData?.tags || []),
                ...(item.cardData?.tasks || []),
                ...(item.cardData?.modalities || []),
                item.cardData?.library_name,
                ...(item.cardData?.datasets || []),
                item.cardData?.sdk,
                ...(item.cardData?.models || []),
                item.cardData?.language
            ].filter(Boolean).join(' ').toLowerCase();

            return allIdentifiers.includes(searchTerm);
        });
    }

    // Filter by the selected tag.
    if (selectedTag) {
        filteredItems = filteredItems.filter(item => item.cardData?.tags?.includes(selectedTag));
    }
    
    // --- Sorting Logic ---
    filteredItems.sort((a, b) => {
        const aDate = new Date(a.lastModified);
        const bDate = new Date(b.lastModified);
        const aName = a.cardData?.pretty_name || a.id.split('/')[1];
        const bName = b.cardData?.pretty_name || b.id.split('/')[1];

        if (sortBy === 'lastModified') {
            return bDate - aDate;
        } else if (sortBy === 'createdAt') {
            const aCreated = new Date(a.createdAt);
            const bCreated = new Date(b.createdAt);
            return bCreated - aCreated;
        } else if (sortBy === 'alphabetical_asc') {
            return aName.localeCompare(bName);
        } else if (sortBy === 'alphabetical_desc') {
            return bName.localeCompare(aName);
        }
    });

    // --- Rendering Logic ---
    // Clear the current item list.
    itemList.innerHTML = '';
    // Show the empty state message if no items are found, otherwise render the cards.
    if (filteredItems.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filteredItems.forEach(item => {
            const card = createCard(item);
            itemList.appendChild(card);
        });
    }
}

/**
 * Creates a single item card element with all relevant details.
 * @param {Object} item The repository item data.
 * @returns {HTMLElement} The created card element.
 */
function createCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card flex flex-col p-6 rounded-xl shadow-md transition-transform';

    const prettyName = item.cardData?.pretty_name || item.id.split('/')[1];
    const shortDescription = item.cardData?.description || 'No description provided.';
    const createdDate = new Date(item.createdAt);
    const lastModifiedDate = new Date(item.lastModified);
    // Determine if the item is "new" (created within the last 7 days).
    const isNew = (Date.now() - createdDate.getTime()) < (7 * 24 * 60 * 60 * 1000);

    const repoUrl = `${GITHUB_PAGES_BASE_URL}/${item.id}`;

    // Get all identifiers and categorize them to be displayed on the card.
    const allIdentifiers = {
        tags: item.cardData?.tags || [],
        tasks: item.cardData?.tasks || [],
        modalities: item.cardData?.modalities || [],
        libraries: item.cardData?.library_name ? [item.cardData.library_name] : [],
        datasets: item.cardData?.datasets || [],
        sdk: item.cardData?.sdk ? [item.cardData.sdk] : [],
        models: item.cardData?.models || [],
        language: item.cardData?.language ? [item.cardData.language] : [],
        license: item.cardData?.license ? [item.cardData.license] : [],
    };
    
    // Sort and filter out empty categories for display.
    const identifierSections = Object.entries(allIdentifiers)
        .filter(([, value]) => value.length > 0)
        .map(([key, value]) => {
            const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
            const identifierList = value.map(id => `<span class="bg-gray-100 rounded-full px-2 py-0.5">${id}</span>`).join('');
            return `
                <div class="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                    <span class="font-bold">${displayKey}:</span>
                    <div class="flex-grow overflow-x-auto tag-container">
                        <div class="flex flex-nowrap gap-2">
                            ${identifierList}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    // Construct the final HTML for the card.
    card.innerHTML = `
        <div class="flex-grow">
            <h2 class="text-xl font-bold mb-2">
                <a href="${repoUrl}" class="text-[#5d8095] hover:underline" target="_blank">${prettyName}</a>
            </h2>
            ${isNew ? '<span class="new-badge absolute top-4 right-4 bg-[#9bcb5e] text-[#92991c] text-xs font-semibold px-2.5 py-1 rounded-full">NEW!</span>' : ''}
            <p class="text-gray-500 text-sm mb-4 line-clamp-3 overflow-y-auto max-h-24">${shortDescription}</p>
            
            <div class="space-y-2 mb-4">
                ${identifierSections}
            </div>
        </div>
        
        <div class="text-xs text-gray-400 mt-2">
            <p>Created: ${createdDate.toLocaleDateString()}</p>
            <p>Updated: ${lastModifiedDate.toLocaleDateString()}</p>
        </div>
    `;

    return card;
}
