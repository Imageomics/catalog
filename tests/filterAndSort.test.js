import { describe, it, expect } from 'vitest';
import { filterItems, sortItems } from '../src/filterAndSort.js';

// Minimal item factory — only the fields filterItems/sortItems actually read.
const makeItem = (overrides = {}) => ({
    id: 'org/repo',
    description: 'A test repository.',
    tags: ['animals', 'birds'],
    rawTags: ['bird', 'animal'],
    archived: false,
    cardData: { pretty_name: 'Repo', stars: null },
    likes: 0,
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-06-01'),
    ...overrides,
});

// ─── filterItems ─────────────────────────────────────────────────────────────

describe('filterItems', () => {
    const defaults = { searchTerm: '', tagFilter: '', archiveFilter: 'active' };

    it('returns all items when no filters are active', () => {
        const items = [makeItem(), makeItem({ id: 'org/other' })];
        expect(filterItems(items, defaults)).toHaveLength(2);
    });

    it('filters by id substring (searchTerm is pre-lowercased)', () => {
        const items = [
            makeItem({ id: 'org/fish-data', tags: [], rawTags: [] }),
            makeItem({ id: 'org/plant-model', tags: [], rawTags: [] }),
        ];
        expect(filterItems(items, { ...defaults, searchTerm: 'fish' })).toHaveLength(1);
        expect(filterItems(items, { ...defaults, searchTerm: 'plant' })).toHaveLength(1);
        expect(filterItems(items, { ...defaults, searchTerm: 'org' })).toHaveLength(2);
    });

    it('filters by description substring', () => {
        const items = [
            makeItem({ description: 'Images of butterflies' }),
            makeItem({ description: 'Images of dogs' }),
        ];
        expect(filterItems(items, { ...defaults, searchTerm: 'butterfl' })).toHaveLength(1);
    });

    it('filters by normalized tag substring', () => {
        const items = [
            makeItem({ tags: ['machine-learning', 'biology'] }),
            makeItem({ tags: ['computer-vision'] }),
        ];
        expect(filterItems(items, { ...defaults, searchTerm: 'bio' })).toHaveLength(1);
    });

    it('filters by rawTag substring', () => {
        const items = [
            makeItem({ rawTags: ['heliconius-erato'] }),
            makeItem({ rawTags: ['bird'] }),
        ];
        expect(filterItems(items, { ...defaults, searchTerm: 'heliconius' })).toHaveLength(1);
    });

    it('returns no items when search matches nothing', () => {
        const items = [makeItem(), makeItem({ id: 'org/other' })];
        expect(filterItems(items, { ...defaults, searchTerm: 'zzznomatch' })).toHaveLength(0);
    });

    it('filters by exact tag (case-insensitive)', () => {
        const items = [
            makeItem({ tags: ['animals', 'birds'] }),
            makeItem({ tags: ['machine-learning'] }),
        ];
        expect(filterItems(items, { ...defaults, tagFilter: 'birds' })).toHaveLength(1);
        expect(filterItems(items, { ...defaults, tagFilter: 'BIRDS' })).toHaveLength(1);
    });

    it('tag filter does not match partial tags', () => {
        const items = [makeItem({ tags: ['machine-learning'] })];
        expect(filterItems(items, { ...defaults, tagFilter: 'machine' })).toHaveLength(0);
    });

    it('archiveFilter active hides archived items', () => {
        const items = [makeItem(), makeItem({ archived: true })];
        expect(filterItems(items, { ...defaults, archiveFilter: 'active' })).toHaveLength(1);
    });

    it('archiveFilter all includes archived items', () => {
        const items = [makeItem(), makeItem({ archived: true })];
        expect(filterItems(items, { ...defaults, archiveFilter: 'all' })).toHaveLength(2);
    });

    it('all three filters combine correctly', () => {
        const items = [
            makeItem({ id: 'org/fish-data', tags: ['biology'], archived: false }),
            makeItem({ id: 'org/fish-archive', tags: ['biology'], archived: true }),
            makeItem({ id: 'org/bird-data', tags: ['biology'], archived: false }),
        ];
        const result = filterItems(items, { searchTerm: 'fish', tagFilter: 'biology', archiveFilter: 'active' });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('org/fish-data');
    });
});

// ─── sortItems ────────────────────────────────────────────────────────────────

