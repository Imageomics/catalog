# Imageomics Catalog

Repository for Imageomics data, model, and code catalog.

This project is being initialized with the help of Gemini 2.5, accessed [through OSU](https://ai.osu.edu/faculty-staff-students/approved-ai-tools).

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

To run this application, simply ensure that all three files (`index.html`, `style.css`, and `main.js`) are located in the same directory. You can then open the `index.html` file directly in a web browser.

For hosting on a platform like GitHub Pages, you just need to upload these three files to your repository and enable the Pages feature.
