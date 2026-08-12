/**
 * Script utilities for platform-specific API calls and headers when exporting tags or fetching repo release data.
 */


// Update the corresponding workflow as needed for non-GitHub code platforms (e.g., Codeberg or GitLab)
const platform = (CONFIG.PLATFORM || 'github').toLowerCase();
const tokenByPlatform = {
    github: process.env.GITHUB_TOKEN,
    gitlab: process.env.GITLAB_TOKEN,
    codeberg: process.env.CODEBERG_TOKEN,
};
const TOKEN = tokenByPlatform[platform];
const authScheme = platform === 'codeberg' ? 'token' : 'Bearer';
const headers = TOKEN
    ? { Authorization: `${authScheme} ${TOKEN}`, 'User-Agent': 'catalog-build-script' }
    : { 'User-Agent': 'catalog-build-script' };




const tokenAuthByPlatform = {
    github: {
        token: process.env.GITHUB_TOKEN,
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
* @returns {object} headers - headers object to use for fetch requests
*/
export function getPlatformHeaders(url, platform) {
    const { token, apiHost, authScheme } = tokenAuthByPlatform[platform];
    const headers = { 'User-Agent': 'catalog-build-script' };
    if (token && apiHost && url.includes(platformApiHost)) {
      headers['Authorization'] = `${authScheme} ${TOKEN}`;
      if (platform === 'github') {
        headers['Accept'] = 'application/vnd.github+json';
      }
    }
    return headers;
}

/**
 * Utility function to convert a repository ID to the format expected by GitLab's API when fetching release info. No change for other code platforms.
 * @param {string} platform - 'github', 'gitlab', or 'codeberg'
 * @param {string} repoId - The repository ID (e.g., 'imageomics/sample-repo')
 * @returns {string} platform-specific repo ID for API calls (e.g., URL-encoded for GitLab)
 */
export function toApiRepoId(platform, repoId) {
    return normalizePlatform(platform) === 'gitlab'
        ? encodeURIComponent(repoId)
        : repoId;
}

//FROM COPILOT
export function normalizePlatform(platform) {
    return (platform || 'github').toLowerCase();
}

export function toApiRepoId(platform, repoId) {
    return normalizePlatform(platform) === 'gitlab'
        ? encodeURIComponent(repoId)
        : repoId;
}

export function getPlatformHeaders(platform, url, env = process.env) {
    const p = normalizePlatform(platform);
    const tokenByPlatform = {
        github: env.GITHUB_TOKEN || env.GH_TOKEN,
        gitlab: env.GITLAB_TOKEN,
        codeberg: env.CODEBERG_TOKEN,
    };
    const authScheme = p === 'codeberg' ? 'token' : 'Bearer';
    const hostByPlatform = {
        github: 'api.github.com',
        gitlab: 'gitlab.com/api/v4',
        codeberg: 'codeberg.org/api/v1',
    };

    const headers = { 'User-Agent': 'catalog-build-script' };
    const token = tokenByPlatform[p];
    const hostMatch = hostByPlatform[p] && url.includes(hostByPlatform[p]);

    if (p === 'github' && hostMatch) {
        headers.Accept = 'application/vnd.github+json';
    }
    if (token && hostMatch) {
        headers.Authorization = `${authScheme} ${token}`;
    }
    return headers;
}
