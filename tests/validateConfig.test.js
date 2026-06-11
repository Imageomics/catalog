import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/validateConfig.js';

const VALID_CONFIG = {
    ORGANIZATION_NAME: 'imageomics',
    HF_ORGANIZATION_NAME: 'imageomics',
    ORG_NAME: 'Imageomics',
    CATALOG_REPO_NAME: 'catalog',
    PLATFORM: 'github',
    API_BASE_URL: 'https://huggingface.co/api/',
    REFRESH_INTERVAL_DAYS: 30,
    ADDITIONAL_REPOS: [],
    ADDITIONAL_HF_REPOS: [],
    COLORS: {
        primary: '#92991c',
        secondary: '#5d8095',
        accent: '#0097b2',
        accentDark: '#4fd1eb',
        tag: '#9bcb5e',
    },
};

describe('validateConfig', () => {
    it('returns no errors for a valid config', () => {
        expect(validateConfig(VALID_CONFIG)).toEqual([]);
    });

    it('returns no errors when ADDITIONAL_HF_REPOS has valid entries', () => {
        const config = {
            ...VALID_CONFIG,
            ADDITIONAL_HF_REPOS: [
                { repo: 'imageomics/data', type: 'datasets' },
                { repo: 'imageomics/model', type: 'models' },
                { repo: 'imageomics/demo', type: 'spaces' },
            ],
        };
        expect(validateConfig(config)).toEqual([]);
    });

    it('errors on null config', () => {
        expect(validateConfig(null).length).toBeGreaterThan(0);
    });

    it('errors on array config', () => {
        expect(validateConfig([]).length).toBeGreaterThan(0);
    });

    it('errors when ORGANIZATION_NAME is missing', () => {
        const { ORGANIZATION_NAME: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('ORGANIZATION_NAME');
    });

    it('errors when ORGANIZATION_NAME is empty string', () => {
        expect(validateConfig({ ...VALID_CONFIG, ORGANIZATION_NAME: '' })).toContain('ORGANIZATION_NAME');
    });

    it('errors when ORGANIZATION_NAME is not lowercase', () => {
        expect(validateConfig({ ...VALID_CONFIG, ORGANIZATION_NAME: 'Imageomics' })).toContain('ORGANIZATION_NAME');
    });

    it('errors when HF_ORGANIZATION_NAME is missing', () => {
        const { HF_ORGANIZATION_NAME: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('HF_ORGANIZATION_NAME');
    });

    it('errors when HF_ORGANIZATION_NAME is empty string', () => {
        expect(validateConfig({ ...VALID_CONFIG, HF_ORGANIZATION_NAME: '' })).toContain('HF_ORGANIZATION_NAME');
    });

    it('errors when HF_ORGANIZATION_NAME is not lowercase', () => {
        expect(validateConfig({ ...VALID_CONFIG, HF_ORGANIZATION_NAME: 'Imageomics' })).toContain('HF_ORGANIZATION_NAME');
    });

    it('errors when ORG_NAME is missing', () => {
        const { ORG_NAME: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('ORG_NAME');
    });

    it('errors when ORG_NAME is empty string', () => {
        expect(validateConfig({ ...VALID_CONFIG, ORG_NAME: '' })).toContain('ORG_NAME');
    });

    it('errors when CATALOG_REPO_NAME is missing', () => {
        const { CATALOG_REPO_NAME: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('CATALOG_REPO_NAME');
    });

    it('errors when CATALOG_REPO_NAME is empty string', () => {
        expect(validateConfig({ ...VALID_CONFIG, CATALOG_REPO_NAME: '' })).toContain('CATALOG_REPO_NAME');
    });

    it('errors when PLATFORM is missing', () => {
        const { PLATFORM: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('PLATFORM');
    });
    
    it('errors when PLATFORM is unrecognized', () => {
        const errors = validateConfig({ ...VALID_CONFIG, PLATFORM: 'blah' });
        expect(errors.some(e => e.includes('PLATFORM'))).toBe(true);
    });

    it('errors when API_BASE_URL is missing', () => {
        const { API_BASE_URL: _, ...config } = VALID_CONFIG;
        expect(validateConfig(config)).toContain('API_BASE_URL');
    });

    it('errors when REFRESH_INTERVAL_DAYS is null', () => {
        expect(validateConfig({ ...VALID_CONFIG, REFRESH_INTERVAL_DAYS: null })).toContain('REFRESH_INTERVAL_DAYS');
    });

    it('errors when ADDITIONAL_REPOS is not an array', () => {
        const errors = validateConfig({ ...VALID_CONFIG, ADDITIONAL_REPOS: 'repo/name' });
        expect(errors.some(e => e.includes('ADDITIONAL_REPOS'))).toBe(true);
    });

    it('errors when ADDITIONAL_HF_REPOS is not an array', () => {
        const errors = validateConfig({ ...VALID_CONFIG, ADDITIONAL_HF_REPOS: null });
        expect(errors.some(e => e.includes('ADDITIONAL_HF_REPOS'))).toBe(true);
    });

    it('errors when an ADDITIONAL_HF_REPOS entry is missing repo', () => {
        const config = {
            ...VALID_CONFIG,
            ADDITIONAL_HF_REPOS: [{ type: 'datasets' }],
        };
        const errors = validateConfig(config);
        expect(errors.some(e => e.includes('ADDITIONAL_HF_REPOS'))).toBe(true);
    });

    it('errors when an ADDITIONAL_HF_REPOS entry has an invalid type', () => {
        const config = {
            ...VALID_CONFIG,
            ADDITIONAL_HF_REPOS: [{ repo: 'imageomics/demo', type: 'notebooks' }],
        };
        const errors = validateConfig(config);
        expect(errors.some(e => e.includes('ADDITIONAL_HF_REPOS'))).toBe(true);
    });

    it('errors when COLORS is missing', () => {
        const { COLORS: _, ...config } = VALID_CONFIG;
        const errors = validateConfig(config);
        expect(errors.some(e => e.includes('COLORS'))).toBe(true);
    });

    it('errors when COLORS is missing sub-keys', () => {
        const config = {
            ...VALID_CONFIG,
            COLORS: { primary: '#92991c' },
        };
        const errors = validateConfig(config);
        expect(errors.some(e => e.includes('COLORS keys'))).toBe(true);
    });

    it('errors list includes all missing fields at once', () => {
        const config = {
            ADDITIONAL_REPOS: [],
            ADDITIONAL_HF_REPOS: [],
            COLORS: VALID_CONFIG.COLORS,
        };
        const errors = validateConfig(config);
        expect(errors).toContain('ORGANIZATION_NAME');
        expect(errors).toContain('HF_ORGANIZATION_NAME');
        expect(errors).toContain('ORG_NAME');
        expect(errors).toContain('CATALOG_REPO_NAME');
        expect(errors).toContain('PLATFORM');
        expect(errors).toContain('API_BASE_URL');
        expect(errors).toContain('REFRESH_INTERVAL_DAYS');
    });
});
