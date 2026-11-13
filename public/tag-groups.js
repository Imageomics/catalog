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
    // Organisms
    // -------------------------------------------------------------------------
    "animals": [
        "animal", "animals"
    ],
    "beetles": [
        "beetle", "beetles"
    ],
    "birds": [
        "bird", "birds"
    ],
    "butterflies": [
        "butterfly", "butterflies"
    ],
    "dogs": [
        "dog", "dogs"
    ],
    "giraffes": [
        "giraffe", "giraffes"
    ],
    "grevy's": [
        "grevy's", "grevys"
    ],
    "carabidae": [
        "ground beetle", "ground beetles", "ground-beetle", "ground-beetles",
        "carabidae", "carabid"
    ],
    "trees": [
        "tree", "trees"
    ],
    "zebras": [
        "zebra", "zebras"
    ],

    // -------------------------------------------------------------------------
    // Behavior, Ecology & Conservation
    // -------------------------------------------------------------------------
    "animal behavior": [
        "animal behavior", "animal-behavior"
    ],
    "behavioral ecology": [
        "behavioral ecology", "behavioral-ecology",
        "behavioural ecology", "behavioural-ecology"
    ],
    "evolutionary biology": [
        "evolutionary biology", "evolutionary-biology"
    ],
    "invasive species": [
        "invasive species", "invasive-species"
    ],
    "rare species": [
        "rare species", "rare-species"
    ],
    "leaf damage": [
        "leaf damage", "leaf-damage"
    ],
    "wildlife monitoring": [
        "wildlife monitoring", "wildlife-monitoring"
    ],
    "mpala research centre": [
        "mpala research centre", "mpala-research-centre", "mpala"
    ],
    "camera traps": [
        "camera trap", "camera traps", "camera-trap", "camera-traps"
    ],
    "drones": [
        "drone", "drones", "uav", "uavs"
    ],

    // -------------------------------------------------------------------------
    // Computer Vision & Machine Learning
    // -------------------------------------------------------------------------
    "computer vision": [
        "computer vision", "computer-vision", "cv"
    ],
    "image": [
        "image", "images"
    ],
    "image classification": [
        "image classification", "image-classification"
    ],
    "fine-grained classification": [
        "fine-grained classification", "fine-grained-classification"
    ],
    "species classification": [
        "species classification", "species-classification",
        "species identification", "species-identification"
    ],
    "animal re-identification": [
        "animal re-identification", "animal-re-identification",
        "wildlife re-identification", "wildlife-reidentification",
        "re-identification", "reidentification",
        "individual identification", "individual-identification"
    ],
    "object detection": [
        "object detection", "object-detection"
    ],
    "animal detection": [
        "animal detection", "animal-detection"
    ],
    "knowledge-guided machine learning": [
        "knowledge-guided machine learning", "knowledge-guided-machine-learning",
        "knowledge guided machine learning"
    ],
    "model": [
        "model", "models"
    ],
    "multimodal": [
        "multimodal", "multi-modal"
    ],
    "vision-language models": [
        "vision-language model", "vision-language models",
        "vision-language-model", "vision-language-models",
        "vlm", "vlms"
    ],
    "transformers": [
        "transformer", "transformers"
    ],
    "vision transformers": [
        "vision transformer", "vision transformers",
        "vision-transformer", "vision-transformers"
    ],
    "embeddings": [
        "embedding", "embeddings"
    ],

    // -------------------------------------------------------------------------
    // Explainability & Interpretability
    // -------------------------------------------------------------------------
    "explainable ai": [
        "explainable ai", "explainable-ai", "xai"
    ],
    "interpretable machine learning": [
        "interpretable machine learning", "interpretable-machine-learning"
    ],
    "saliency maps": [
        "saliency map", "saliency maps", "saliency-map", "saliency-maps"
    ],
    "sparse autoencoders": [
        "sparse autoencoder", "sparse autoencoders",
        "sparse-autoencoder", "sparse-autoencoders"
    ],

    // -------------------------------------------------------------------------
    // Data & Datasets
    // -------------------------------------------------------------------------
    "annotations": [
        "annotation", "annotations"
    ],
    "benchmarks": [
        "benchmark", "benchmarks"
    ],
    "FAIR": [
        "fair", "fair principles", "fair-principles"
    ],
    "NEON": [
        "neon", "neon data", "neon-data"
    ],
    "exploratory data analysis": [
        "exploratory data analysis", "exploratory-data-analysis", "eda"
    ],
    "metadata generation": [
        "metadata generation", "metadata-generation"
    ],
    "museum specimens": [
        "museum specimen", "museum specimens",
        "museum-specimen", "museum-specimens"
    ],
    "pinned specimens": [
        "pinned specimen", "pinned specimens",
        "pinned-specimen", "pinned-specimens"
    ],
    "visualization": [
        "visualization", "visualizations"
    ],
    "multi-dimensional scaling": [
        "multi-dimensional scaling", "multi-dimensional-scaling", "mds"
    ],

    // -------------------------------------------------------------------------
    // Traits
    // -------------------------------------------------------------------------
    "traits": [
        "trait", "traits"
    ],
    "trait identification": [
        "trait identification", "trait-identification"
    ]

};
