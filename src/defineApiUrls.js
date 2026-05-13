/**
 * Defines API URLs based on the selected platform (GitHub, note: GitLab and Codeberg support under development).
 * This allows the rest of the codebase to use these constants when making API calls,
 * abstracting away platform-specific URL structures.
 * 
 * Usage: import { getPlatformApiUrls } from './defineApiUrls.js';
 * 
 * Input: platform and organizationName (e.g., 'github' and 'imageomics'), defined from config.yaml and passed to this function.
 * Output: platformApiUrls[platform] = { org: ORG_API_URL, repo: REPO_API_URL }
 */

/**
 * Utility function to get the platform-specific API URLs for organization repos and individual repo details.
 * @param {string} platform - 'github', pending: 'gitlab', or 'codeberg'
 * @param {string} organizationName - The name of the organization (used in URL construction)
 * @returns {object} An object containing ORG_API_URL and REPO_API_URL
 */
export function getPlatformApiUrls(platform, organizationName) {
    /** Update to include 'codeberg' and 'gitlab' once supported */
    const supportedPlatforms = ['github'];
    if (!supportedPlatforms.includes(platform.toLowerCase())) {
        throw new Error(`Unsupported platform: ${platform}. Must be one of: ${supportedPlatforms.join(', ')}`);
    }

    const platformApiUrls = {
        github: {
            org: `https://api.github.com/orgs/${organizationName}/repos?type=public&per_page=100`,
            repo: "https://api.github.com/repos/"
        },
        // gitlab: {
        //     org: `https://gitlab.com/api/v4/groups/${organizationName}/projects?per_page=100`,
        //     repo: "https://gitlab.com/api/v4/projects/"
        // },
        // codeberg: {
        //     org: `https://codeberg.org/api/v1/orgs/${organizationName}/repos?limit=50`,
        //     repo: "https://codeberg.org/api/v1/repos/"
        // }
    };
    return platformApiUrls[platform.toLowerCase()];
}
