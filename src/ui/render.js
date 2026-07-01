/**
 * This module contains functions for presentation of code repositories, datasets, models, or spaces in HTML.
 * It includes functions for escaping HTML, adding word break opportunities, and rendering item cards.
 */

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

    // stars for code repos
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
export const renderItemList = (items, repoType) => {
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
