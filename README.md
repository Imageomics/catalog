# Imageomics Catalog [![DOI](https://zenodo.org/badge/1054290236.svg)](https://doi.org/10.5281/zenodo.17602801)

Repository for web-based Imageomics code, data, model, and spaces catalog. This catalog is designed to use the GitHub API for searching all code repositories created under the [Imageomics GitHub Organization](https://github.com/Imageomics) and the Hugging Face API for searching all dataset, model, and spaces repositories created under the [Imageomics Hugging Face Organization](https://huggingface.co/imageomics).

This repository has been set up to provide a template for others looking to create a similar catalog website. Instructions for use and personalization are provided below, under [How to Use this Template](#how-to-use-this-template).

This project was initialized with the help of Gemini 2.5, accessed [through OSU](https://ai.osu.edu/faculty-staff-students/approved-ai-tools). In addition to speeding up the development of this site, I was curious about how much Gemini could do and where it would falter; see the [full prompt/discussion](catalog-generation-prompt-Gemini2.5Flash.md) for more information.

## Features

The website is styled using the [tailwindcss](https://tailwindcss.com/) package.

* **Real-time Data Fetching:** Displays all public Imageomics repositories, fetched through the GitHub and Hugging Face APIs. Includes a "New" badge for products created within the last 30 days; for older repos, star (⭐️) or like (❤️) counts are included for GitHub or Hugging Face repos, respectively.
* **Search Functionality:** Quickly find items by keyword.
* **Filtering:** Filter by repository type (Code, Datasets, Models, Spaces) and tags.
* **Sorting:** Sort items by last updated, date created, stars/likes ascending or descending, or alphabetically.
* **URL Parameter Support:** Persist and share search states via URL hash (`#type=datasets&q=fish`) or query parameters (`?type=datasets`). Supports `type`, `q` (search query), `sort`, and `tag` parameters.
* **Responsive Design:** The layout is optimized for use on computers and mobile devices.
* **Thematic Styling:** Uses Imageomics color scheme for a cohesive look and feel.
* **Longevity:** This site is run through GitHub Pages, ensuring continued access through GitHub without needing to otherwise provision dedicated infrastructure.

## Project Structure

The site runs based on four primary files:

* `public/config.js`: Contains all customizable settings including organization names, colors, branding, and API settings. This is the main file to edit for personalization. Placed in `public/` so Vite copies it to `dist/` without bundling, keeping it editable after deployment.
* `index.html`: The main HTML file that provides the structure of the webpage and links to the CSS and JavaScript files. Config values are applied dynamically from `config.js`.
* `style.css`: Custom styling for the application, including color schemes, layout, and animations. Colors are set via CSS custom properties that are populated from `config.js`.
* `main.js`: Handles the application's logic, including API calls, data filtering, sorting, and dynamic rendering of the catalog items.
  * **Note:** Model API calls do ***not*** return `cardData` unless explicitly fetched *by model*, so there is extra logic required to fetch Model metadata. This was not accounted for until [commit a8d3000](https://github.com/Imageomics/catalog/commit/a8d30009f58a11e708f36d54b9bf4a228bdf1538), as it took updates related to [issue #3](https://github.com/Imageomics/catalog/issues/3) to discover.

Two additional files support the build tooling:

* `package.json`: Declares npm dependencies (`vite`, `tailwindcss`, `@tailwindcss/vite`) and defines the `dev`, `build`, and `preview` scripts.
* `vite.config.js`: Vite configuration that registers the Tailwind CSS plugin.

### Formatting Standard

  * **What is needed:** VS Code "Format on Save" enabled with CSS & HTML format enabled.
  * **Indent Size:** 4
  * **Wrap Line Length:** 120
  * **Rules:** Remove trailing whitespace and empty tabs.

## How to Use This Template

This Catalog is set up as a template repository. To build a personalized version of the Catalog, select "Use this Template" at the top of the repo to generate your own version. This will create a new repository (generated from the template repo) that does not share the commit history of the template. Updates can still be added from the template upstream through `git cherry-pick`.[^1] 
[^1]: We recommend following the [Git Cherry-pick Guide](https://imageomics.github.io/Collaborative-distributed-science-guide/wiki-guide/Git-Cherry-Pick-Guide/) from the [Collaborative Distributed Science Guide](https://imageomics.github.io/Collaborative-distributed-science-guide/) for those unfamiliar with this process.

### Personalizing Your Catalog

Welcome to your new catalog repo! The primary way to personalize this catalog is through the `config.js` file, which contains all customizable settings. After using the template, you'll need to update the following:

#### Primary Configuration File

**`public/config.js`**: This is the main file to edit. It contains all configuration options with inline comments explaining each setting:

* **Organization & Repository Settings:**
  * `ORGANIZATION_NAME`: Your GitHub/Hugging Face organization name (lowercase for API calls)
  * `GITHUB_ORG_NAME`: Display name for your organization (can differ from API name)
  * `CATALOG_REPO_NAME`: Repository name for the catalog itself (used for stats badge)

* **Branding:**
  * `CATALOG_TITLE`: Page title and main heading
  * `CATALOG_DESCRIPTION`: Subtitle/description text displayed under the title
  * `LOGO_URL`: URL to your organization's logo image (used in `main.js` line 565)
  * `FAVICON_URL`: URL to your favicon image (used in `index.html` line 80)
  
  For both `LOGO_URL` and `FAVICON_URL`, you can use an external URL, a relative path if the image is in your repo (e.g., `./images/logo.png` or `images/logo.png`), or GitHub's raw URL format (e.g., `https://github.com/username/repo/raw/branch/path/to/image.png`)

* **Colors:**
  * `COLORS.primary`: Primary brand color (used for heading)
  * `COLORS.secondary`: Secondary brand color (used for borders, GitHub ribbon)
  * `COLORS.accent`: Accent color (used for links, focus states, "New" badge)
  * `COLORS.accentDark`: Dark mode accent color (used for link hover states in dark mode)
  * `COLORS.tag`: Tag background color

* **API & Behavior Settings:**
  * `API_BASE_URL`: Hugging Face API base URL (default: `"https://huggingface.co/api/"`)
  * `REFRESH_INTERVAL_DAYS`: Number of days to consider an item "new" (default: `30`)
  * `MAX_ITEMS`: Maximum number of items to fetch per category (default: `100`)
  * `ADDITIONAL_REPOS`: Array of forked or non-org GitHub repositories to include, formatted `<owner>/<repo-name>` (non-forks are included by default). Use `[]` if there are none you wish to include

* **Typography:**
  * `FONT_FAMILY`: Font family for the site (default: `"Inter"`)

After modifying `config.js`, refresh your browser to see changes. The color scheme will automatically apply to all UI elements throughout the site.

### Setting Up Tag Groups

Tags from GitHub topics and Hugging Face card metadata are free-form text, so the same concept often appears under multiple spellings (`computer-vision`, `computer vision`, `cv`). Tag groups normalize these into a single canonical tag shown in the filter dropdown, and are configured in `public/tag-groups.js`.

When first setting up your catalog, run the export script to generate a full list of your organization's current raw tags (saved to `scripts/tag-export.txt`), then use that list to build your initial `tag-groups.js`. A weekly GitHub Actions workflow will automatically open a pull request whenever 5 or more new tags (relative to the last committed baseline in `scripts/tag-export.txt`) are detected, keeping your tag groups up to date over time.

See **[docs/tag-grouping-process.md](docs/tag-grouping-process.md)** for full setup instructions, conventions, and guidance on using AI assistance for the initial grouping pass.

## Local Testing

This project uses [Vite](https://vite.dev/) as a build tool and requires **Node.js 24** (Active LTS). You can check your current version with `node --version`. To install or update Node, visit [nodejs.org](https://nodejs.org/en/download) or use a version manager like [nvm](https://github.com/nvm-sh/nvm):

```console
nvm install 24
nvm use
```

A `.nvmrc` file is included, so `nvm use` will automatically select the correct version in the project directory.

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
