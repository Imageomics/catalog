# Imageomics Catalog [![DOI](https://zenodo.org/badge/1054290236.svg)](https://doi.org/10.5281/zenodo.17602801)

Repository for web-based Imageomics code, data, model, and spaces catalog. This catalog is designed to use the GitHub API for searching all code repositories created under the [Imageomics GitHub Organization](https://github.com/Imageomics) and the Hugging Face API for searching all dataset, model, and spaces repositories created under the [Imageomics Hugging Face Organization](https://huggingface.co/imageomics).

This project was initialized with the help of Gemini 2.5, accessed [through OSU](https://ai.osu.edu/faculty-staff-students/approved-ai-tools). In addition to speeding up the development of this site, I was curious about how much Gemini could do and where it would falter; see the [full prompt/discussion](catalog-generation-prompt-Gemini2.5Flash.md) for more information.

## Features

The website is styled using the [tailwindcss](https://tailwindcss.com/) pacakge.

* **Real-time Data Fetching:** Displays all public Imageomics repositories, fetched through the GitHub and Hugging Face APIs. Includes a "New" badge for products created within the last 30 days; for older repos, star (⭐️) or like (❤️) counts are included for GitHub or Hugging Face repos, respectively.
* **Search Functionality:** Quickly find items by keyword.
* **Filtering:** Filter by repository type (Code, Datasets, Models, Spaces) and tags.
* **Sorting:** Sort items by last updated, date created, stars/likes ascending or descending, or alphabetically.
* **URL Parameter Support:** Persist and share search states via URL hash (`#type=datasets&q=fish`) or query parameters (`?type=datasets`). Supports `type`, `q` (search query), `sort`, and `tag` parameters.
* **Responsive Design:** The layout is optimized for use on computers and mobile devices.
* **Thematic Styling:** Uses Imageomics color scheme for a cohesive look and feel.
* **Longevity:** This site is run through GitHub Pages, ensuring continued access through GitHub without needing to otherwise provision dedicated infrastructure.

## Project Structure

The site runs based on three primary files:

* `index.html`: The main HTML file that provides the structure of the webpage and links to the CSS and JavaScript files, though it still has some manual color/style definitions.
* `style.css`: Custom styling for the application, including color schemes, layout, and animations.
  * **Note:** Color defined in `index.html` for specific portions of the site will overwrite those defined in this file.
* `main.js`: Handles the application's logic, including API calls, data filtering, sorting, and dynamic rendering of the catalog items.
  * **Note:** Model API calls do ***not*** return `cardData` unless explicitly fetched *by model*, so there is extra logic required to fetch Model metadata. This was not accounted for until [commit a8d3000](https://github.com/Imageomics/catalog/commit/a8d30009f58a11e708f36d54b9bf4a228bdf1538), as it took updates related to issue #3 to discover.

  ### Formatting Standard

  * **What is needed:** VS Code "Format on Save" enabled with CSS & HTML format enabled.
  * **Indent Size:** 4
  * **Wrap Line Length:** 120
  * **Rules:** Remove trailing whitespace and empty tabs.

## Local Testing

In the repo root, run

```console
python -m http.server 8080
```

Then open <http://[::]:8080/> in your browser of choice.

## Note on Debugging with Gemini

It is important to provide the relevant code and preface with something along the lines of:

> Based on this project, without changing the structure of existing code more than necessary for efficient design, can you identify...

Then ask for a plan of how to reolve the issue. In my debugging experience, it did not demonstrate the ability to recognize or distinguish between a fix of "robustness" to handle outliers (which already existed at the precise location to which it pointed) and actually fixing the code to get the information that should have been fetched. Additionally, it has a tendency to rewrite an entire function and forget about tasks that are done in that function that are not *directly* related to the bug it is attempting to fix.
