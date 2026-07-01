/**
 * Filters an array of catalog items against search, tag, and archive criteria.
 * @param {Object[]} items
 * @param {Object} filters
 * @param {string} filters.searchTerm - Lowercased search string.
 * @param {string} filters.tagFilter - Exact canonical tag to match, or "" for all.
 * @param {string} filters.archiveFilter - "active" hides archived; "all" shows everything.
 * @returns {Object[]}
 */
export function filterItems(items, { searchTerm, tagFilter, archiveFilter }) {
    return items.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            item.rawTags?.some(tag => tag.includes(searchTerm));

        const matchesTag = tagFilter === '' || item.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase());

        const matchesArchive = archiveFilter === 'all' || !item.archived;

        return matchesSearch && matchesTag && matchesArchive;
    });
}

/**
 * Sorts a copy of the items array by the given sort key.
 * Supports: lastModified, createdAt, alphabetical_asc, alphabetical_desc, stars_desc, stars_asc.
 * Unknown sort keys fall back to lastModified.
 * @param {Object[]} items
 * @param {string} sortBy
 * @returns {Object[]}
 */
export function sortItems(items, sortBy) {
    const sorted = [...items];

    const displayName = item =>
        item.cardData?.pretty_name || item.cardData?.model_name || item.cardData?.title || item.id.split('/').pop();

    switch (sortBy) {
        case 'alphabetical_asc':
            sorted.sort((a, b) => displayName(a).localeCompare(displayName(b)) || a.id.localeCompare(b.id));
            break;

        case 'alphabetical_desc':
            sorted.sort((a, b) => displayName(b).localeCompare(displayName(a)) || b.id.localeCompare(a.id));
            break;

        case 'stars_desc':
            sorted.sort((a, b) => (b.cardData?.stars ?? b.likes ?? 0) - (a.cardData?.stars ?? a.likes ?? 0));
            break;

        case 'stars_asc':
            sorted.sort((a, b) => (a.cardData?.stars ?? a.likes ?? 0) - (b.cardData?.stars ?? b.likes ?? 0));
            break;

        case 'createdAt':
            sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;

        case 'lastModified':
        default:
            sorted.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
            break;
    }

    return sorted;
}
