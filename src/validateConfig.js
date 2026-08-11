const VALID_HF_TYPES = new Set(['datasets', 'models', 'spaces']);
const REQUIRED_COLOR_KEYS = ['primary', 'secondary', 'accent', 'accentDark', 'tag'];

/**
 * Validates a parsed config object against all required fields and shapes.
 * @param {unknown} config - The parsed config (from config.yaml)
 * @returns {string[]} Array of error messages; empty means valid.
 */
export function validateConfig(config) {
    const errors = [];

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        errors.push('config must be a YAML mapping/object');
        return errors;
    }

    /**
     * PLATFORM will be parsed without whitespace, but must be string to avoid undefined errors
    */
    const supportedPlatforms = ['github', 'gitlab', 'codeberg'];
    const platform = config.PLATFORM;
    var validPlatform = '';
    if (!platform || typeof platform !== 'string') {
        errors.push('PLATFORM');
    } else if (!supportedPlatforms.includes(platform.toLowerCase())) {
        errors.push(`PLATFORM must be one of: ${supportedPlatforms.join(', ')}`);
    } else {
        validPlatform = platform.toLowerCase();
    }

    /**
     * Validate organization names, existence and allowed characters
     *
     * GitHub org names allow only letters, numbers, and hyphens; GitLab and Codeberg also allow underscores.
     * All require alphanumeric characters at start and end.
     * See: https://docs.gitlab.com/user/reserved_names/
     * See: https://codeberg.org/forgejo-contrib/forgejo-cli/wiki/Organizations
    */
    const orgName = config.ORGANIZATION_NAME;
    const ghOrgRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    const glcbOrgRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9_\-]*[a-zA-Z0-9])?$/;
    if (typeof orgName !== 'string' || !orgName.trim()) {
        errors.push('ORGANIZATION_NAME');
    } else if (!errors.includes('PLATFORM')) {
        // If PLATFORM is invalid, we cannot determine which regex to use for ORGANIZATION_NAME validation.
        if (validPlatform == 'github') {
            var codeRegex = ghOrgRegex;
            var codeRegexError = 'only letters, numbers, and hyphens';
        } else {
            var codeRegex = glcbOrgRegex;
            var codeRegexError = 'only letters, numbers, hyphens, and underscores';
        }
        if (!codeRegex.test(orgName)) {
            errors.push(`ORGANIZATION_NAME (${orgName}) is invalid for ${validPlatform} API calls, ${codeRegexError} are allowed`);
        }
    }
    // Hugging Face org names allow letters, numbers, hyphens, and underscores.
    const hfOrgRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9_\-]*[a-zA-Z0-9])?$/;
    const hfOrgName = config.HF_ORGANIZATION_NAME;
    if (typeof hfOrgName !== 'string' || !hfOrgName.trim()) {
        errors.push('HF_ORGANIZATION_NAME');
    } else if (!hfOrgRegex.test(hfOrgName)) {
        errors.push(`HF_ORGANIZATION_NAME (${hfOrgName}) is invalid, only letters, numbers, hyphens, and underscores are allowed`);
    }
    if (!config.ORG_NAME)                     errors.push('ORG_NAME');
    if (!config.CATALOG_REPO_NAME)            errors.push('CATALOG_REPO_NAME');

    if (!config.API_BASE_URL)                 errors.push('API_BASE_URL');
    if (config.REFRESH_INTERVAL_DAYS == null) errors.push('REFRESH_INTERVAL_DAYS');

    if (!Array.isArray(config.ADDITIONAL_REPOS)) {
        errors.push('ADDITIONAL_REPOS (must be a list)');
    }

    if (!Array.isArray(config.ADDITIONAL_HF_REPOS)) {
        errors.push('ADDITIONAL_HF_REPOS (must be a list)');
    } else {
        const badEntries = config.ADDITIONAL_HF_REPOS.filter(
            e => !e || typeof e.repo !== 'string' || !e.repo.trim() || !VALID_HF_TYPES.has(e.type)
        );
        if (badEntries.length) {
            errors.push(
                `ADDITIONAL_HF_REPOS entries must each have a non-empty "repo" string and "type" in {datasets, models, spaces}; bad entries: ${badEntries.map(e => JSON.stringify(e)).join(', ')}`
            );
        }
    }

    if (!config.COLORS || typeof config.COLORS !== 'object') {
        errors.push('COLORS (must be an object with primary, secondary, accent, accentDark, tag)');
    } else {
        const missingColors = REQUIRED_COLOR_KEYS.filter(k => !config.COLORS[k]);
        if (missingColors.length) errors.push(`COLORS keys: ${missingColors.join(', ')}`);
    }

    return errors;
}
