// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseUrlParams, updateUrlParams, getCurrentState } from '../../src/ui/urlManager.js';

describe('urlManager with jsdom environment', () => {
    // Reset the DOM and URL state before each test to ensure isolation
    beforeEach(() => {
        document.body.innerHTML = '';
        window.history.replaceState(null, '', '/');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    // Test URL parsing with both query and hash parameters, ensuring query takes precedence
    it('parses URL params, prioritizing search query over hash', () => {
        window.history.replaceState(null, '', '/?type=models&q=fish#type=datasets');

        const params = parseUrlParams();

        // ?type=models should override #type=datasets
        expect(params).toEqual({ type: 'models', q: 'fish' });
    });

    // Test URL state sync
    it('updates URL params without refreshing the page', () => {
        const mockState = {
            type: 'datasets',
            q: 'nlp',
            sort: 'lastModified',
            tag: '',
            archived: 'active'
        };

        // Spy on replaceState to verify the function call signature
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

        updateUrlParams(mockState);

        // Only non-default values should end up in the hash/search string
        expect(replaceStateSpy).toHaveBeenCalledWith(
            null,
            '',
            '/#type=datasets&q=nlp'
        );
        expect(window.location.hash).toBe('#type=datasets&q=nlp');
    });

    it('clears or avoids adding default values to the URL hash completely', () => {
        // Start with a populated URL string
        window.history.replaceState(null, '', '/#type=datasets&q=nlp');

        const defaultState = {
            type: 'all',
            q: '',
            sort: 'lastModified',
            tag: '',
            archived: 'active'
        };

        updateUrlParams(defaultState);

        // All defaults means hash string gets completely wiped out
        expect(window.location.hash).toBe('');
    });

    // Test dynamic state retrieval from DOM elements, simulating user input
    it('maps active DOM values correctly into a state matrix via getCurrentState', () => {
        // Inject real HTML nodes into JSDOM's virtual container layout
        document.body.innerHTML = `
            <select id="repoType"><option value="spaces" selected>Spaces</option></select>
            <input id="searchInput" value="image segmentation" />
            <select id="sortBy"><option value="stars" selected>Stars</option></select>
            <select id="tagFilter"><option value="pytorch" selected>PyTorch</option></select>
            <select id="archiveFilter"><option value="all" selected>All</option></select>
        `;

        const activeState = getCurrentState();

        expect(activeState).toEqual({
            type: 'spaces',
            q: 'image segmentation',
            sort: 'stars',
            tag: 'pytorch',
            archived: 'all'
        });
    });

    it('safely handles missing or empty DOM elements by applying built-in defaults', () => {
        // Leaving document.body empty tests fallback properties
        document.body.innerHTML = '';

        const defaultState = getCurrentState();

        expect(defaultState).toEqual({
            type: 'all',
            q: '',
            sort: 'lastModified',
            tag: '',
            archived: 'active'
        });
    });
});
