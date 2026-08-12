import { handleError } from '../ui/render.js';
import { getPlatformVals } from '../utils/definePlatformVals.js';
import { getPlatformDisplay } from '../utils/defineRibbonVals.js';
import { normalizeTag, filterDisplayTags } from '../utils/normalizeTag.js';

/**
 * Function for fetching code repositories from the specified platform (GitHub, GitLab, or Codeberg).
 * Both org-owned (non-forks) and additional repos are fetched; metadata is processed for each repo.
 * It also determines if a repo is "new" based on the provided refresh interval.
 * @async
 * @param {string} platform  - 'github', 'gitlab', or 'codeberg'
 * @param {Array} additionalRepos - An array of additional "owner/repo" strings to include in addition to non-forked
 * org repos.
 * @param {string} orgApiUrl - The API URL for fetching organization repos
 * @param {string} repoApiUrl - The API URL for fetching individual repo details
 * @param {number} refreshIntervalDays - The cutoff in days for determining if a repo is "new"
 * @param {Record<string, { tag: string, url: string, publishedAt: string, isNew: boolean } | null>} releasesMap -
 * Release information for repos, keyed by full_name
 * @returns {Promise<Array>} processedItems - A promise resolving to an array of code repositories
 */
export async function fetchCodeRepos(
    platform,
    additionalRepos,
    orgApiUrl,
    repoApiUrl,
    refreshIntervalDays,
    releasesMap
) {

    let allRepos = [];
    let nextUrl = `${orgApiUrl}`;
    // get platform-specific keys
    const { starsKey, profileRepo, fullNameKey, forkKey, urlKey, encodeRepoId } = getPlatformVals(platform);
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
        const allReposByFullName = new Map(allRepos.map(r => [r[fullNameKey], r]));
        const toFetch = additionalRepos.filter(ownerRepo => !allReposByFullName.has(ownerRepo));
        const fromAllRepos = additionalRepos.map(ownerRepo => allReposByFullName.get(ownerRepo)).filter(Boolean);

        const fetchedExternalData = await Promise.all(
            toFetch.map(ownerRepo =>
                fetch(`${repoApiUrl}${encodeRepoId(ownerRepo)}`)
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
        const orgRepoNames = new Set(filteredAdditionalRepos.map(r => r[fullNameKey]));
        const orgNonForks = allRepos.filter(repo =>
            repo.name !== profileRepo &&
            !repo[forkKey] &&
            !orgRepoNames.has(repo[fullNameKey]));

        // Process additional repos and all remaining org non-forks to include metadata and 'new' flag as appropriate
        let processedItems = [...filteredAdditionalRepos, ...orgNonForks]
            .map(repo => {
                const createdAt = new Date(repo.created_at);
                const lastModified = new Date(repo.updated_at);
                const isNew = (new Date() - createdAt) / (1000 * 60 * 60 * 24) < refreshIntervalDays;

                const rawTags = (repo.topics || []).map(t => t.toLowerCase());
                const tags = [...new Set(rawTags.flatMap(t => normalizeTag(t)).filter(Boolean))];
                const displayTags = filterDisplayTags(rawTags);

                const release = releasesMap[repo[fullNameKey]] ?? null;

                return {
                    id: repo[fullNameKey], // "Imageomics/<repo-name>", used as backup if can't get repo.name
                    repoType: "code",
                    createdAt,
                    lastModified,
                    isNew,
                    archived: repo.archived || false,
                    tags,
                    rawTags,
                    displayTags,
                    description: repo.description, // fallback in display (render.js)
                    html_url: repo[urlKey],
                    hasNewRelease: release?.isNew ?? false,
                    latestReleaseUrl: release?.url ?? null,
                    latestReleaseTag: release?.tag ?? null,
                    cardData: {
                        pretty_name: repo.name, // <repo-name>, the one used for card title display
                        stars: repo[starsKey] ?? 0
                    }
                };
            });

        return processedItems;
    } catch (error) {
        handleError(error, `Failed to fetch code from ${platform}. Please check your network connection or the API.`);
        return [];
    }
}
