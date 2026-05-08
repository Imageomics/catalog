import { describe, it, expect } from 'vitest';
import { normalizeTag } from '../src/normalizeTag.js';

// tagLookup format: lowercased alias → [canonical tags]
const LOOKUP = {
    bird: ['animals'],
    birds: ['animals'],
    butterfly: ['animals', 'insects'],
    butterflies: ['animals', 'insects'],
    beetle: ['insects'],
    fish: ['animals'],
};

describe('normalizeTag', () => {
    it('returns null for tags containing a colon', () => {
        expect(normalizeTag('license:mit', LOOKUP)).toBeNull();
        expect(normalizeTag('format:parquet', LOOKUP)).toBeNull();
        expect(normalizeTag(':leadingcolon', LOOKUP)).toBeNull();
        expect(normalizeTag('trailingcolon:', LOOKUP)).toBeNull();
    });

    it('returns the canonical tag in an array for a known alias', () => {
        expect(normalizeTag('bird', LOOKUP)).toEqual(['animals']);
        expect(normalizeTag('birds', LOOKUP)).toEqual(['animals']);
    });

    it('returns multiple canonical tags when an alias maps to multiple groups', () => {
        expect(normalizeTag('butterfly', LOOKUP)).toEqual(['animals', 'insects']);
        expect(normalizeTag('butterflies', LOOKUP)).toEqual(['animals', 'insects']);
    });

    it('lowercases the input before lookup', () => {
        expect(normalizeTag('BIRD', LOOKUP)).toEqual(['animals']);
        expect(normalizeTag('Bird', LOOKUP)).toEqual(['animals']);
        expect(normalizeTag('BUTTERFLY', LOOKUP)).toEqual(['animals', 'insects']);
    });

    it('returns the lowercased tag in a single-element array when no mapping exists', () => {
        expect(normalizeTag('unknown-tag', LOOKUP)).toEqual(['unknown-tag']);
        expect(normalizeTag('UNKNOWN', LOOKUP)).toEqual(['unknown']);
    });

    it('handles an empty tagLookup (passthrough)', () => {
        expect(normalizeTag('some-tag', {})).toEqual(['some-tag']);
    });

    it('coerces non-string input to string', () => {
        expect(normalizeTag(123, {})).toEqual(['123']);
        expect(normalizeTag(true, {})).toEqual(['true']);
    });
});
