# Imageomics Catalog [![DOI](https://zenodo.org/badge/1054290236.svg)](https://doi.org/10.5281/zenodo.17602801)

Repository for web-based Imageomics code, data, model, and spaces catalog. This catalog is designed to use the GitHub API for searching all code repositories created under the [Imageomics GitHub Organization](https://github.com/Imageomics) and the Hugging Face API for searching all dataset, model, and spaces repositories created under the [Imageomics Hugging Face Organization](https://huggingface.co/imageomics).

This project was initialized with the help of Gemini 2.5, accessed [through OSU](https://ai.osu.edu/faculty-staff-students/approved-ai-tools). In addition to speeding up the development of this site, I was curious about how much Gemini could do and where it would falter; see the [full prompt/discussion](catalog-generation-prompt-Gemini2.5Flash.md) for more information.

## Features

The website is styled using the [tailwindcss](https://tailwindcss.com/) pacakge.

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

* `config.js`: **Configuration file** - Contains all customizable settings including organization names, colors, branding, and API settings. This is the main file to edit for personalization.
* `index.html`: The main HTML file that provides the structure of the webpage and links to the CSS and JavaScript files. Config values are applied dynamically from `config.js`.
* `style.css`: Custom styling for the application, including color schemes, layout, and animations. Colors are set via CSS custom properties that are populated from `config.js`.
* `main.js`: Handles the application's logic, including API calls, data filtering, sorting, and dynamic rendering of the catalog items.
  * **Note:** Model API calls do ***not*** return `cardData` unless explicitly fetched *by model*, so there is extra logic required to fetch Model metadata. This was not accounted for until [commit a8d3000](https://github.com/Imageomics/catalog/commit/a8d30009f58a11e708f36d54b9bf4a228bdf1538), as it took updates related to issue #3 to discover.

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

**`config.js`**: This is the main file to edit. It contains all configuration options with inline comments explaining each setting:

* **Organization & Repository Settings:**
  * `ORGANISATION_NAME`: Your GitHub/Hugging Face organization name (lowercase for API calls)
  * `GITHUB_ORG_NAME`: Display name for your organization (can differ from API name)
  * `CATALOG_REPO_NAME`: Repository name for the catalog itself (used for stats badge)

* **Branding:**
  * `CATALOG_TITLE`: Page title and main heading
  * `CATALOG_DESCRIPTION`: Subtitle/description text displayed under the title
  * `LOGO_URL`: URL to your organization's logo image
  * `FAVICON_URL`: URL to your favicon image

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
  * `FORKED_REPOS`: Array of forked repository names to include (non-forks are included by default). Use `[]` if there are none you wish to include

* **Typography:**
  * `FONT_FAMILY`: Font family for the site (default: `"Inter"`)

After modifying `config.js`, refresh your browser to see changes. The color scheme will automatically apply to all UI elements throughout the site.

## Local Testing

In the repo root, run

```console
python -m http.server 8080
```

Then open <http://[::]:8080/> in your browser of choice.

## Note on Debugging with Gemini

It is important to provide the relevant code and preface with something along the lines of:

> Based on this project, without changing the structure of existing code more than necessary for efficient design, can you identify...

Then ask for a plan of how to reolve the issue. In my debugging experience, it did not demonstrate the ability to recognize or distinguish between a fix of "robustness" to handle outliers (which already existed at the precise location to which it pointed) and actually fixing the code to get the information that should have been fetched. Additionally, it has a tendency to rewrite an entire function and forget about tasks that are done in that function that are not *directly* related to the bug it is attempting to fix.
