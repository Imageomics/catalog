// Configuration file for Catalog Template
// Customize these values to personalize the catalog for your organization

const CONFIG = {
    // Organization & Repository Settings
    ORGANISATION_NAME: "imageomics", // GitHub/Hugging Face organization name (lowercase for API calls)
    GITHUB_ORG_NAME: "Imageomics", // Display name for GitHub organization (can differ from API name)
    CATALOG_REPO_NAME: "catalog", // Repository name for the catalog itself (used for stats badge)
    GITHUB_REPO_URL: "https://github.com/Imageomics/catalog", // Full URL to the catalog repository

    // Branding
    CATALOG_TITLE: "Imageomics Catalog", // Page title and main heading
    CATALOG_DESCRIPTION: "Explore and discover public code, datasets, models, and spaces.", // Subtitle/description text
    LOGO_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png", // Organization logo URL
    FAVICON_URL: "https://github.com/Imageomics/Imageomics-guide/raw/3478acc0068a87a5604069d04a29bdb0795c2045/docs/logos/Imageomics_logo_butterfly.png", // Favicon URL

    // Colors (CSS custom properties)
    COLORS: {
        primary: "#92991c", // Primary brand color (Imageomics Green)
        secondary: "#5d8095", // Secondary brand color (Imageomics Blue)
        accent: "#0097b2", // Accent color (Dark Teal)
        accentDark: "#4fd1eb", // Dark mode accent color (Light Cyan)
        tag: "#9bcb5e" // Tag background color (Light Green)
    },

    // API & Behavior Settings
    API_BASE_URL: "https://huggingface.co/api/", // Hugging Face API base URL
    REFRESH_INTERVAL_DAYS: 30, // Number of days to consider an item "new"
    MAX_ITEMS: 100, // Maximum number of items to fetch per category
    FORKED_REPOS: [
        // Array of forked repository names to include (non-forks are included by default)
        "Fish-Vista",
        "PhyloNN",
        "telemetry-dashboard",
        "docker-workshop"
    ],

    // Typography
    FONT_FAMILY: "Inter" // Font family for the site
};
