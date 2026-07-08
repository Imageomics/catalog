import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { load } from 'js-yaml';
import { validateConfig } from '../src/validateConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../public/config.yaml');

describe('public/config.yaml', () => {
    it('parses as a valid YAML object', () => {
        const raw = readFileSync(configPath, 'utf8');
        const config = load(raw);
        expect(config).toBeTruthy();
        expect(typeof config).toBe('object');
        expect(Array.isArray(config)).toBe(false);
    });

    it('passes all validation checks', () => {
        const config = load(readFileSync(configPath, 'utf8'));
        const errors = validateConfig(config);
        expect(errors).toEqual([]);
    });
});
