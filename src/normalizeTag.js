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
    if (lower.includes(':')) return null;
    return tagLookup[lower] ?? [lower];
}
