// tests/fetchHfRepos.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHfRepos } from '../../src/api/fetchHfRepos.js';
import { handleError } from '../../src/ui/render.js';

// Mock the internal dependencies
vi.mock('../../src/utils/normalizeTag.js', () => ({
    normalizeTag: vi.fn((tag) => [tag.toLowerCase()])
}));

vi.mock('../../src/ui/render.js', () => ({
    handleError: vi.fn()
}));

vi.mock('../../src/utils/filterNewAdditionalEntries.js', () => ({
    // Pass the additional entries straight through
    filterNewAdditionalEntries: vi.fn((existingIds, additional) =>
        additional.filter(entry => !existingIds.has(entry.repo)))
}));

describe('fetchHfRepos', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        // Reset the fetch mock before each test
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    const apiBaseUrl = 'https://huggingface.co/api/';
    const hfOrgName = 'test-org';
    const refreshIntervalDays = 30;

    // Generate reliable relative timestamps so tests don't break as time passes
    const now = new Date();
    const recentDateISO = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();   // 2 days ago
    const oldDateISO = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();    // 45 days ago
    const oldestDateISO = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago

    // Test fetching datasets and checking the "new" flag based on creation date
    it('fetches datasets and flags new repositories as expected', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([
                {
                    id: 'test-org/new-dataset',
                    createdAt: recentDateISO,
                    lastModified: recentDateISO,
                    likes: 10,
                    tags: ['nlp']
                },
                {
                    id: 'test-org/old-dataset',
                    createdAt: oldestDateISO,
                    lastModified: oldDateISO,
                    likes: 5,
                    tags: ['vision']
                }
            ])
        });

        const items = await fetchHfRepos(
            'datasets',
            [],
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        expect(items).toHaveLength(2);
        // new dataset expected values
        expect(items[0].id).toBe('test-org/new-dataset');
        expect(items[0].repoType).toBe('datasets');
        expect(items[0].likes).toBe(10);
        expect(items[0].tags).toContain('nlp');
        expect(items[0].isNew).toBe(true);
        // old dataset expected values
        expect(items[1].id).toBe('test-org/old-dataset');
        expect(items[1].repoType).toBe('datasets');
        expect(items[1].likes).toBe(5);
        expect(items[1].tags).toContain('vision');
        expect(items[1].isNew).toBe(false);
    });

    it('fetches datasets as expected without secondary detail fetch', async () => {
        // Setup mock response for the main org datasets
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([{
                id: 'test-org/dataset-1',
                createdAt: recentDateISO, // 1 month ago
                lastModified: now.toISOString(),
                tags: ['nlp', 'task:text-classification'],
                cardData:
                {
                    pretty_name: 'Dataset 1',
                    description: 'Test dataset'
                }
            }])
        });

        const items = await fetchHfRepos(
            'datasets',
            [], // No additional repos
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}datasets?author=${hfOrgName}&full=true`);
        expect(items).toHaveLength(1);
        expect(items[0].repoType).toBe('datasets');
        expect(items[0].tags).toContain('nlp');
        expect(items[0].cardData.pretty_name).toBe('Dataset 1');
        expect(items[0].cardData.description).toBe('Test dataset');

        // Assert dates are correctly converted to Date objects
        expect(items[0].createdAt).toBeInstanceOf(Date);
        expect(items[0].lastModified).toBeInstanceOf(Date);
    });

    it('makes secondary fetch calls when fetching models to get full details', async () => {
        // We need a custom mock implementation because models trigger sequential fetch calls
        global.fetch.mockImplementation((url) => {
            if (url.includes('models?author=')) {
                // Return the initial summary list
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ id: 'test-org/model-1' }])
                });
            }
            if (url.includes('models/test-org/model-1')) {
                // Return the detailed model data
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'test-org/model-1',
                        createdAt: now.toISOString(), // Simulating a brand new model
                        lastModified: now.toISOString(),
                        cardData:
                        {
                            model_name: 'Model 1',
                            model_description: 'Test model',
                            tags: ['vision']
                        }
                    })
                });
            }
        });

        const items = await fetchHfRepos(
            'models',
            [],
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        // It should have called the main endpoint and the specific model endpoint
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}models/test-org/model-1`);

        expect(items).toHaveLength(1);
        expect(items[0].isNew).toBe(true);
        expect(items[0].tags).toContain('vision');
        expect(items[0].cardData.model_name).toBe('Model 1');
        expect(items[0].cardData.model_description).toBe('Test model');
    });

    // Test that the function handles partial failures gracefully
    it('survives partial failures if one model secondary fetch fails but another succeeds', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('models?author=')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        { id: 'test-org/good-model' },
                        { id: 'test-org/broken-model' }
                    ])
                });
            }
            if (url.includes('models/test-org/good-model')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'test-org/good-model',
                        createdAt: recentDateISO,
                        lastModified: recentDateISO
                    })
                });
            }
            if (url.includes('models/test-org/broken-model')) {
                // Simulate a broken/missing resource detail
                return Promise.resolve({ ok: false, status: 404 });
            }
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const items = await fetchHfRepos(
            'models',
            [],
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        // The broken model should be cleanly filtered out by detailedItems.filter(Boolean)
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('test-org/good-model');
        expect(items[0].isNew).toBe(true);
        expect(items[0].repoType).toBe('models');

        // Ensure the error was logged for the broken model
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(
            'Failed to fetch details for test-org/broken-model'
        ));

        consoleSpy.mockRestore();
    });

    // Test that additional repos are fetched and merged correctly
    it('fetches additional Hugging Face repos and merges them', async () => {
        const additionalHfRepos = [
            { type: 'spaces', repo: 'external-user/cool-space' },
            { type: 'spaces', repo: 'test-org/space-1' } // Already in org, should be ignored
        ];

        global.fetch.mockImplementation((url) => {
            if (url.includes('spaces?author=')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{
                        id: 'test-org/space-1',
                        createdAt: recentDateISO,
                        lastModified: recentDateISO
                    }])
                });
            }
            if (url.includes('spaces/external-user/cool-space')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'external-user/cool-space',
                        createdAt: oldDateISO,
                        lastModified: recentDateISO
                    })
                });
            }
        });

        const items = await fetchHfRepos(
            'spaces',
            additionalHfRepos,
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        // 1 for org spaces, 1 for additional space, duplicate not fetched again
        expect(items).toHaveLength(2);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}spaces/external-user/cool-space`);
        expect(global.fetch).toHaveBeenCalledWith(`${apiBaseUrl}spaces?author=${hfOrgName}&full=true`);

        expect(items[0].id).toBe('test-org/space-1');
        expect(items[0].repoType).toBe('spaces');
        expect(items[0].isNew).toBe(true);

        expect(items[1].id).toBe('external-user/cool-space');
        expect(items[1].repoType).toBe('spaces');
        expect(items[1].isNew).toBe(false);
    });

    // Test that network errors in fetching additional repos are handled gracefully
    it('logs warnings and ignores external additional repo if its fetch throws a network error', async () => {
        const additionalHfRepos = [{ type: 'datasets', repo: 'external-user/broken-additional' }];

        global.fetch.mockImplementation((url) => {
            if (url.includes('datasets?author=')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{
                        id: 'test-org/dataset-1',
                        createdAt: recentDateISO,
                        lastModified: recentDateISO
                    }])
                });
            }
            if (url.includes('datasets/external-user/broken-additional')) {
                // Hard crash fetch
                return Promise.reject(new Error('Network disconnected'));
            }
        });

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const items = await fetchHfRepos(
            'datasets',
            additionalHfRepos,
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        // System should catch the error safely, remain un-crashed, and return just the internal dataset
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('test-org/dataset-1');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Network error fetching additional HF repo "external-user/broken-additional":'),
            expect.any(Error)
        );

        consoleWarnSpy.mockRestore();
    });

    it('handles network errors gracefully', async () => {
        // Force the main fetch to fail
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const items = await fetchHfRepos(
            'datasets',
            [],
            apiBaseUrl,
            hfOrgName,
            refreshIntervalDays
        );

        expect(items).toEqual([]);
        expect(handleError).toHaveBeenCalled();
    });
});
