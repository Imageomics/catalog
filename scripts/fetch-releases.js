// scripts/fetch-releases.js
// Build-time script: fetches the latest GitHub release for each code repo
// and writes public/releases.json. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jsYaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load CONFIG from public/config.yaml
const configPath = join(__dirname, '../public/config.yaml');
const CONFIG = jsYaml.load(readFileSync(configPath, 'utf8'));

if (!CONFIG || typeof CONFIG !== 'object' || Array.isArray(CONFIG)) {
    throw new Error(`Invalid config at ${configPath}: expected a YAML mapping/object.`);
}
const missingKeys = ['ORGANIZATION_NAME', 'ADDITIONAL_REPOS'].filter(k => !(k in CONFIG));
if (missingKeys.length > 0) {
    throw new Error(`Invalid config at ${configPath}: missing required key(s): ${missingKeys.join(', ')}`);
}
if (!Array.isArray(CONFIG.ADDITIONAL_REPOS)) {
    throw new Error(`Invalid config at ${configPath}: ADDITIONAL_REPOS must be an array.`);
}

const TOKEN = process.env.GITHUB_TOKEN;
const headers = TOKEN
    ? { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'catalog-build-script' }
    : { 'User-Agent': 'catalog-build-script' };

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Step 1: Fetch all public org repos (paginated, same logic as main.js)
let allOrgRepos = [];
let nextUrl = `https://api.github.com/orgs/${CONFIG.ORGANIZATION_NAME}/repos?type=public&per_page=100`;
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
