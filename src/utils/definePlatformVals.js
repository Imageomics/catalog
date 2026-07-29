/**
 * Collection of functions to define platform-specific values for the catalog, such as API URLs, display values, and repo data keys.
 * Each function returns dictionaries with the platform values that have been keyed by platform name (e.g., 'github', 'codeberg', 'gitlab') and potentially other instance-specific values (e.g., organizationName, repoApiUrl).
 * Platform and organization name are defined from config.yaml and passed to the functions requiring them.
*/


/**
 * Utility function to get platform-specific values for repo data keys (e.g., star count and profile repo name).
 * @param {string} platform
 * @returns {Object} platformVals - An object containing platform-specific values for repo data keys (e.g., star count and profile repo name)
 */
export function getPlatformVals(platform) {
    const platformVals = {
    github: {
        starsKey: 'stargazers_count',
        profileRepo: '.github',
        fullNameKey: 'full_name',
        forkKey: 'fork', //forks_count is shared
        urlKey: 'html_url',
        releasePublishedAtKey: 'published_at'
    },
    /* gitlab: {
        starsKey: 'star_count',
        profileRepo: 'gitlab-profile',
        fullNameKey: 'name_with_namespace',
        forkKey: 'forked_from_project',
        urlKey: 'web_url',
        releasePublishedAtKey: 'released_at'
    }, */
    codeberg: {
        starsKey: 'stars_count',
        profileRepo: '.profile',
        fullNameKey: 'full_name',
        forkKey: 'fork',
        urlKey: 'html_url',
        releasePublishedAtKey: 'published_at'
    }
};
    return platformVals[platform.toLowerCase()];
}


/**
 * Utility function to get the platform-specific API URLs for organization repos and individual repo details.
 * Defines API URLs based on the selected platform (GitHub or Codeberg, note: GitLab support under development).
 * This allows the rest of the codebase to use these constants when making API calls,
 * abstracting away platform-specific URL structures.
 *
 * Usage: import { getPlatformApiUrls } from './definePlatformVals.js';
 *
 * Input: platform and organizationName (e.g., 'github' and 'imageomics'), defined from config.yaml and passed to this function.
 * Output: platformApiUrls[platform] = { org: ORG_API_URL, repo: REPO_API_URL }
 *
 * @param {string} platform - 'github' or 'codeberg', pending: 'gitlab'
 * @param {string} organizationName - The name of the organization (used in URL construction)
 * @returns {object} An object containing ORG_API_URL and REPO_API_URL
 */
export function getPlatformApiUrls(platform, organizationName) {
    const platformApiUrls = {
        github: {
            org: `https://api.github.com/orgs/${organizationName}/repos?type=public&per_page=100`,
            repo: "https://api.github.com/repos/",
            releaseSuffix: "releases/latest"
        },
        // gitlab: {
        //     org: `https://gitlab.com/api/v4/groups/${organizationName}/projects?per_page=100`,
        //     repo: "https://gitlab.com/api/v4/projects/",
        //     releaseSuffix: "releases/permalink/latest"
        // },
        codeberg: {
            org: `https://codeberg.org/api/v1/orgs/${organizationName}/repos?limit=50`,
            repo: "https://codeberg.org/api/v1/repos/",
            releaseSuffix: "releases/latest"
        }
    };
    return platformApiUrls[platform.toLowerCase()];
}
