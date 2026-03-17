// scripts/fetch-releases.js
// Build-time script: fetches the latest GitHub release for each code repo
// and writes public/releases.json. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load CONFIG from public/config.js (defined as a global, not an ES module export)
const configCode = readFileSync(join(__dirname, '../public/config.js'), 'utf8');
const CONFIG = new Function(configCode + '; return CONFIG;')();

const TOKEN = process.env.GITHUB_TOKEN;
const headers = TOKEN
    ? { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'catalog-build-script' }
    : { 'User-Agent': 'catalog-build-script' };

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Step 1: Fetch all public org repos (paginated, same logic as main.js)
let allOrgRepos = [];
let nextUrl = `https://api.github.com/orgs/${CONFIG.GITHUB_ORG_NAME}/repos?type=public&per_page=100`;
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
const orgNonForks = allOrgRepos.filter(r => r.name !== '.github' && !r.fork && !additionalRepoSet.has(r.full_name));
const repoIds = [
    ...additionalRepoIds,
    ...orgNonForks.map(r => r.full_name),
];

// Step 3: Fetch latest release for each repo
const releases = {};
for (const id of repoIds) {
    try {
        const res = await fetch(`https://api.github.com/repos/${id}/releases/latest`, { headers });
        if (!res.ok) { releases[id] = null; continue; }
        const data = await res.json();
        releases[id] = {
            tag: data.tag_name,
            url: data.html_url,
            publishedAt: data.published_at,
            isNew: (Date.now() - new Date(data.published_at)) < TWO_WEEKS_MS,
        };
    } catch {
        releases[id] = null;
    }
}

writeFileSync(join(__dirname, '../public/releases.json'), JSON.stringify(releases));
console.log(`Wrote releases.json (${Object.keys(releases).length} repos)`);
