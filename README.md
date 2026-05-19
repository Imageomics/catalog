# Imageomics Catalog [![DOI](https://zenodo.org/badge/1054290236.svg)](https://doi.org/10.5281/zenodo.17602801)

Repository for web-based Imageomics code, data, model, and spaces catalog. This catalog is designed to use the GitHub API for searching all code repositories created under the [Imageomics GitHub Organization](https://github.com/Imageomics) and the Hugging Face API for searching all dataset, model, and spaces repositories created under the [Imageomics Hugging Face Organization](https://huggingface.co/imageomics).

This repository has been set up to provide a template for others looking to create a similar catalog website. Instructions for use and personalization are provided below, under [How to Use this Template](#how-to-use-this-template). More background on this site's creation is provided in the [docs](docs/).

## Features

The website is styled using the [tailwindcss](https://tailwindcss.com/) package.

* **Real-time Data Fetching:** Displays all public Imageomics repositories, fetched through the GitHub and Hugging Face APIs. Includes semantically meaningful virtual markers:
    * "New" badge highlights products created within the last 30 days;
    * "🚀 version-tag" badge indicates a new release within the last 2 weeks for GitHub repos, and links to that release;
    * Star (⭐️) or like (❤️) counts displayed for GitHub or Hugging Face repos, respectively;
    * Archived badge flags GitHub repos no longer under active development (read-only).
* **Search Functionality:** Quickly find items by keyword.
* **Filtering:** Filter by repository type (Code, Datasets, Models, Spaces) and tags. Optionally include archived GitHub repos.
* **Sorting:** Sort items by last updated, date created, stars/likes ascending or descending, or alphabetically.
* **URL Parameter Support:** Persist and share search states via URL hash (`#type=datasets&q=fish`) or query parameters (`?type=datasets`). Supports `type`, `q` (search query), `sort`, and `tag` parameters.
* **Responsive Design:** The layout is optimized for use on computers and mobile devices.
* **Thematic Styling:** Uses Imageomics color scheme for a cohesive look and feel.
* **Longevity:** This site is run through GitHub Pages, ensuring continued access through GitHub without needing to otherwise provision dedicated infrastructure.

## Project Structure

The site runs based on four primary files:

* `public/config.yaml`: Contains all customizable settings including organization names, colors, branding, and API settings. This is the main file to edit for personalization. Placed in `public/` so Vite copies it to `dist/` without bundling, keeping it editable after deployment.
* `index.html`: The main HTML file that provides the structure of the webpage and links to the CSS and JavaScript files. Config values are applied dynamically from `config.yaml`.
* `style.css`: Custom styling for the application, including color schemes, layout, and animations. Colors are set via CSS custom properties that are populated from `config.yaml`.
* `main.js`: Handles the application's logic, including config loading, API calls, data filtering, sorting, and dynamic rendering of the catalog items. Relies on the build-time Node script `fetch-releases.js` for version-tag badge feature.

Two additional files support the build tooling:

* `package.json`: Declares npm dependencies (`vite`, `tailwindcss`, `@tailwindcss/vite`) and defines the `dev`, `build`, and `preview` scripts.
* `vite.config.js`: Vite configuration that registers the Tailwind CSS plugin.

## How to Use This Template

This Catalog is set up as a template repository. To build a personalized version of the Catalog, select "Use this Template" at the top of the repo to generate your own version. This will create a new repository (generated from the template repo) that does not share the commit history of the template. Updates can still be added from the template upstream through `git cherry-pick`.[^1] 
[^1]: We recommend following the [Git Cherry-pick Guide](https://imageomics.github.io/Collaborative-distributed-science-guide/wiki-guide/Git-Cherry-Pick-Guide/) from the [Collaborative Distributed Science Guide](https://imageomics.github.io/Collaborative-distributed-science-guide/) for those unfamiliar with this process.

### Personalizing Your Catalog

The primary way to personalize this catalog is through the `config.yaml` file, which contains all customizable settings. After using the template, follow the [personalization guide](docs/personalization.md) to update the [config file](public/config.yaml), [package.json](package.json), and [tag groups](public/tag-groups.js) for your organization.

## Development Prerequisites

This project uses [Vite](https://vite.dev/) as a build tool and requires **Node.js 24** (Active LTS). You can check your current version with `node --version`. To install or update Node, visit [nodejs.org](https://nodejs.org/en/download) or use a version manager like [nvm](https://github.com/nvm-sh/nvm):

```console
nvm install 24
nvm use
```

A `.nvmrc` file is included, so `nvm use` will automatically select the correct version in the project directory.

### Formatting Standard

**What is needed:** VS Code "Format on Save" enabled with CSS & HTML format enabled or [linter(s)](https://github.com/caramelomartins/awesome-linters) for package languages (JavaScript, HTML, and CSS) with the following settings:

  * **Indent Size:** 4
  * **Wrap Line Length:** 120
  * **Rules:** Remove trailing whitespace and empty tabs.

## Testing

Tests are written with [Vitest](https://vitest.dev/) and run automatically in CI on every pull request to `main`. To run them locally: `npm test` (single run) or `npm run test:watch` (watch mode).

`tests/validateConfig.test.js` tests the validator logic in `src/validateConfig.js`, which is also used by the `fetch-releases` and `export-tags` scripts. `tests/config.integration.test.js` confirms that the real `public/config.yaml` passes that same validation.

### Running Locally

Install dependencies and start the dev server from the repo root:

```console
npm install
npm run dev
```

Then open the local URL printed by Vite (typically <http://localhost:5173/>) in your browser of choice.

To build for production (output goes to `dist/`):

```console
npm run build
```

To preview the production build locally:

```console
npm run preview
```

## Note on Debugging with Gemini

It is important to provide the relevant code and preface with something along the lines of:

> Based on this project, without changing the structure of existing code more than necessary for efficient design, can you identify...

Then ask for a plan of how to resolve the issue. In my debugging experience, it did not demonstrate the ability to recognize or distinguish between a fix of "robustness" to handle outliers (which already existed at the precise location to which it pointed) and actually fixing the code to get the information that should have been fetched. Additionally, it has a tendency to rewrite an entire function and forget about tasks that are done in that function that are not *directly* related to the bug it is attempting to fix.
