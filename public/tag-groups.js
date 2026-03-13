// Tag Groups Configuration for Catalog
//
// Customize these tag groups for your organization.
// Each entry maps a canonical display tag (the key) to an array of raw tags
// (from GitHub topics and/or Hugging Face card metadata) that should be
// treated as equivalent and grouped under that canonical tag.
//
// How it works:
//   - The canonical tag (key) is what appears in the tag filter dropdown.
//   - Any raw tag in the aliases array (value) will be normalized to the canonical tag.
//   - Tags not listed here pass through unchanged.
//   - Tags containing a colon (e.g. "format:parquet", "license:mit") are
//     automatically filtered out as Hugging Face system metadata.
//

const TAG_GROUPS = {

    // -------------------------------------------------------------------------
    // Animal Groups
    // -------------------------------------------------------------------------
    "birds": [
        "bird", "birds", "hawaiian birds", "hawaiian-honeycreeper", "endemic-birds",
        "birdnet", "white-eye", "amakihi", "apapane", "omao", "kalij"
    ],
    "butterflies": [
        "butterfly", "butterflies", "lepidoptera", "heliconius",
        "heliconius erato", "heliconius melpomene", "erato", "melpomene",
        "forewings", "hindwings"
    ],
    "mimicry": [
        "mimicry", "mullerian-mimicry", "mimic groups", "mimics"
    ],
    "fish": [
        "fish", "nj fish"
    ],
    "giraffes": [
        "giraffe", "giraffes"
    ],
    "ground beetles": [
        "ground beetles", "ground-beetles", "carabidae", "beetles"
    ],
    "insects": [
        "insect", "insects", "moths", "wasps"
    ],
    "zebras": [
        "zebra", "zebras", "grevy's zebra", "grevy's", "grevys", "plains zebra"
    ],

    // -------------------------------------------------------------------------
    // Behavior & Ecology
    // -------------------------------------------------------------------------
    "animal behavior": [
        "animal behavior", "animal-behavior", "animal-behavior-recognition",
        "behavior", "behavior recognition", "behavioural-ecology", "behavioral-ecology",
        "behavioral ecology", "time-budget", "focal-observation"
    ],
    "evolution": [
        "evolution", "evolutionary biology", "evolutionary-biology"
    ],
    "phenology": [
        "phenology", "phenologies", "plant phenology", "plant-phenology"
    ],
    "functional traits": [
        "functional trait", "functional traits", "functional-trait", "functional-traits"
    ],
    "wildlife monitoring": [
        "wildlife monitoring", "wildlife-monitoring", "camera traps", "camera-trap",
        "camera-traps", "motion-activated", "motion-triggered",
        "passive acoustic monitoring", "bioacoustics", "soundscape",
        "telemetry", "gps-tracker"
    ],

    // -------------------------------------------------------------------------
    // Computer Vision & Machine Learning
    // -------------------------------------------------------------------------
    "computer vision": [
        "computer vision", "computer-vision", "cv", "vision",
        "biological visual task"
    ],
    "image classification": [
        "image classification", "image-classification", "image-recognition",
        "species classification", "species-classification", "species-identification"
    ],
    "fine-grained classification": [
        "fine-grained classification", "fine-grained-classification"
    ],
    "object detection": [
        "object detection", "object-detection", "animal detection", "animal-detection",
        "detection", "face-detection", "tree-seedling-detection", "hybrid-detection"
    ],
    "machine learning": [
        "machine learning", "applied machine learning", "ml", "deep-learning",
        "deep learning", "knowledge-guided", "knowledge-guided-machine-learning"
    ],
    "transformers": [
        "transformer", "transformers", "vision-transformer", "vision-transformers"
    ],
    "embeddings": [
        "embedding", "embeddings", "embedding-exploration", "feature-extraction",
        "sentence-transformers", "sentence-similarity", "similarity-search", "faiss"
    ],
    "zero-shot": [
        "zero-shot", "zero-shot-image-classification", "zero-shot-text-retrieval"
    ],

    // -------------------------------------------------------------------------
    // Explainability & Interpretability
    // -------------------------------------------------------------------------
    "explainable ai": [
        "xai", "explainable-ai", "interpretable-ai", "interpretable-machine-learning",
        "interpretable", "interpretability", "interpretation",
        "counterfactual-explanations", "class-activation-maps",
        "saliency map", "saliency-map", "saliency-maps"
    ],

    // -------------------------------------------------------------------------
    // Data & Datasets
    // -------------------------------------------------------------------------
    "annotations": [
        "annotation", "annotations", "label", "captions", "synthetic-captions"
    ],
    "benchmarks": [
        "benchmarks", "benchmarking", "evaluation", "ml-challenge"
    ],
    "data management": [
        "data-management", "metadata", "provenance", "checksums", "deduplication",
        "dataset-documentation", "file-verification", "data-validation",
        "metadata-standards", "standards", "metadata generation"
    ],
    "exploratory data analysis": [
        "eda", "exploratory-data-analysis", "data-exploration", "data-explorer",
        "exploratory-data-visualizations"
    ],
    "museum specimens": [
        "museum specimen", "museum specimens", "museum-images",
        "pinned specimens", "pinned-specimens", "specimen-images",
        "scan-samples", "specimen", "specimen-records"
    ],
    "visualization": [
        "visualization", "visualizations", "data-visualization", "visual-analytics",
        "interactive", "hdf5-visualization", "image-exploration", "image-preview"
    ],

    // -------------------------------------------------------------------------
    // Taxonomy, Phylogenetics & Traits
    // -------------------------------------------------------------------------
    "phylogenetics": [
        "phylogenetics", "phylogeny", "phylogenetic-trees"
    ],
    "taxonomy": [
        "taxonomy", "taxonomic-resolution", "ontology", "phenoscape", "hierarchy"
    ],
    "traits": [
        "trait", "traits", "trait-detection", "trait-identification",
        "trait identification", "trait-segmentation", "trait-masking",
        "trait-swapping", "trait grounding", "trait counting", "trait referring",
        "wing-segmentation", "morphometrics", "measurements"
    ],

    // -------------------------------------------------------------------------
    // Conservation & Biodiversity
    // -------------------------------------------------------------------------
    "biodiversity": [
        "biodiversity", "conservation", "restoration",
        "endangered species", "rare species", "rare-species",
        "invasive species", "invasive-species", "invasive-mammals",
        "endemic-species"
    ],

    // -------------------------------------------------------------------------
    // Geospatial & Remote Sensing
    // -------------------------------------------------------------------------
    "drones": [
        "drone", "drones", "drone-videos", "uav"
    ],
    "geospatial": [
        "geospatial", "geodata", "gis", "satellite-imagery", "aerial",
        "aerial-imagery", "mapping", "location", "map-view"
    ],

    // -------------------------------------------------------------------------
    // Open Science & Tools
    // -------------------------------------------------------------------------
    "open science": [
        "open-science", "open-source", "fair", "reproducibility",
        "reproducible-research"
    ],
    "tools": [
        "api", "api-integration", "cli", "command-line-interface",
        "pipelines", "workflow-automation", "snakemake",
        "containerization", "containerization-with-docker", "version-control"
    ],

};
