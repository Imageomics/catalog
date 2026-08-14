/**
 * Script utilities for platform-specific API calls and headers when exporting tags or fetching repo release data.
 * Collection of functions to define platform-specific values needed only in build-time/workflow scripts.
 * Each function returns dictionaries with the platform values that have been keyed by platform name (e.g., 'github', 'gitlab', 'codeberg') and potentially other instance-specific values (e.g., organizationName, repoApiUrl).
 * Platform and organization name are defined from config.yaml and passed to the functions requiring them.
*/


/**
 * Utility function to get platform-specific values for repo data keys (e.g., star count and profile repo name).
 * @param {string} platform - 'github', 'gitlab', or 'codeberg'
 * @returns {Object} platformVals - An object containing platform-specific values for repo data keys (e.g., release URL and published date key)
 */
export function getPlatformReleaseVals(platform) {
    const platformVals = {
    github: {
        getReleaseUrl: (data) => data.html_url,
        releasePublishedAtKey: 'published_at'
    },
    gitlab: {
        getReleaseUrl: (data, repoId) => {
            const tag = encodeURIComponent(data.tag_name);
            return `https://gitlab.com/${repoId}/-/releases/${tag}`;
        },
        releasePublishedAtKey: 'released_at'
    },
    codeberg: {
        getReleaseUrl: (data) => data.html_url,
        releasePublishedAtKey: 'published_at'
    }
};
    return platformVals[platform.toLowerCase()];
}

// Define platform-specific token authentication and API host information for scripts to use when making API calls.
const tokenAuthByPlatform = {
    github: {
        token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
        apiHost : 'api.github.com',
        authScheme: 'Bearer',
     },
    gitlab: {
        token: process.env.GITLAB_TOKEN,
        apiHost : 'gitlab.com/api/v4',
        authScheme: 'Bearer',
    },
    codeberg: {
        token: process.env.CODEBERG_TOKEN,
        apiHost : 'codeberg.org/api/v1',
        authScheme: 'token'
    },
};
/**
 * Utility function for scripts to get platform-specific headers
* Update the corresponding workflow as needed for non-GitHub code platforms (e.g., Codeberg or GitLab)
* `headers['Accept']` is only needed for GitHub to avoid 403 errors on some endpoints.
* @param {string} url - URL to check for the platform API host
* @param {string} platform - 'github', 'gitlab', or 'codeberg'
* @param {string} orgName - The name of the organization as used in API calls
* @returns {object} headers - headers object to use for fetch requests
*/
export function getPlatformHeaders(url, platform, orgName) {
    const { token, apiHost, authScheme } = tokenAuthByPlatform[platform];
    const cleanedOrgName = orgName.replace(/[^a-zA-Z0-9_-]/g, '');
    const headers = { 'User-Agent': `${cleanedOrgName}-catalog-build-script` };
    if (token && apiHost && url.includes(apiHost)) {
      headers['Authorization'] = `${authScheme} ${token}`;
      if (platform === 'github') {
        headers['Accept'] = 'application/vnd.github+json';
      }
    }
    return headers;
}
