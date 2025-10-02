# Imageomics Catalog

Repository for Imageomics data, model, spaces, and code catalog.

This project was initialized with the help of Gemini 2.5, accessed [through OSU](https://ai.osu.edu/faculty-staff-students/approved-ai-tools). In addition to speeding up the development of this site, I was curious about how much Gemini could do and where it would falter; see the [full prompt/discussion](catalog-generation-prompt-Gemini2.5Flash.md) for more information.

# Project Description from Gemini:

## Imageomics Hugging Face Catalog

This is a web-based catalog designed to explore public datasets, models, and spaces from the Hugging Face Hub, specifically for the Imageomics organization.

The application is built using a modern, modularized approach with a clean, responsive design.

### Features

* **Real-time Data Fetching:** Displays the latest public repositories directly from the Hugging Face API.  
* **Search Functionality:** Quickly find items by keyword.  
* **Filtering:** Filter by repository type (Datasets, Models, Spaces) and tags.  
* **Sorting:** Sort items by last updated, date created, or alphabetically.  
* **Responsive Design:** The layout is optimized for viewing on all devices, from mobile phones to desktops.  
* **Thematic Styling:** Styled with Imageomics' official brand colors for a cohesive look and feel.

### File Structure

The project has been refactored into three separate files for improved organization and maintainability:

* `index.html`: The main HTML file that provides the structure of the webpage and links to the CSS and JavaScript files.  
* `style.css`: Contains all the custom styling for the application, including color schemes, layout, and animations.  
* `main.js`: Handles all the application's logic, including API calls, data filtering, sorting, and dynamic rendering of the catalog items.

### How to Run

For local testing, run

```console
python -m http.server 8080
```

Then open <http://[::]:8080/> in your browser of choice.

For hosting on a platform like GitHub Pages, you just need to upload these three files to your repository and enable the Pages feature.
