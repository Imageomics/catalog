/**
 * Tag (keyword) processing, including normalization and tag-group lookup.
 * These functions are used to standardize tags across different repositories and platforms.
 */

/**
 * Builds a reverse lookup map from TAG_GROUPS (defined in tag-groups.js): raw tag → [canonical tags]
 * A raw tag may appear in multiple groups, so the value is an array.
 * @returns {Object} The reverse lookup map.
 */
export const buildTagLookup = () => {
    const lookup = Object.create(null);
    if (typeof TAG_GROUPS !== 'undefined') {
        for (const [canonical, aliases] of Object.entries(TAG_GROUPS)) {
            for (const alias of aliases) {
                const key = alias.toLowerCase();
                if (lookup[key]) {
                    lookup[key].push(canonical);
                } else {
                    lookup[key] = [canonical];
                }
            }
        }
    }
    return lookup;
};

const tagLookup = buildTagLookup();

/**
 * Normalizes a raw tag string.
 * - Returns null for Hugging Face system metadata tags (tags containing a colon).
 * - Maps known aliases to their canonical tag(s) via tagLookup.
 * - Falls back to the lowercased original if no mapping exists.
 * @param {string} tag
 * @returns {string[]|null}
 */
export function normalizeTag(tag) {
    const lower = String(tag).toLowerCase();
    // OPTION LINE -- REMOVE IF UNWANTED
    // Removes Hugging Face auto-generated system tags (e.g. "license:mit", "format:parquet").
    // These are identified by the presence of a colon. To include auto-generated tags in the
    // catalog, remove the following line.
    if (lower.includes(':')) return null;
    return tagLookup[lower] ?? [lower];
}
