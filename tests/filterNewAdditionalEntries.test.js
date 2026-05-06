import { describe, it, expect } from 'vitest';
import { filterNewAdditionalEntries } from '../src/filterNewAdditionalEntries.js';

describe('filterNewAdditionalEntries', () => {
    it('returns all entries when existingIds is empty', () => {
        const entries = [
            { repo: 'org/a', type: 'datasets' },
            { repo: 'org/b', type: 'models' },
        ];
        expect(filterNewAdditionalEntries(new Set(), entries)).toEqual(entries);
    });

    it('returns empty array for empty additionalEntries', () => {
        expect(filterNewAdditionalEntries(new Set(['org/a']), [])).toEqual([]);
    });

    it('excludes entries whose repo already exists in existingIds', () => {
        const existingIds = new Set(['org/existing']);
        const entries = [
            { repo: 'org/existing', type: 'datasets' },
            { repo: 'org/new', type: 'datasets' },
        ];
        const result = filterNewAdditionalEntries(existingIds, entries);
        expect(result).toEqual([{ repo: 'org/new', type: 'datasets' }]);
    });

    it('excludes all entries when all repos are already in existingIds', () => {
        const existingIds = new Set(['org/a', 'org/b']);
        const entries = [
            { repo: 'org/a', type: 'datasets' },
            { repo: 'org/b', type: 'models' },
        ];
        expect(filterNewAdditionalEntries(existingIds, entries)).toEqual([]);
    });

    it('deduplicates within additionalEntries — first occurrence wins', () => {
        const entries = [
            { repo: 'org/dup', type: 'datasets' },
            { repo: 'org/dup', type: 'models' },
            { repo: 'org/unique', type: 'datasets' },
        ];
        const result = filterNewAdditionalEntries(new Set(), entries);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ repo: 'org/dup', type: 'datasets' });
        expect(result[1]).toEqual({ repo: 'org/unique', type: 'datasets' });
    });

    it('does not mutate the existingIds set', () => {
        const existingIds = new Set(['org/a']);
        const entries = [{ repo: 'org/b', type: 'datasets' }];
        filterNewAdditionalEntries(existingIds, entries);
        expect(existingIds.size).toBe(1);
        expect(existingIds.has('org/b')).toBe(false);
    });

    it('handles mixed existing and duplicate entries together', () => {
        const existingIds = new Set(['org/exists']);
        const entries = [
            { repo: 'org/exists', type: 'datasets' },
            { repo: 'org/new', type: 'datasets' },
            { repo: 'org/new', type: 'models' },
        ];
        const result = filterNewAdditionalEntries(existingIds, entries);
        expect(result).toEqual([{ repo: 'org/new', type: 'datasets' }]);
    });
});
