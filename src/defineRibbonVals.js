/**
 * A collection of platform-specific display information (e.g., SVG path data)
 * for code developer platforms including GitHub, pending: GitLab and Codeberg.
 * Used for linking to repo and rendering icon and platform name in the ribbon component of the UI.
 * All paths are optimized for a 0 0 24 24 viewBox.
 */

const platforms = {
  github: {
    path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
    viewBox: "0 0 24 24",
    color: "#181717",
    displayName: "GitHub",
    ribbonUrl: "https://github.com/"
  },
  // gitlab: {
  //   path: "m23.71 11.83-2.13-6.52a.89.89 0 0 0-1.7 0l-2.13 6.52H6.25L4.12 5.31a.89.89 0 0 0-1.7 0L.29 11.83a1 1 0 0 0 .37 1.13l11.34 8.24 11.34-8.24a1 1 0 0 0 .37-1.13Z",
  //   viewBox: "0 0 24 24",
  //   color: "#FC6D26",
  //   displayName: "GitLab",
  //   ribbonUrl: "https://gitlab.com/"
  //},
  // codeberg: {
  //   path: "M12.004 2.378a.636.636 0 0 0-.547.31L1.258 19.874a.636.636 0 0 0 .547.954h1.94c.143 0 .278-.074.354-.197L12 6.544l7.89 14.087a.406.406 0 0 0 .354.197h2.012a.636.636 0 0 0 .546-.954L12.551 2.688a.636.636 0 0 0-.547-.31Z",
  //   viewBox: "0 0 24 24",
  //   color: "#2185d0",
  //   displayName: "Codeberg",
  //   ribbonUrl: "https://codeberg.org/"
  //}
};

/**
 * Utility function to get the full platform display information
 * @param {string} platform - 'github', 'gitlab', or 'codeberg'
 * @returns {object|null}
 */
export function getPlatformDisplay(platform) {
  return platforms[platform.toLowerCase()];
}
