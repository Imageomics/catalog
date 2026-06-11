# Agents Guide

This file provides guidance for AI coding agents (e.g., GitHub Copilot) working on this repository.

## Project Overview

This is a **template repository** for a web-based catalog of an organization's public code, datasets, models, and spaces. It fetches live data from the code repository platform (such as GitHub) API and the platform API for hosting datasets and models (Hugging Face) and renders a searchable, filterable catalog page as a static site via GitHub Pages. The default setup is for the Imageomics Organization's GitHub and Hugging Face products.

## Critical: Templated Design

**Do not restructure the codebase.** This project is intentionally designed as a template where the only expected user customization is editing `public/config.yaml` and `public/tag-groups.js` at instantiation — and occasionally updating `ADDITIONAL_REPOS` or `ADDITIONAL_HF_REPOS` when non-org repos must be added. 

The `public/config.yaml` file is intended to be stable and reusable across repositories utilizing this template; new functionality should not require changes to existing configuration settings. The `public/tag-groups.js` file is likely to be unique to each template user and should have tag groups added as needed (proper use is described in `docs/tag-grouping-process.md`); **do not delete tag groups**.

Source files (`src/`) and scripts (`scripts/`) can be updated as needed for new functionality as long as changes adhere to the templated design principles established here.

When resolving issues or implementing features:
- Make the **smallest change** that correctly fixes the problem.
- **Do not restructure, consolidate, or refactor** functions or files unless it is strictly necessary for a correct, efficient solution.
- A function doing multiple related things is intentional — do not split it up unless there is a clear, specific reason to do so.
- When in doubt, ask for a plan before making changes.
- If asked to make a fix in a pull request review, provide the fix as one or more suggested changes instead of directly committing changes.

This matches the debugging philosophy documented in [`README.md`](README.md#note-on-debugging-with-gemini): *"without changing the structure of existing code more than necessary for efficient design."*

## Repository Layout

Path | Purpose
---|---
`public/config.yaml` | **Primary customization point.** All org names, colors, API settings, and extra repos live here.
`public/tag-groups.js` | **Secondary customization point.** Canonical tag aliases; maps raw tags to normalized display tags.
`index.html` | Static HTML shell; config values are applied dynamically.
`style.css` | Custom styles; colors are set via CSS custom properties populated from `config.yaml`.
`main.js` | All application logic: config loading, API calls, filtering, sorting, and rendering.
`src/` | Pure utility modules imported by `main.js` and the build scripts.
`scripts/` | Build-time Node scripts (`fetch-releases.js`, `export-tags.js`).
`tests/` | Vitest unit and integration tests.
`docs/` | Developer-facing documentation.
`.github/workflows/` | CI/CD: tests on PR, deploy on push to `main`, weekly tag scan.

## Hugging Face API — Key Differences

These are the most commonly misunderstood aspects of the Hugging Face API integration:

### URL Structure

Resource type | List (org) URL | Detail (single repo) URL
---|---|---
Datasets | `{API_BASE_URL}datasets?author={org}&full=true` | `{API_BASE_URL}datasets/{owner}/{repo}`
Models | `{API_BASE_URL}models?author={org}&full=true` | `{API_BASE_URL}models/{owner}/{repo}`
Spaces | `{API_BASE_URL}spaces?author={org}&full=true` | `{API_BASE_URL}spaces/{owner}/{repo}`

`API_BASE_URL` defaults to `https://huggingface.co/api/` (set in `config.yaml`).

The **browser-facing** (non-API) URLs used for item card links are:

Resource type | Link URL
---|---
Datasets | `https://huggingface.co/datasets/{owner}/{repo}`
Models | `https://huggingface.co/{owner}/{repo}` *(no `/models/` prefix)*
Spaces | `https://huggingface.co/spaces/{owner}/{repo}`

### Models Require a Secondary Per-Model Fetch

The bulk `models?author={org}&full=true` list response does **not** return `cardData` for models. `cardData` (which contains `model_name`, `description`, tags, etc.) is only available when each model is fetched individually.

`main.js` handles this with an extra parallel fetch after the list call (search `Step 2: If we are fetching models`). **Any change to model fetching must preserve this secondary per-model call.**

### `cardData` Key Differences Across Resource Types

Resource type | Display name key | Description key
---|---|---
Datasets | `cardData.pretty_name` | `cardData.description`
Models | `cardData.model_name` | `cardData.model_description`
Spaces | `cardData.title` | `cardData.description`

Code that accesses card metadata must account for all three shapes. The rendering function `renderHubItemCard` in `main.js` already does this with fallback chains.

## Testing

Tests use **Vitest** and live under `tests/`. Run them with:

```console
npm test            # single run
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

- `ORGANIZATION_NAME` — used in all code repository platform API calls (must be lowercase)
- `HF_ORGANIZATION_NAME` - used in all Hugging Face API calls (must be lowercase)
- `API_BASE_URL` — Hugging Face API base (default: `https://huggingface.co/api/`)
- `PLATFORM` — code repository platform; only `github` is currently supported
- `ADDITIONAL_REPOS` — forked or external GitHub repos to include
- `ADDITIONAL_HF_REPOS` — Hugging Face repos from outside the org to include (each entry needs `repo` and `type`)

The validator in `src/validateConfig.js` is the authoritative list of required config fields and their shapes.

## Build & Dev

```console
npm install       # install dependencies (Node version in .nvmrc)
npm run dev       # start Vite dev server (typically http://localhost:5173/)
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Contributing Workflow

Changes should be made on a branch off of `dev`. All new features and development are submitted to the `dev` branch for PR review and staging before merging to `main`. Do not open pull requests to `main`; the existing GitHub Action Tag Scan workflow directed to `main` is allowed behavior, distinct from these instructions.

## CI Workflows

Workflow | Trigger | Purpose
---|---|---
`test.yml` | PR to `main` and `dev` | Runs `npm test`
`deploy.yml` | Push to `main`, daily schedule, manual | Builds and deploys to GitHub Pages
`weekly-tag-scan.yml` | Weekly schedule, manual, PR close cleanup | Detects new tags and opens a PR to update `tag-groups.js`
`validate-zenodo.yaml` | Push (paths filter) | Validates `.zenodo.json`

Tests run automatically on PRs. **Do not skip or remove the test workflow.**