describe('sortItems', () => {
    it('does not mutate the input array', () => {
        const items = [makeItem({ id: 'org/b' }), makeItem({ id: 'org/a' })];
        const original = [...items];
        sortItems(items, 'alphabetical_asc');
        expect(items).toEqual(original);
    });

    it('alphabetical_asc sorts by display name A→Z', () => {
        const items = [
            makeItem({ id: 'org/b', cardData: { pretty_name: 'Zebra', stars: null } }),
            makeItem({ id: 'org/a', cardData: { pretty_name: 'Alpha', stars: null } }),
            makeItem({ id: 'org/c', cardData: { pretty_name: 'Mango', stars: null } }),
        ];
        const result = sortItems(items, 'alphabetical_asc').map(i => i.cardData.pretty_name);
        expect(result).toEqual(['Alpha', 'Mango', 'Zebra']);
    });

    it('alphabetical_desc sorts by display name Z→A', () => {
        const items = [
            makeItem({ id: 'org/a', cardData: { pretty_name: 'Alpha', stars: null } }),
            makeItem({ id: 'org/b', cardData: { pretty_name: 'Mango', stars: null } }),
            makeItem({ id: 'org/c', cardData: { pretty_name: 'Zebra', stars: null } }),
        ];
        const result = sortItems(items, 'alphabetical_desc').map(i => i.cardData.pretty_name);
        expect(result).toEqual(['Zebra', 'Mango', 'Alpha']);
    });

    it('alphabetical_asc falls back to id when pretty_name is absent', () => {
        const items = [
            makeItem({ id: 'org/zebra', cardData: {} }),
            makeItem({ id: 'org/alpha', cardData: {} }),
        ];
        const result = sortItems(items, 'alphabetical_asc').map(i => i.id);
        expect(result).toEqual(['org/alpha', 'org/zebra']);
    });

    it('stars_desc sorts highest stars first', () => {
        const items = [
            makeItem({ id: 'org/low', cardData: { stars: 2 } }),
            makeItem({ id: 'org/high', cardData: { stars: 100 } }),
            makeItem({ id: 'org/mid', cardData: { stars: 50 } }),
        ];
        const result = sortItems(items, 'stars_desc').map(i => i.cardData.stars);
        expect(result).toEqual([100, 50, 2]);
    });

    it('stars_asc sorts lowest stars first', () => {
        const items = [
            makeItem({ id: 'org/high', cardData: { stars: 100 } }),
            makeItem({ id: 'org/low', cardData: { stars: 2 } }),
        ];
        const result = sortItems(items, 'stars_asc').map(i => i.cardData.stars);
        expect(result).toEqual([2, 100]);
    });

    it('stars sort falls back to likes when stars is null', () => {
        const items = [
            makeItem({ id: 'org/no-stars', cardData: { stars: null }, likes: 10 }),
            makeItem({ id: 'org/has-stars', cardData: { stars: 5 }, likes: 0 }),
        ];
        const result = sortItems(items, 'stars_desc').map(i => i.id);
        expect(result).toEqual(['org/no-stars', 'org/has-stars']);
    });

    it('createdAt sorts newest creation first', () => {
        const items = [
            makeItem({ id: 'org/old', createdAt: new Date('2020-01-01') }),
            makeItem({ id: 'org/new', createdAt: new Date('2024-01-01') }),
        ];
        const result = sortItems(items, 'createdAt').map(i => i.id);
        expect(result).toEqual(['org/new', 'org/old']);
    });

    it('lastModified sorts most recently modified first', () => {
        const items = [
            makeItem({ id: 'org/stale', lastModified: new Date('2021-01-01') }),
            makeItem({ id: 'org/fresh', lastModified: new Date('2024-06-01') }),
        ];
        const result = sortItems(items, 'lastModified').map(i => i.id);
        expect(result).toEqual(['org/fresh', 'org/stale']);
    });

    it('unknown sort key defaults to lastModified order', () => {
        const items = [
            makeItem({ id: 'org/stale', lastModified: new Date('2021-01-01') }),
            makeItem({ id: 'org/fresh', lastModified: new Date('2024-06-01') }),
        ];
        const result = sortItems(items, 'not-a-real-sort').map(i => i.id);
        expect(result).toEqual(['org/fresh', 'org/stale']);
    });
});
