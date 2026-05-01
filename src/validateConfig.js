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

    if (!config.ORGANIZATION_NAME)            errors.push('ORGANIZATION_NAME');
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
