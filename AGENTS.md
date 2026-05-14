# Agents Guide

This file provides guidance for AI coding agents (e.g., GitHub Copilot) working on this repository.

## Project Overview

This is a **template repository** for a web-based catalog of an organization's public code, datasets, models, and spaces. It fetches live data from the GitHub API and the Hugging Face API and renders a searchable, filterable catalog page as a static site via GitHub Pages. The default setup is for the Imageomics Organization's GitHub and Hugging Face products, and this Imageomics Catalog is live.

## Critical: Templated Design

**Do not restructure the codebase.** This project is intentionally designed as a template where the only expected user customization is editing `public/config.yaml` at instantiation — and occasionally updating `ADDITIONAL_REPOS` or `ADDITIONAL_HF_REPOS` when non-org repos must be added. The rest of the code is intended to be stable and reusable across forks.

When resolving issues or implementing features:
- Make the **smallest change** that correctly fixes the problem.
- **Do not restructure, consolidate, or refactor** functions or files unless it is strictly necessary for a correct, efficient solution.
- A function doing multiple related things is intentional — do not split it up unless there is a clear, specific reason to do so.
- When in doubt, ask for a plan before making changes.

This matches the debugging philosophy documented in [`README.md`](README.md#note-on-debugging-with-gemini): *"without changing the structure of existing code more than necessary for efficient design."*

## Repository Layout

| Path | Purpose |
|---|---|
| `public/config.yaml` | **Primary customization point.** All org names, colors, API settings, and extra repos live here. |
| `public/tag-groups.js` | Canonical tag aliases; maps raw tags to normalized display tags. |
| `index.html` | Static HTML shell; config values are applied dynamically. |
| `style.css` | Custom styles; colors are set via CSS custom properties populated from `config.yaml`. |
| `main.js` | All application logic: config loading, API calls, filtering, sorting, and rendering. |
| `src/` | Pure utility modules imported by `main.js` and the build scripts. |
| `scripts/` | Build-time Node scripts (`fetch-releases.js`, `export-tags.js`). |
| `tests/` | Vitest unit and integration tests. |
| `docs/` | Developer-facing documentation. |
| `.github/workflows/` | CI/CD: tests on PR, deploy on push to `main`, weekly tag scan. |

## Hugging Face API — Key Differences

These are the most commonly misunderstood aspects of the Hugging Face API integration:

### URL Structure

| Resource type | List (org) URL | Detail (single repo) URL |
|---|---|---|
| Datasets | `{API_BASE_URL}datasets?author={org}&full=true` | `{API_BASE_URL}datasets/{owner}/{repo}` |
| Models | `{API_BASE_URL}models?author={org}&full=true` | `{API_BASE_URL}models/{owner}/{repo}` |
| Spaces | `{API_BASE_URL}spaces?author={org}&full=true` | `{API_BASE_URL}spaces/{owner}/{repo}` |

`API_BASE_URL` defaults to `https://huggingface.co/api/` (set in `config.yaml`).

The **browser-facing** (non-API) URLs used for item card links are:

| Resource type | Link URL |
|---|---|
| Datasets | `https://huggingface.co/datasets/{owner}/{repo}` |
| Models | `https://huggingface.co/{owner}/{repo}` *(no `/models/` prefix)* |
| Spaces | `https://huggingface.co/spaces/{owner}/{repo}` |

### Models Require a Secondary Per-Model Fetch

The bulk `models?author={org}&full=true` list response does **not** return `cardData` for models. `cardData` (which contains `model_name`, `description`, tags, etc.) is only available when each model is fetched individually.

`main.js` handles this with an extra parallel fetch after the list call (search `Step 2: If we are fetching models`). **Any change to model fetching must preserve this secondary per-model call.**

### `cardData` Key Differences Across Resource Types

| Resource type | Display name key | Description key |
|---|---|---|
| Datasets | `cardData.pretty_name` | `cardData.description` |
| Models | `cardData.model_name` | `cardData.model_description` |
| Spaces | `cardData.title` | `cardData.description` |

Code that accesses card metadata must account for all three shapes. The rendering function `renderHubItemCard` in `main.js` already does this with fallback chains.

## Testing

Tests use **Vitest** and live under `tests/`. Run them with:

```console
npm test          # single run
npm run test:watch  # watch mode
```

**Tests only need to run when code changes.** The site itself fetches live API data at runtime — there is nothing to test about the running site. Functional tests validate the utility logic in `src/` (tag normalization, config validation, filtering/sorting) and the integration between `config.yaml` and the validator.

Current test files:
- `tests/validateConfig.test.js` — unit tests for `src/validateConfig.js`
- `tests/config.integration.test.js` — confirms `public/config.yaml` passes validation
- `tests/filterAndSort.test.js` — unit tests for `src/filterAndSort.js`
- `tests/filterNewAdditionalEntries.test.js` — unit tests for `src/filterNewAdditionalEntries.js`
- `tests/normalizeTag.test.js` — unit tests for `src/normalizeTag.js`

When adding a new utility to `src/`, add a corresponding test file. Do **not** add tests that make live network calls.

## Configuration

All runtime behavior is controlled by `public/config.yaml`. It is fetched at page load (not bundled), so changes take effect on the next page load without a rebuild. Key fields:

- `ORGANIZATION_NAME` — used in all API calls (must be lowercase)
- `API_BASE_URL` — Hugging Face API base (default: `https://huggingface.co/api/`)
- `PLATFORM` — code platform; only `github` is currently supported
- `ADDITIONAL_REPOS` — forked or external GitHub repos to include
- `ADDITIONAL_HF_REPOS` — Hugging Face repos from outside the org to include (each entry needs `repo` and `type`)

The validator in `src/validateConfig.js` is the authoritative list of required config fields and their shapes.

## Build & Dev

```console
npm install       # install dependencies (Node 24 required)
npm run dev       # start Vite dev server (typically http://localhost:5173/)
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## CI Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `test.yml` | PR to `main` | Runs `npm test` |
| `deploy.yml` | Push to `main`, daily schedule, manual | Builds and deploys to GitHub Pages |
| `weekly-tag-scan.yml` | Weekly schedule | Detects new tags and opens a PR to update `tag-groups.js` |
| `validate-zenodo.yaml` | PR/push | Validates `.zenodo.json` |

Tests run automatically on PRs. **Do not skip or remove the test workflow.**
