import { normalizeTag } from './normalizeTag.js';
import { getPlatformDisplay } from './defineRibbonVals.js';

/**
 * Function for fetching code repositories from the specified platform (GitHub, GitLab, or Codeberg).
 * Both org-owned (non-forks) and additional repos are fetched; metadata is processed for each repo.
 * It also determines if a repo is "new" based on the provided refresh interval.
 * @async
 * @param {string} platform  - 'github', pending: 'gitlab', or 'codeberg'
 * @param {Array} additionalRepos - An array of additional "owner/repo" strings to include in addition to non-forked org repos.
 * @param {string} orgApiUrl - The API URL for fetching organization repos
 * @param {string} repoApiUrl - The API URL for fetching individual repo details
 * @param {number} refreshIntervalDays - The cutoff in days for determining if a repo is "new"
 * @param {Map} releasesMap - A Map of release information for repos, keyed by full_name
 * @param {object} tagLookup - An object for normalizing tags, uses specified tag-groups
 * @returns {Promise<Array>} processedItems - A promise resolving to an array of code repositories
 */
export async function fetchCodeRepos(
    platform,
    additionalRepos,
    orgApiUrl,
    repoApiUrl,
    refreshIntervalDays,
    releasesMap,
    tagLookup
) {

    let allRepos = [];
    let nextUrl = `${orgApiUrl}`;
    try {
        while (nextUrl) {
            const ghResponse = await fetch(nextUrl);

            if (!ghResponse.ok) {
                const platformDisplay = getPlatformDisplay(platform);
                throw new Error(`${platformDisplay.displayName || platform} error: ${ghResponse.status}`);
            }

            const page = await ghResponse.json();
            allRepos = allRepos.concat(page);

            // Parse the Link header to find the next page URL, if any
            const linkHeader = ghResponse.headers.get('Link');
            const match = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = match ? match[1] : null;
        }

        // For org-owned entries in additionalRepos, reuse data already in allRepos to avoid redundant API calls.
        // Only fetch entries that belong to a different org (external repos).
        const allReposByFullName = new Map(allRepos.map(r => [r.full_name, r]));
        const toFetch = additionalRepos.filter(ownerRepo => !allReposByFullName.has(ownerRepo));
        const fromAllRepos = additionalRepos.map(ownerRepo => allReposByFullName.get(ownerRepo)).filter(Boolean);

        const fetchedExternalData = await Promise.all(
            toFetch.map(ownerRepo =>
                fetch(`${repoApiUrl}${ownerRepo}`)
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
        const filteredAdditionalRepos = [...fromAllRepos, ...fetchedExternalData.filter(Boolean)];

        // Keep only non-forks from org; deduplicate against additional repos by full_name
        const orgRepoNames = new Set(filteredAdditionalRepos.map(r => r.full_name));
        const orgNonForks = allRepos.filter(repo => repo.name !== ".github" && !repo.fork && !orgRepoNames.has(repo.full_name));

        // Process additional repos and all remaining org non-forks to include metadata and 'new' flag as appropriate
        let processedItems = [...filteredAdditionalRepos, ...orgNonForks]
            .map(repo => {
                const createdAt = new Date(repo.created_at);
                const lastModified = new Date(repo.updated_at);
                const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < refreshIntervalDays;

                const rawTags = (repo.topics || []).map(t => t.toLowerCase());
                const tags = [...new Set(rawTags.flatMap(t => normalizeTag(t, tagLookup)).filter(Boolean))];
                const displayTags = rawTags.filter(t => !t.includes(':'));

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

        return processedItems;
    } catch (error) {
        handleError(error, `Failed to fetch code from ${platform}. Please check your network connection or the API.`);
        return [];
    }
}