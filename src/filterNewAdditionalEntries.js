/**
 * Returns the subset of additionalEntries that should be fetched:
 * - Excludes entries whose repo is already in existingIds.
 * - Excludes duplicate repo values within additionalEntries (first occurrence wins).
 *
 * NOTE: Deduplication is by repo ID only — entry types are not compared. Callers
 * must pre-filter additionalEntries to a single repo type before calling this function
 * (as both main.js and export-tags.js do via `ADDITIONAL_HF_REPOS.filter(e => e.type === repoType)`).
 * Passing entries of mixed types could incorrectly suppress a valid entry.
 *
 * @param {Set<string>} existingIds - IDs already present in the fetched item list.
 * @param {{ repo: string, type: string }[]} additionalEntries - Candidate additional entries, pre-filtered to a single type.
 * @returns {{ repo: string, type: string }[]}
 */
export function filterNewAdditionalEntries(existingIds, additionalEntries) {
    const seen = new Set();
    return additionalEntries.filter(entry => {
        if (existingIds.has(entry.repo) || seen.has(entry.repo)) return false;
        seen.add(entry.repo);
        return true;
    });
}
