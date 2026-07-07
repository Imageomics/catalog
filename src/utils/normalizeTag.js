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
 * Normalizes a raw tag string for the tag selection dropdown.
 * - Returns null for Hugging Face system metadata tags (tags containing a colon).
 * - Maps known aliases to their canonical tag(s) via tagLookup.
 * - Falls back to the lowercased original if no mapping exists.
 * @param {string} tag
 * @param {Object} [lookup=tagLookup] - Optional reverse lookup map (alias → canonical tags).
 *   Defaults to the module's prebuilt lookup from TAG_GROUPS. Pass a custom lookup in tests.
 * @returns {string[]|null}
 */
export function normalizeTag(tag, lookup = tagLookup) {
    const lower = String(tag).toLowerCase();
    // OPTION LINE -- REMOVE IF UNWANTED
    // Removes Hugging Face auto-generated system tags (e.g. "license:mit", "format:parquet") from dropdown filter.
    // These are identified by the presence of a colon. To include auto-generated tags in the
    // catalog, remove the following line and `.filter` line from the filterDisplayTags function.
    if (lower.includes(':')) return null;
    return lookup[lower] ?? [lower];
}

/**
 * Sorts and filters tags for display in the repo cards.
 * Currently excludes tags containing a colon (Hugging Face system metadata tags).
 * @param {string[]} rawTags - Array of tags to sort and filter.
 * @returns {string[]} Filtered and sorted array of tags for display.
 */
export function filterDisplayTags(rawTags) {
    let displayTags = rawTags.sort() || [];
    // OPTION LINE -- REMOVE IF UNWANTED
    // Removes Hugging Face auto-generated system tags (e.g. "license:mit", "format:parquet") from display.
    // These are identified by the presence of a colon. To include auto-generated tags in the repo cards,
    // remove the following line.
    displayTags = displayTags.filter(t => !t.includes(':'));
    return displayTags;
}
