import { getPlatformDisplay } from '../utils/defineRibbonVals.js';

/**
 * Initializes UI elements from configuration values.
 * This sets up the header, logo, repo ribbon, and dynamic styles.
 * @param {Object} config - The loaded configuration object.
 */
export const initializeUIFromConfig = (config) => {
    // Apply CSS custom properties and document metadata
    document.title = config.CATALOG_TITLE || `${config.ORG_NAME} Catalog`;
    document.documentElement.style.setProperty('--color-primary',     config.COLORS?.primary     || '#92991c');
    document.documentElement.style.setProperty('--color-secondary',   config.COLORS?.secondary   || '#5d8095');
    document.documentElement.style.setProperty('--color-accent',      config.COLORS?.accent      || '#0097b2');
    document.documentElement.style.setProperty('--color-accent-dark', config.COLORS?.accentDark  || '#4fd1eb');
    document.documentElement.style.setProperty('--color-tag',         config.COLORS?.tag         || '#9bcb5e');
    const fontFamily = config.FONT_FAMILY || 'Inter';
    document.documentElement.style.setProperty('--font-family', fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily);

    // Update Google Fonts link
    if (config.FONT_FAMILY) {
        const fontFamily = config.FONT_FAMILY.replace(/\s+/g, '+');
        const fontLink = document.getElementById('font-link');
        if (fontLink) fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;500;600;700&display=swap`;
    }

    // Set favicon
    const faviconLink = document.getElementById('favicon-link');
    if (faviconLink && config.FAVICON_URL) faviconLink.href = config.FAVICON_URL;

    // Set header logo
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.src = config.LOGO_URL;
        logoImg.alt = config.ORG_NAME + ' Logo';

        logoImg.onload = () => {
            logoImg.classList.remove('opacity-0');
        };
    }

    // Set header title and description
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = config.CATALOG_TITLE || `${config.ORG_NAME} Catalog`;
        headerTitle.style.color = config.COLORS.primary;
    }

    const headerDesc = document.getElementById('header-description');
    if (headerDesc) {
        headerDesc.textContent = config.CATALOG_DESCRIPTION;
    }

    // Set Code Repo ribbon link, SVG path, display name, and colors
    const repoRibbon = document.getElementById('repo-ribbon');
    const platformDisplay = getPlatformDisplay(config.PLATFORM);
    if (repoRibbon && platformDisplay) {
        repoRibbon.href = `${platformDisplay.ribbonUrl}${config.ORGANIZATION_NAME}/${config.CATALOG_REPO_NAME}`;
        const pathElement = document.getElementById('repo-ribbon-icon');
        pathElement.setAttribute('d', platformDisplay.path);
        const platformDisplayName = document.getElementById('platform-display-name');
        platformDisplayName.textContent = platformDisplay.displayName || config.PLATFORM;
        repoRibbon.style.backgroundColor = config.COLORS.secondary;
        repoRibbon.style.setProperty('--hover-color', config.COLORS.primary);
        repoRibbon.addEventListener('mouseenter', function () {
            this.style.backgroundColor = config.COLORS.primary;
        });
        repoRibbon.addEventListener('mouseleave', function () {
            this.style.backgroundColor = config.COLORS.secondary;
        });
    }

    // Set focus ring colors for form inputs and link hover colors
    const style = document.createElement('style');
    style.textContent = `
        .focus\\:ring-2:focus { --tw-ring-color: var(--color-accent) !important; }
        .item-link:hover { color: var(--color-accent) !important; }
        .dark .item-link:hover { color: var(--color-accent-dark) !important; }
    `;
    document.head.appendChild(style);
};

//
// THEME TOGGLE LOGIC
// Establishes a button to toggle between light and dark themes, storing the preference in localStorage.
export const setThemeToggle = () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (
        localStorage.theme === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    });
};
