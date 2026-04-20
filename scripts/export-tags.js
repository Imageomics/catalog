#!/usr/bin/env node
//
// export-tags.js — One-time dev script to collect all raw tags from the GitHub
// and Hugging Face APIs and write them to tag-export.txt.
//
// Usage:
//   node scripts/export-tags.js
//
// Output: scripts/tag-export.txt (one tag per line, sorted, deduplicated)
//
// Reads ORGANIZATION_NAME, API_BASE_URL, and ADDITIONAL_REPOS from
// public/config.yaml
//

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jsYaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Parse config.yaml to extract the CONFIG object values we need
// ---------------------------------------------------------------------------
const configPath = path.resolve(__dirname, '../public/config.yaml');
const rawConfig = jsYaml.load(fs.readFileSync(configPath, 'utf8'));

if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    throw new Error(`Invalid config at ${configPath}: expected a YAML mapping/object.`);
}

const requiredKeys = ['ORGANIZATION_NAME', 'API_BASE_URL', 'ADDITIONAL_REPOS'];
const missingKeys = requiredKeys.filter((key) => !(key in rawConfig));
if (missingKeys.length > 0) {
    throw new Error(
        `Invalid config at ${configPath}: missing required key(s): ${missingKeys.join(', ')}`
    );
}

if (!Array.isArray(rawConfig.ADDITIONAL_REPOS)) {
    throw new Error(
        `Invalid config at ${configPath}: ADDITIONAL_REPOS must be an array.`
    );
}

const CONFIG = rawConfig;
const { ORGANIZATION_NAME, API_BASE_URL, ADDITIONAL_REPOS } = CONFIG;
if (!Array.isArray(CONFIG.ADDITIONAL_HF_REPOS)) {
    throw new Error(
        `Invalid config at ${configPath}: ADDITIONAL_HF_REPOS must be an array.`
    );
}
const validHFTypes = new Set(['datasets', 'models', 'spaces']);
const badHFEntries = CONFIG.ADDITIONAL_HF_REPOS.filter(
    e => !e || typeof e.repo !== 'string' || !e.repo.trim() || !validHFTypes.has(e.type)
);
if (badHFEntries.length) {
    throw new Error(
        `Invalid config at ${configPath}: ADDITIONAL_HF_REPOS entries must each have a non-empty "repo" string and "type" in {datasets, models, spaces}; bad entries: ${badHFEntries.map(e => JSON.stringify(e)).join(', ')}`
    );
}
const ADDITIONAL_HF_REPOS = CONFIG.ADDITIONAL_HF_REPOS;

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const get = async (url) => {
    const headers = {};
    if (GITHUB_TOKEN && url.includes('api.github.com')) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
        headers['Accept'] = 'application/vnd.github+json';
    }
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    return { json: await res.json(), headers: res.headers };
};

// ---------------------------------------------------------------------------
// Tag collection
// ---------------------------------------------------------------------------
const allTags = new Set();

const collectGitHubTags = async () => {
    console.log('Fetching GitHub repos...');
    let allRepos = [];
    let nextUrl = `https://api.github.com/orgs/${ORGANIZATION_NAME}/repos?type=public&per_page=100`;

    while (nextUrl) {
        const { json: page, headers } = await get(nextUrl);
        allRepos = allRepos.concat(page);
        const linkHeader = headers.get('Link');
        const match = linkHeader && linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = match ? match[1] : null;
    }

    // Additional repos
    const additionalData = await Promise.all(
        ADDITIONAL_REPOS.map(ownerRepo =>
            get(`https://api.github.com/repos/${ownerRepo}`)
                .then(({ json }) => json)
                .catch(() => null)
        )
    );
    const additionalRepos = additionalData.filter(Boolean);

    const additionalNames = new Set(additionalRepos.map(r => r.full_name));
    const orgNonForks = allRepos.filter(r => r.name !== '.github' && !r.fork && !additionalNames.has(r.full_name));

    [...additionalRepos, ...orgNonForks].forEach(repo => {
        (repo.topics || []).forEach(t => allTags.add(t.toLowerCase()));
    });

    console.log(`  GitHub: processed ${orgNonForks.length} org repos + ${additionalRepos.length} additional repos`);
};

const collectHFTags = async (repoType) => {
    console.log(`Fetching HF ${repoType}...`);
    let items = (await get(`${API_BASE_URL}${repoType}?author=${ORGANIZATION_NAME}&full=true`)).json;

    // Fetch additional HF repos of this type
    const additionalForType = ADDITIONAL_HF_REPOS.filter(entry => entry.type === repoType);
    if (additionalForType.length) {
        const existingIds = new Set(items.map(item => item.id));
        const seenRepos = new Set();
        const toFetch = additionalForType.filter(entry => {
            if (existingIds.has(entry.repo) || seenRepos.has(entry.repo)) return false;
            seenRepos.add(entry.repo);
            return true;
        });
        const fetched = await Promise.all(
            toFetch.map(entry =>
                get(`${API_BASE_URL}${repoType}/${entry.repo}`)
                    .then(({ json }) => json)
                    .catch(() => null)
            )
        );
        items = [...items, ...fetched.filter(item => item && !existingIds.has(item.id))];
    }

    if (repoType === 'models') {
        const details = await Promise.all(
            items.map(item =>
                fetch(`${API_BASE_URL}models/${item.id}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            )
        );
        items = details.filter(Boolean);
    }

    items.forEach(item => {
        const tags = item.cardData?.tags || item.tags || [];
        tags.forEach(t => allTags.add(String(t).toLowerCase()));
    });

    console.log(`  HF ${repoType}: ${items.length} items`);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
    try {
        await collectGitHubTags();
        await collectHFTags('datasets');
        await collectHFTags('models');
        await collectHFTags('spaces');

        const sorted = Array.from(allTags).sort();
        const outPath = path.resolve(__dirname, 'tag-export.txt');
        fs.writeFileSync(outPath, sorted.join('\n') + '\n', 'utf8');

        console.log(`\nDone. ${sorted.length} unique tags written to scripts/tag-export.txt`);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
