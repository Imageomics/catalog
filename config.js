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
        tag: "#9bcb5e" // Tag background color (Light Green)
    },

    // Footer/Grant Configuration
    FOOTER: {
        show: true, // Set to false to hide the footer entirely
        instituteName: "Imageomics Institute", // Institute or organization name
        instituteUrl: "https://imageomics.org", // Institute website URL
        grantInfo: {
            // Grant information object
            funder: "US National Science Foundation's Harnessing the Data Revolution (HDR) program",
            awardNumber: "2118240",
            awardUrl: "https://www.nsf.gov/awardsearch/showAward?AWD_ID=2118240",
            description: "Imageomics: A New Frontier of Biological Information Powered by Knowledge-Guided Machine Learning"
        },
        disclaimer: "Any opinions, findings, conclusions, or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation."
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
