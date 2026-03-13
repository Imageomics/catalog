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
    "animal": [
        "animal", "animals"
    ],
    "acuity": [
        "bird acuity", "bird-acuity", "bird view", "bird-view",
        "butterfly acuity", "butterfly-acuity", "butterfly view", "butterfly-view"
    ],
    "amphibians": [
        "amphibian", "amphibians", "frog", "frogs", "toad", "toads"
    ],
    "birds": [
        "bird", "birds", "hawaiian birds", "hawaiian-birds", "hawaiian-honeycreeper",
        "endemic birds", "endemic-birds", "birdnet", "white-eye", "amakihi", "apapane", "omao", "kalij",
        "akala", "haha"
    ],
    "butterflies": [
        "butterfly", "butterflies", "lepidoptera", "heliconius",
        "heliconius erato", "heliconius melpomene", "erato", "melpomene",
        "forewings", "hindwings"
    ],
    "lab-bred": [
          "lab-bred", "lab bred", "cross types"
    ],      
    "mimicry": [
        "mimicry", "mullerian mimicry", "mullerian-mimicry", "mimic groups", "mimic-groups", "mimics"
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
        "insect", "insects", "moth", "moths", "wasp", "wasps"
    ],
    "mammals": [
        "mammal", "mammals",
        "african painted dog", "african-painted-dog", "dog",
        "baboon", "baboons",
        "giraffe", "giraffes",
        "lion", "lions",
        "onager", "persian onanger", "przewalski",
        "rodent", "rodents",
        "ungulate", "ungulates",
        "zebra", "zebras", "grevy's zebra", "grevy's", "grevys", "plains zebra"
    ],
    "zebras": [
        "zebra", "zebras", "grevy's zebra", "grevy's", "grevys", "plains zebra"
    ],

    // -------------------------------------------------------------------------
    // Behavior & Ecology
    // -------------------------------------------------------------------------
    "animal behavior": [
        "animal behavior", "animal-behavior", "animal-behavior-recognition",
        "behavior", "behavior recognition", "behavior-recognition",
        "behavioural ecology", "behavioural-ecology",
        "behavioral ecology", "behavioral-ecology",
        "time budget", "time-budget", "focal observation", "focal-observation"
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
        "wildlife monitoring", "wildlife-monitoring",
        "camera trap", "camera traps", "camera-trap", "camera-traps",
        "motion activated", "motion-activated", "motion triggered", "motion-triggered",
        "passive acoustic monitoring", "bioacoustics", "soundscape",
        "telemetry", "gps tracker", "gps-tracker"
    ],

    // -------------------------------------------------------------------------
    // Computer Vision & Machine Learning
    // -------------------------------------------------------------------------
    "computer vision": [
        "computer vision", "computer-vision", "cv", "vision",
        "biological visual task", "biological visual tasks"
    ],
    "image classification": [
        "image classification", "image-classification",
        "image recognition", "image-recognition",
        "species classification", "species-classification",
        "species identification", "species-identification"
    ],
    "fine-grained classification": [
        "fine-grained classification", "fine-grained-classification"
    ],
    "object detection": [
        "object detection", "object-detection",
        "animal detection", "animal-detection",
        "detection",
        "face detection", "face-detection",
        "tree seedling detection", "tree-seedling-detection",
        "hybrid detection", "hybrid-detection"
    ],
    "machine learning": [
        "machine learning", "applied machine learning", "ml",
        "deep learning", "deep-learning",
        "knowledge guided", "knowledge-guided",
        "knowledge guided machine learning", "knowledge-guided-machine-learning"
    ],
    "transformers": [
        "transformer", "transformers",
        "vision transformer", "vision-transformer",
        "vision transformers", "vision-transformers"
    ],
    "embeddings": [
        "embedding", "embeddings",
        "embedding exploration", "embedding-exploration",
        "feature extraction", "feature-extraction",
        "sentence transformers", "sentence-transformers",
        "sentence similarity", "sentence-similarity",
        "similarity search", "similarity-search",
        "faiss"
    ],
    "zero-shot": [
        "zero shot", "zero-shot",
        "zero shot image classification", "zero-shot-image-classification",
        "zero shot text retrieval", "zero-shot-text-retrieval"
    ],
    "image": [
        "image", "images"
    ],

    // -------------------------------------------------------------------------
    // Explainability & Interpretability
    // -------------------------------------------------------------------------
    "explainable ai": [
        "xai", "explainable ai", "explainable-ai",
        "interpretable ai", "interpretable-ai",
        "interpretable machine learning", "interpretable-machine-learning",
        "interpretable", "interpretability", "interpretation",
        "counterfactual explanations", "counterfactual-explanations",
        "class activation maps", "class-activation-maps",
        "saliency map", "saliency-map", "saliency-maps"
    ],

    // -------------------------------------------------------------------------
    // Data & Datasets
    // -------------------------------------------------------------------------
    "annotations": [
        "annotation", "annotations", "label", "captions",
        "synthetic captions", "synthetic-captions"
    ],
    "benchmarks": [
        "benchmark", "benchmarks", "benchmarking", "evaluation",
        "ml challenge", "ml-challenge"
    ],
    "data management": [
        "data management", "data-management", "metadata", "provenance", "checksums", "deduplication",
        "dataset documentation", "dataset-documentation",
        "file verification", "file-verification",
        "data validation", "data-validation",
        "metadata standards", "metadata-standards",
        "standards", "metadata generation", "metadata-generation"
    ],
    "data validation": [
        "provenance", "checksums", "deduplication",
        "file verification", "file-verification",
        "data validation", "data-validation"
    ],
    "exploratory data analysis": [
        "eda", "exploratory data analysis", "exploratory-data-analysis",
        "data exploration", "data-exploration", "data-explorer",
        "exploratory data visualizations", "exploratory-data-visualizations"
    ],
    "museum specimens": [
        "museum specimen", "museum specimens",
        "museum images", "museum-images",
        "pinned specimen", "pinned specimens", "pinned-specimens",
        "specimen images", "specimen-images",
        "scan samples", "scan-samples",
        "specimen", "specimen records", "specimen-records"
    ],
    "visualization": [
        "visualization", "visualizations",
        "data visualization", "data-visualization",
        "visual analytics", "visual-analytics",
        "interactive",
        "hdf5 visualization", "hdf5-visualization",
        "image exploration", "image-exploration",
        "image preview", "image-preview"
    ],

    // -------------------------------------------------------------------------
    // Taxonomy, Phylogenetics & Traits
    // -------------------------------------------------------------------------
    "phylogenetics": [
        "phylogenetics", "phylogeny", "phylogenetic trees", "phylogenetic-trees"
    ],
    "taxonomy": [
        "taxonomy", "taxonomic resolution", "taxonomic-resolution", "ontology", "phenoscape", "hierarchy",
        "tree-of-life", "tree of life", "treeoflife"
    ],
    "tree of life": [
        "tree-of-life", "tree of life", "treeoflife"
    ],
    "traits": [
        "trait", "traits",
        "trait detection", "trait-detection",
        "trait identification", "trait-identification",
        "trait segmentation", "trait-segmentation",
        "trait masking", "trait-masking",
        "trait swapping", "trait-swapping",
        "trait grounding", "trait counting", "trait referring",
        "wing segmentation", "wing-segmentation",
        "forewings", "hindwings",
        "elytra", "elytra length", "elytra width",
        "basal pronotum", "greenness",
        "morphometrics", "measurements"
    ],

    // -------------------------------------------------------------------------
    // Plants & Habitat
    // -------------------------------------------------------------------------
    "forest": [
        "cloud forest", "cloud-forest",
        "understory", "hawaiian forest", "hawaiian-forest"
    ],
    "hawaiian plants": [
        "acacia koa", "koa", "o'hia", "ohelo", "pilo", "pukiawe",
        "clidemia hirta", "small leaf kolea", "small-leaf-kolea",
        "hawaiian forest", "hawaiian-forest"
    ],
    "trees": [
        "tree", "trees", "tree planting", "tree-planting",
        "tree seedling detection", "tree-seedling-detection",
        "acacia koa", "koa", "o'hia", "pilo"
    ],

    // -------------------------------------------------------------------------
    // Conservation & Biodiversity
    // -------------------------------------------------------------------------
    "biodiversity": [
        "biodiversity", "conservation", "restoration",
        "endangered species", "rare species", "rare-species",
        "invasive species", "invasive-species",
        "invasive mammals", "invasive-mammals",
        "endemic species", "endemic-species"
    ],

    // -------------------------------------------------------------------------
    // Geospatial & Remote Sensing
    // -------------------------------------------------------------------------
    "drones": [
        "drone", "drones", "drone videos", "drone-videos", "uav"
    ],
    "geospatial": [
        "geospatial", "geodata", "gis",
        "satellite imagery", "satellite-imagery",
        "aerial", "aerial imagery", "aerial-imagery",
        "mapping", "location", "map view", "map-view"
    ],

    // -------------------------------------------------------------------------
    // Open Science & Tools
    // -------------------------------------------------------------------------
    "open science": [
        "open science", "open-science", "open source", "open-source",
        "fair", "reproducibility",
        "reproducible research", "reproducible-research"
    ],
    "tools": [
        "api", "api integration", "api-integration",
        "cli", "command line interface", "command-line-interface",
        "pipelines", "workflow automation", "workflow-automation", "snakemake",
        "containerization", "containerization with docker", "containerization-with-docker",
        "version control", "version-control"
    ],
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    "love data week": [
        "ldw24", "ldw25", "ldw26", "lovedataweek"
    ]

};
