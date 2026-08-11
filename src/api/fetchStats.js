/**
 * Fetches statistics for the Catalog repository itself (Stars, Forks, Version)
 * populates the badge in the top right corner.
 * @param {string} repoApiUrl - The base API URL for the code platform (e.g., GitHub API URL)
 * @param {string} organizationName - The organization name for the catalog repository
 * @param {string} catalogRepoName - The repository name for the catalog itself
 * @param {string} releaseSuffix - The suffix used for fetching the latest release information (e.g., 'releases/latest')
 * @returns {Promise<void>} - A promise that resolves when the stats have been fetched and displayed
 */
export const fetchCatalogStats = async (repoApiUrl, organizationName, catalogRepoName, releaseSuffix) => {
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

    // Need to URL-encode the owner/repo for GitLab API ('%2F' instead of '/'), but need '/' for GitHub and Codeberg.
    const ownerRepo = repoApiUrl.includes("gitlab") ? `${organizationName}%2F${catalogRepoName}` : `${organizationName}/${catalogRepoName}`;

    try {
        // platform isn't passed, forks_count is shared
        // 1. Get Stars & Forks
        const repo = await fetch(`${repoApiUrl}${ownerRepo}`).then(r => r.ok ? r.json() : {});
        const star_count = repo.stargazers_count ?? repo.stars_count ?? repo.star_count;
        if (star_count !== undefined) update('gh-stars', 'gh-star-container', star_count);
        if (repo.forks_count !== undefined) update('gh-forks', 'gh-fork-container', repo.forks_count);

        // 2. Get Version (Tag)
        const release = await fetch(`${repoApiUrl}${ownerRepo}/${releaseSuffix}`).then(r => r.ok ? r.json() : {});
        if (release.tag_name !== undefined) update('gh-tag', 'gh-version-container', release.tag_name);

    } catch (e) {
        console.warn("Could not fetch Code Repo stats", e);
    }
};
