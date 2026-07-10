/**
 * A collection of platform-specific display information (e.g., SVGs and URLs)
 * for code developer platforms including GitHub and Codeberg, pending: GitLab.
 * Used for linking to repo and rendering icon and platform name in the ribbon component of the UI.
 *
 * Usage: import { getPlatformDisplay } from './defineRibbonVals.js';
 *
 * Input: platform (e.g., 'github'), defined from config.yaml and passed to this function.
 * Output: platformDisplays[platform] = { svg: CODE_PLATFORM_SVG,
 *                                        displayName: DISPLAY_NAME, ribbonUrl: RIBBON_URL }
 */

import githubSvg from '../assets/GitHub_Invertocat.svg?raw';
// import gitlabSvg from '../assets/gitlab-logo-700-rgb.svg?raw';
import codebergSvg from '../assets/codeberg-logo_icon_white.svg?raw';

/**
 * Utility function to get the full platform display information
 * @param {string} platform - 'github', 'gitlab', or 'codeberg'
 * @returns {object|null}
 */
export function getPlatformDisplay(platform) {
    const platformDisplays = {
        github: {
            svg: githubSvg,
            displayName: "GitHub",
            ribbonUrl: "https://github.com/"
        },
        // gitlab: {
        //   svg: gitlabSvg,
        //   displayName: "GitLab",
        //   ribbonUrl: "https://gitlab.com/"
        //},
        codeberg: {
          svg: codebergSvg,
          displayName: "Codeberg",
          ribbonUrl: "https://codeberg.org/"
        }
      };
    return platformDisplays[platform.toLowerCase()];
}
