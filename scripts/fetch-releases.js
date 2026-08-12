// scripts/fetch-releases.js
// Build-time script: fetches the latest release for each code repo
// and writes public/releases.json. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { load } from 'js-yaml';
import { validateConfig } from '../src/validateConfig.js';
import { getPlatformVals, getPlatformApiUrls } from '../src/utils/definePlatformVals.js';
import { getPlatformReleaseVals, getPlatformHeaders } from './platformScriptHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load CONFIG from public/config.yaml
const configPath = join(__dirname, '../public/config.yaml');
const CONFIG = load(readFileSync(configPath, 'utf8'));

const errors = validateConfig(CONFIG);
if (errors.length) {
    throw new Error(`Invalid config at ${configPath}: ${errors.join('; ')}`);
}

/**
 * Define platform-specific variables needed for script to fetch releases, including API URLs, headers, and repo data keys.
 * Update the corresponding workflow and token as needed for non-GitHub code platforms (e.g., Codeberg or GitLab).
*/
const platform = (CONFIG.PLATFORM || 'github').toLowerCase();

const { org: ORG_API_URL, repo: REPO_API_URL, releaseSuffix: RELEASE_SUFFIX } = getPlatformApiUrls(platform, CONFIG.ORGANIZATION_NAME);
const { releasePublishedAtKey, getReleaseUrl } = getPlatformReleaseVals(platform);
const { profileRepo, fullNameKey, forkKey, encodeRepoId } = getPlatformVals(platform);
const headers = getPlatformHeaders(ORG_API_URL, platform);

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Step 1: Fetch all public org repos (paginated, same logic as main.js)
let allOrgRepos = [];
let nextUrl = `${ORG_API_URL}`;
while (nextUrl) {
    const res = await fetch(nextUrl, { headers });
    if (!res.ok) {
        console.warn(`Failed to fetch org repos: HTTP ${res.status}`);
        break;
    }
    const page = await res.json();
    allOrgRepos = allOrgRepos.concat(page);
    const linkHeader = res.headers.get('Link');
    const match = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    nextUrl = match ? match[1] : null;
}

// Step 2: Collect all code repo IDs (mirrors main.js deduplication logic)
const additionalRepoIds = CONFIG.ADDITIONAL_REPOS || [];
const additionalRepoSet = new Set(additionalRepoIds);
const orgNonForks = allOrgRepos.filter(r => r.name !== profileRepo && !r[forkKey] && !additionalRepoSet.has(r[fullNameKey]));
const repoIds = [
    ...additionalRepoIds,
    ...orgNonForks.map(r => r[fullNameKey]),
];

// Step 3: Fetch latest releases in parallel with key-value mapping for each repo ID
const releaseEntries = await Promise.all(
    repoIds.map(async (id) => {
        try {
            const encodedId = encodeRepoId(id);
            const res = await fetch(`${REPO_API_URL}${encodedId}/${RELEASE_SUFFIX}`, { headers });
            if (!res.ok) return [id, null];

            const data = await res.json();
            const publishedAt = data[releasePublishedAtKey];
            // gitlab's release API returns a different structure than GitHub/Codeberg
            return [id, {
                tag: data.tag_name,
                url: getReleaseUrl(data, encodedId),
                publishedAt: publishedAt,
                isNew: (Date.now() - new Date(publishedAt)) < TWO_WEEKS_MS,
            }];
        } catch {
            return [id, null];
        }
    })
);

// Convert [id, releaseData] pairs into an object for JSON output
const releases = Object.fromEntries(releaseEntries);

writeFileSync(join(__dirname, '../public/releases.json'), JSON.stringify(releases));
console.log(`Wrote releases.json (${Object.keys(releases).length} repos)`);
