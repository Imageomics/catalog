/**
 * Fetches statistics for the Catalog repository itself (Stars, Forks, Version)
 * populates the badge in the top right corner.
 * @param {string} repoApiUrl - The base API URL for the code platform (e.g., GitHub API URL)
 * @param {string} organizationName - The organization name for the catalog repository
 * @param {string} catalogRepoName - The repository name for the catalog itself
 * @returns {Promise<void>} - A promise that resolves when the stats have been fetched and displayed
 */
export const fetchCatalogStats = async (repoApiUrl, organizationName, catalogRepoName) => {
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
        //TODO: Update stars and forks to support other platforms (GitLab, Codeberg) once implemented
        // 1. Get Stars & Forks
        const repo = await fetch(`${repoApiUrl}${organizationName}/${catalogRepoName}`).then(r => r.ok ? r.json() : {});
        if (repo.stargazers_count !== undefined) update('gh-stars', 'gh-star-container', repo.stargazers_count);
        if (repo.forks_count !== undefined) update('gh-forks', 'gh-fork-container', repo.forks_count);

        // 2. Get Version (Tag)
        // TODO: Import from package.json
        const release = await fetch(`${repoApiUrl}${organizationName}/${catalogRepoName}/releases/latest`).then(r => r.ok ? r.json() : {});
        if (release.tag_name) update('gh-tag', 'gh-version-container', release.tag_name);

    } catch (e) {
        console.warn("Could not fetch Code Repo stats", e);
    }
};
