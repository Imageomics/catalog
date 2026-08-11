# Personalizing Your Catalog

Welcome to your new catalog repo! The primary way to personalize this catalog is through the `config.yaml` file, which contains all customizable settings. After using the template, you'll need to update the following:

## Primary Configuration File

[**`public/config.yaml`**](../public/config.yaml): This is the main file to edit. It contains all configuration options (e.g., organization names, colors, branding, and API settings) with inline comments explaining each setting. Replace Imageomics-specific values with those appropriate for your organization and catalog repository.

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

  * `PLATFORM`: Coding platform used: 'github', 'codeberg', or 'gitlab' (default: 'github'). Please see [notes on platform setup](#non-github-code-repository-platform-setup) if using for non-GitHub code repositories
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

## Non-GitHub Code Repository Platform Setup

The default code repository platform for this catalog is GitHub. If you wish to use another supported platform (Codeberg or GitLab), please note that the [tag export](../scripts/export-tags.js) and [fetch release](../scripts/fetch-releases.js) scripts require header definition modifications to function properly. Notes are provided at the relevant lines (under "Update this section as needed for non-GitHub code platforms"). Workflows would also require token and other platform-specific updates if running from a non-GitHub repository. Otherwise, this app is set up to be able to run from Codeberg or GitLab to fetch and display repositories from the respective platform.

Example configs, as used in testing the Catalog template for non-GitHub code platforms, are provided below.

### Sample Codeberg Config

```yaml
# Configuration file for Catalog Template
# Customize these values to personalize the catalog for your organization

# Organization & Repository Settings
ORGANIZATION_NAME: forgejo          # Codebase platform organization name (for API calls)
HF_ORGANIZATION_NAME: imageomics    # Hugging Face organization name (case-sensitive, for API calls)
ORG_NAME: Forgejo                   # Display name for Codebase platform organization (can differ from API name)
CATALOG_REPO_NAME: forgejo          # Repository name for the catalog itself (used for stats badge)

# Branding
CATALOG_TITLE: Fake Forgejo Catalog
CATALOG_DESCRIPTION: "Explore and discover public code, datasets, models, and spaces."
LOGO_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png"
FAVICON_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png"

# Colors (CSS custom properties)
COLORS:
  primary: "#92991c"      # Primary brand color (Imageomics Green)
  secondary: "#5d8095"    # Secondary brand color (Imageomics Blue)
  accent: "#0097b2"       # Accent color (Dark Teal)
  accentDark: "#4fd1eb"   # Dark mode accent color (Light Cyan)
  tag: "#9bcb5e"          # Tag background color (Light Green)

# API & Behavior Settings
# Codebase platform for API calls and link generation. Supported values: "github", "codeberg", or "gitlab".
PLATFORM: codeberg
# Dataset, model, and space (demo) default: Hugging Face, other platforms would require a custom module
API_BASE_URL: "https://huggingface.co/api/"
# Define "new" repository criteria
REFRESH_INTERVAL_DAYS: 30

# Array of "owner/repo" strings to include in addition to non-forked org repos.
# Use this for forked repos within the org and repos outside the org entirely.
ADDITIONAL_REPOS: []

# Array of Hugging Face repos from outside the org to include.
# Each entry must specify "repo" (owner/name) and "type" (datasets, models, or spaces).
# ADDITIONAL_HF_REPOS:
#   - repo: "user/dataset-name"
#     type: "datasets"
#   - repo: "user/model-name"
#     type: "models"
#   - repo: "user/space-name"
#     type: "spaces"
ADDITIONAL_HF_REPOS:
  - repo: "yoohj0416/predictbeetle"
    type: "models"

# Typography
FONT_FAMILY: Inter    # Font family for the site
```

### Sample GitLab Config

```yaml
# Configuration file for Catalog Template
# Customize these values to personalize the catalog for your organization

# Organization & Repository Settings
ORGANIZATION_NAME: GitLab-com       # Codebase platform organization name (for API calls)
HF_ORGANIZATION_NAME: imageomics    # Hugging Face organization name (case-sensitive, for API calls)
ORG_NAME: Imageomics                # Display name for Codebase platform organization (can differ from API name)
CATALOG_REPO_NAME: www-gitlab-com          # Repository name for the catalog itself (used for stats badge)

# Branding
CATALOG_TITLE: Fake GitLab.com Catalog
CATALOG_DESCRIPTION: "Explore and discover public code, datasets, models, and demos."
LOGO_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png"
FAVICON_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png"

# Colors (CSS custom properties)
COLORS:
  primary: "#92991c"      # Primary brand color (Imageomics Green)
  secondary: "#5d8095"    # Secondary brand color (Imageomics Blue)
  accent: "#0097b2"       # Accent color (Dark Teal)
  accentDark: "#4fd1eb"   # Dark mode accent color (Light Cyan)
  tag: "#9bcb5e"          # Tag background color (Light Green)

# API & Behavior Settings
# Codebase platform for API calls and link generation. Supported values: "github", "codeberg", or "gitlab".
PLATFORM: gitlab
# Dataset, model, and demo default: Hugging Face, other platforms would require a custom module
API_BASE_URL: "https://huggingface.co/api/"
# Define "new" repository criteria
REFRESH_INTERVAL_DAYS: 30

# Array of "owner/repo" strings to include in addition to non-forked org repos.
# For GitLab, use the project ID (numeric code) or "owner%2Frepo" (ex: "gitlab-com%2Fdatabase" for https://gitlab.com/gitlab-com/database).
# Use this for forked repos within the org and repos outside the org entirely.
ADDITIONAL_REPOS:
  - "spectrelonewolf%2Fproyectoprofesionalcore1" # ex: https://gitlab.com/spectrelonewolf/proyectoprofesionalcore1

# Array of Hugging Face repos from outside the org to include.
# Each entry must specify "repo" (owner/name) and "type" (datasets, models, or spaces/demos).
# Organization names are case-sensitive in the Hugging Face API.
# ADDITIONAL_HF_REPOS:
#   - repo: "user/dataset-name"
#     type: "datasets"
#   - repo: "user/model-name"
#     type: "models"
#   - repo: "user/space-name"
#     type: "spaces"
ADDITIONAL_HF_REPOS:
  - repo: "yoohj0416/predictbeetle"
    type: "models"

# Typography
FONT_FAMILY: Inter    # Font family for the site

```
