/**
 * Returns the subset of additionalEntries that should be fetched:
 * - Excludes entries whose repo is already in existingIds.
 * - Excludes duplicate repo values within additionalEntries (first occurrence wins).
 * @param {Set<string>} existingIds - IDs already present in the fetched item list.
 * @param {{ repo: string }[]} additionalEntries - Candidate additional entries.
 * @returns {{ repo: string }[]}
 */
export function filterNewAdditionalEntries(existingIds, additionalEntries) {
    const seen = new Set();
    return additionalEntries.filter(entry => {
        if (existingIds.has(entry.repo) || seen.has(entry.repo)) return false;
        seen.add(entry.repo);
        return true;
    });
}
