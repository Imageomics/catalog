/**
 * Normalizes a raw tag string.
 * - Returns null for Hugging Face system metadata tags (tags containing a colon).
 * - Maps known aliases to their canonical tag(s) via tagLookup.
 * - Falls back to the lowercased original if no mapping exists.
 * @param {string} tag
 * @param {Object} tagLookup - Reverse lookup map: lowercased alias → [canonical tags]
 * @returns {string[]|null}
 */
export function normalizeTag(tag, tagLookup) {
    const lower = String(tag).toLowerCase();
    // OPTION LINE -- REMOVE IF UNWANTED
    // Removes Hugging Face auto-generated system tags (e.g. "license:mit", "format:parquet").
    // These are identified by the presence of a colon. To include auto-generated tags in the
    // catalog, remove the following line.
    if (lower.includes(':')) return null;
    return tagLookup[lower] ?? [lower];
}
