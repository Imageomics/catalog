# Personalizing Your Catalog

Welcome to your new catalog repo! The primary way to personalize this catalog is through the `config.yaml` file, which contains all customizable settings. After using the template, you'll need to update the following:

## Primary Configuration File

[**`public/config.yaml`**](../public/config.yaml): This is the main file to edit. It contains all configuration options (e.g., organization names, colors, branding, and API settings) with inline comments explaining each setting. Replace Imageomics-specific values with those appropriate for your organzation and catalog repository. A [template config](../public/config-template.yaml) is also provided for reference.

### Organization & Repository Settings

  * `ORGANIZATION_NAME`: Your code platform (e.g., GitHub) organization name (for API calls)
  * `HF_ORGANIZATION_NAME`: Your Hugging Face organization name (**case-sensitive**, for API calls)
  * `ORG_NAME`: Display name for your organization (can differ from API name); used for logo alt-text and as fallback site title if `CATALOG_TITLE` is not set
  * `CATALOG_REPO_NAME`: Repository name for the catalog itself (used for stats badge)

### Branding

  * `CATALOG_TITLE`: Page title and main heading
  * `CATALOG_DESCRIPTION`: Subtitle/description text displayed under the title
  * `LOGO_URL`: URL to your organization's logo image (used in `main.js` line 565)
  * `FAVICON_URL`: URL to your favicon image (used in `index.html` line 80)
  
  For both `LOGO_URL` and `FAVICON_URL`, you can use an external URL, a relative path if the image is in your repo (e.g., `./images/logo.png` or `images/logo.png`), or GitHub's raw URL format (e.g., `https://github.com/username/repo/raw/branch/path/to/image.png`)

#### Colors

  * `COLORS.primary`: Primary brand color (used for heading)
  * `COLORS.secondary`: Secondary brand color (used for borders, GitHub ribbon)
  * `COLORS.accent`: Accent color (used for links, focus states, "New" badge)
  * `COLORS.accentDark`: Dark mode accent color (used for link hover states in dark mode)
  * `COLORS.tag`: Tag background color

### API & Behavior Settings

  * `PLATFORM`: Coding platform used: 'github' or 'codeberg' (default: 'github', GitLab support in development). Please see [notes on platform setup](#non-github-code-platform-setup) if using for non-GitHub code repositories
  * `API_BASE_URL`: Hugging Face API base URL (default: `"https://huggingface.co/api/"`)
  * `REFRESH_INTERVAL_DAYS`: Number of days to consider an item "new" (default: `30`)
  * `ADDITIONAL_REPOS`: Array of forked or non-org GitHub repositories to include, formatted `<owner>/<repo-name>` (non-forks are included by default). Use `[]` if there are none you wish to include
  * `ADDITIONAL_HF_REPOS`: Array of Hugging Face repos from outside the org to include. Each entry specifies `repo` (`<owner>/<repo-name>`) and `type` (`datasets`, `models`, or `spaces`). Use `[]` if there are none you wish to include

### Typography

  * `FONT_FAMILY`: Font family for the site (default: `"Inter"`)

After modifying `config.yaml`, refresh your browser to see changes. The color scheme will automatically apply to all UI elements throughout the site.

## Version and Requirements

[**`package.json`**](../package.json): Update this file with your information and that of your catalog repository (version and URL). This file will auto-update the `package-lock.json` through `npm install`, and should have the version updated for new releases.

In this file, update:

- [ ] name: What is the name of this repository?
- [ ] version*: What software version is *this* catalog (start with 1.0.0)?
- [ ] description: Describe your catalog repo: what is the org it represents?
- [ ] repository URL: URL for the repository hosting your catalog.
- [ ] author: Who is the repo creator?
- [ ] bug URL: Link to the repository issue tracker or other reporting mechanism.
- [ ] homepage URL: Link to repository README.

*<small>Version will need to be updated each time you release a new version of your catalog.</small>

### Versioning

When releasing a new version, be sure to run the following in the repo root, then push the updated `package-lock.json` to your repository.

```console
npm install
```

### Local Preview

To preview the production build locally, in the repo root, run:

```console
npm run preview
```

Then open the local URL printed by Vite (typically <http://localhost:5173/>) in your browser of choice.

## Setting Up Tag Groups

Tags from GitHub topics and Hugging Face card metadata are free-form text, so the same concept often appears under multiple spellings (`computer-vision`, `computer vision`, `cv`). Tag groups normalize these into a single canonical tag shown in the filter dropdown, and are configured in `public/tag-groups.js`.

When first setting up your catalog, run the export script to generate a full list of your organization's current raw tags (saved to `scripts/tag-export.txt`), then use that list to build your initial `tag-groups.js`. A weekly GitHub Actions workflow will automatically open a pull request whenever 5 or more new tags (relative to the last committed baseline in `scripts/tag-export.txt`) are detected, keeping your tag groups up to date over time.

> [!IMPORTANT]
> **Required token**: The weekly tag scan workflow requires a fine-grained access token with **Pull requests: Read and write** permission on the catalog repo. Follow the instructions in [App Authentication](app-authentication.md) to create and install a private Catalog Automation App for token generation.

See **[tag-grouping-process.md](tag-grouping-process.md)** for full setup instructions, conventions, and guidance on using AI assistance for the initial grouping pass.

## Non-GitHub Code Platform Setup

The default code platform for this catalog is GitHub. If you wish to use another supported platform (Codeberg), please note that the [tag export](../scripts/export-tags.js) and [fetch release](../scripts/fetch-releases.js) scripts may require header definition modifications to function properly. Workflows would also require token and other platform-specific updates if running from a non-GitHub repository. Otherwise, this app is set up to be able to run from Codeberg to fetch and display Codeberg repositories.
