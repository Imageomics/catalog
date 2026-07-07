import { normalizeTag, filterDisplayTags } from '../utils/normalizeTag.js';
import { handleError } from '../ui/render.js';
import { filterNewAdditionalEntries } from '../utils/filterNewAdditionalEntries.js';

/**
 * Function for fetching Hugging Face repositories (models, datasets, or spaces) from the specified organization.
 * It fetches both org-owned and additional repos, processes metadata, and determines if a repo is "new" based on the provided refresh interval.
 * @async
 * @param {string} repoType - The type of repository to fetch ("datasets", "models", or "spaces").
 * @param {Array} additionalHfRepos - Array of Hugging Face repos, by type to include in addition to org-owned repos
 * @param {string} apiBaseUrl - The base URL for the Hugging Face API
 * @param {string} hfOrgName - The Hugging Face organization name
 * @param {number} refreshIntervalDays - The cutoff in days for determining if a repo is "new"
 * @returns {Promise<Array>} processedItems - A promise resolving to an array of Hugging Face repositories with metadata
 */
export async function fetchHfRepos(
    repoType,
    additionalHfRepos,
    apiBaseUrl,
    hfOrgName,
    refreshIntervalDays
) {

    try {
        // hugging face api requests for datasets/models/spaces
        const response = await fetch(`${apiBaseUrl}${repoType}?author=${hfOrgName}&full=true`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let hfItems = await response.json();

        // Fetch additional HF repos of this type from outside the org
        const additionalForType = additionalHfRepos.filter(entry => entry.type === repoType);
        if (additionalForType.length) {
            const existingIds = new Set(hfItems.map(item => item.id));
            const toFetch = filterNewAdditionalEntries(existingIds, additionalForType);

            const fetched = await Promise.all(
                toFetch.map(entry =>
                    fetch(`${apiBaseUrl}${repoType}/${entry.repo}`)
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
            hfItems = [...hfItems, ...fetched.filter(item => item && !existingIds.has(item.id))];
        }

        // Step 2: If we are fetching models, get the full details for each one.
        if (repoType === 'models') {
            const detailPromises = hfItems.map(item =>
                fetch(`${apiBaseUrl}models/${item.id}`).then(res => {
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
            const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < refreshIntervalDays;

            // Extract tags from the YAML metadata (handling different structures)
            const rawTags = (item.cardData?.tags || item.tags || []).map(t => String(t).toLowerCase());
            const tags = [...new Set(rawTags.flatMap(t => normalizeTag(t)).filter(Boolean))];
            const displayTags = filterDisplayTags(rawTags);

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

        return processedItems;
    } catch (error) {
        handleError(error, `Failed to fetch ${repoType} from Hugging Face. Please check your network connection or the API.`);
        return [];
    }
}
