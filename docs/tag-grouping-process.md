# Tag Grouping Process

## What Are Tag Groups?

Tags on GitHub repos (topics) and Hugging Face repos (card metadata) are free-form text, so
the same concept often appears under multiple spellings: `computer-vision`, `computer vision`,
`cv`. Tag groups normalize this noise so the catalog filter dropdown shows one clean canonical
tag instead of a dozen near-duplicates.

Tag groups live in **`public/tag-groups.js`** as a plain JavaScript object:

```js
const TAG_GROUPS = {
    "canonical tag": ["raw-tag-1", "raw tag 2", "raw_tag_3"],
    ...
};
```

- The **key** (`"canonical tag"`) is the display tag shown in the UI filter dropdown.
- The **value array** lists every raw API tag that should be normalized to that key.
- Raw tags not present in any array pass through unchanged and appear as-is in the UI.
- Raw tags that contain a colon (e.g. `license:mit`, `format:parquet`) are automatically
  filtered out as Hugging Face system metadata so they never reach the UI. This can be changed in [main.js](../main.js), in the `normalizeTag` function.

---

## Initial Setup

When first setting up a catalog from this template you will need to build your custom, `public/tag-groups.js`.
For the weekly scan to be useful, you need to build an
initial set of tag groups from your organization's existing tags.

**Step 1 — Generate the full tag list:**

```console
node scripts/export-tags.js
```

This writes every raw tag currently used across your GitHub and Hugging Face repos to
`scripts/tag-export.txt`. Commit that file to `main`, it becomes the baseline all future
weekly diffs compare against.

**Step 2 — Build the initial `tag-groups.js`:**

With a fresh catalog you'll likely have dozens or hundreds of raw tags to group all at once.
Our experience: feeding the full `tag-export.txt` into an AI assistant (we used Claude's Sonnet 4.6)
produced a solid first draft of canonical groups quickly. However, it needed significant
manual review - the AI tended to miss obvious groupings like singular/plural pairs (`image` and
`images`) and sometimes invented canonical names that didn't match how
the tags were actually used.

Our recommendation: **use AI output as a springboard, not a final answer.** Let it handle the
bulk of the structural work, then go through the result yourself with the raw tag list open
side-by-side. Pay particular attention to:

- Singular/plural variants (`specimen` / `specimens`, `annotation` / `annotations`)
- Hyphenated vs. space-separated forms (`animal-behavior` / `animal behavior`)
- Acronyms and their expansions (`cv` / `computer vision`, `xai` / `explainable ai`)
- Closely related concepts that warrant separate canonical tags vs. one broader group

The manual pass is where the most value comes from.

---

## When to Update Tag Groups

A GitHub Actions workflow runs every Monday at 08:00 UTC. It fetches all current raw tags from
the GitHub and Hugging Face APIs, diffs them against the committed baseline in
`scripts/tag-export.txt`, and opens (or updates) a pull request titled
**`[Tag Scan] New tags detected — review tag-groups.js`** whenever 5 or more new tags appear.

You should update `public/tag-groups.js` when that PR is opened or updated.

---

## Step-by-Step Instructions

1. **Open the Tag Scan PR** — find it in the repo's Pull Requests tab (title starts with
   `[Tag Scan]`). The PR body lists every raw tag that is new relative to `scripts/tag-export.txt`.

2. **Open `public/tag-groups.js`** in an editor.

3. **For each new tag in the list, decide:**

   | Situation | Action |
   |-----------|--------|
   | It's a variant of an existing concept (e.g. `bird-detection` when `object detection` exists) | Add the raw tag to the existing group's array |
   | It represents a genuinely new concept with no matching group | Add a new key + array, under the appropriate section comment |
   | It's noise (a HuggingFace system tag that slipped through, a typo, a one-off) | Ignore it — no change needed |

4. **Commit the updated `tag-groups.js` to the PR branch** (`tag-scan/auto`).

5. **Merge the PR** once all tags are addressed.

---

## Running the Export Script Manually

To generate a fresh snapshot of all current raw tags outside of the weekly workflow:

```console
node scripts/export-tags.js
```

Output is written to `scripts/tag-export.txt` (one tag per line, sorted, deduplicated).
This is also the baseline file the weekly workflow diffs against, so if you run the script and
commit the result to `main`, subsequent scans will compare against that new baseline.
