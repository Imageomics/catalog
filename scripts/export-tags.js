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
const CONFIG = jsYaml.load(fs.readFileSync(configPath, 'utf8'));

const { ORGANIZATION_NAME, API_BASE_URL, ADDITIONAL_REPOS } = CONFIG;

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
