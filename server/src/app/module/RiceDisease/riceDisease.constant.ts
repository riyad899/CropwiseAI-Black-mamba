export interface DiseaseInfo {
  index: number;
  className: string;
  displayName: string;
  displayNameBn: string;
  scientificName?: string;
  category: "Bacterial" | "Fungal" | "Viral" | "Pest" | "Healthy";
  severity: "Low" | "Medium" | "High" | "Critical" | "None";
  description: string;
  symptoms: string[];
  cause: string;
  favorableConditions: string[];
  preventions: string[];
  treatment: {
    cultural: string[];
    chemical: string[];
    organic: string[];
  };
}

export const RICE_DISEASE_CLASSES: Record<string, DiseaseInfo> = {
  bacterial_leaf_blight: {
    index: 0,
    className: "bacterial_leaf_blight",
    displayName: "Bacterial Leaf Blight",
    displayNameBn: "ব্যাকটেরিয়াল লিফ ব্লাইট (পাতা পোড়া রোগ)",
    scientificName: "Xanthomonas oryzae pv. oryzae",
    category: "Bacterial",
    severity: "High",
    description: "A destructive bacterial disease characterized by yellowing and drying of rice leaves starting from leaf tips and margins.",
    symptoms: [
      "Water-soaked stripes along leaf margins turning yellowish to bleached white",
      "Milky bacterial exudate droplets visible on lesions in early morning",
      "Premature leaf wilting leading to poor grain filling ('kresek' phase)"
    ],
    cause: "Infection caused by Xanthomonas oryzae through leaf hydathodes and wounds during high rainfall.",
    favorableConditions: ["High humidity (>70%)", "Temperature between 25-34°C", "Excessive nitrogen fertilizer", "Typhoon or strong winds"],
    preventions: [
      "Use certified resistant rice varieties (e.g. BRRI dhan48, BRRI dhan58)",
      "Balanced application of nitrogen fertilizer, split into 3 doses with adequate potassium",
      "Avoid submerging seedbed in flood water",
      "Ensure proper field drainage"
    ],
    treatment: {
      cultural: [
        "Drain standing water for 3-4 days to arrest bacterial progression",
        "Stop additional nitrogen top dressing immediately",
        "Apply extra muriate of potash (MOP) @ 5 kg/bigha"
      ],
      chemical: [
        "Spray Copper Oxychloride (e.g. Cupravit 50 WP) @ 2g/L water",
        "Or spray Streptomycin sulphate + Tetracycline combinations @ 0.5g/L water",
        "Apply Bismerthiazol or Thiodiazole-copper if outbreak is widespread"
      ],
      organic: [
        "Spray 10% neem seed kernel extract (NSKE)",
        "Spray cow dung slurry supernatant (100g fresh dung fermented in 1L water for 24h)"
      ]
    }
  },
  bacterial_leaf_streak: {
    index: 1,
    className: "bacterial_leaf_streak",
    displayName: "Bacterial Leaf Streak",
    displayNameBn: "ব্যাকটেরিয়াল লিফ স্ট্রিক (পাতার ডোরা রোগ)",
    scientificName: "Xanthomonas oryzae pv. oryzicola",
    category: "Bacterial",
    severity: "Medium",
    description: "Narrow, dark brownish-yellow translucent streaks between leaf veins that coalesce into large yellow patches.",
    symptoms: [
      "Interveinal translucent water-soaked streaks restricted by veins",
      "Streaks turn yellow to orange-brown with yellow bacterial beads",
      "Leaves turn brownish gray and die under high infection"
    ],
    cause: "Xanthomonas oryzae pv. oryzicola entering via stomata and wounds.",
    favorableConditions: ["Warm temperatures (28-32°C)", "High relative humidity (>80%)", "High wind and driving rain"],
    preventions: [
      "Select healthy certified seeds",
      "Avoid excessive nitrogenous fertilization",
      "Practice clean field cultivation and weed elimination"
    ],
    treatment: {
      cultural: [
        "Drain excessive field water",
        "Delay nitrogen top dressing until symptoms subside"
      ],
      chemical: [
        "Copper Hydroxide @ 2g/L or Copper Oxychloride 50 WP @ 2.5g/L",
        "Kasugamycin 2% + Copper Oxychloride formulation @ 2ml/L"
      ],
      organic: [
        "Spray diluted cow urine (1:10 ratio) mixed with neem oil 2ml/L"
      ]
    }
  },
  bacterial_panicle_blight: {
    index: 2,
    className: "bacterial_panicle_blight",
    displayName: "Bacterial Panicle Blight",
    displayNameBn: "ব্যাকটেরিয়াল প্যানিকল ব্লাইট (শীষ পোড়া রোগ)",
    scientificName: "Burkholderia glumae / gladioli",
    category: "Bacterial",
    severity: "Critical",
    description: "Causes grain abortion, panicle sterility, and discoloration during high nighttime temperatures.",
    symptoms: [
      "Discolored florets turning grayish-brown while the panicle rachis remains green",
      "Erect panicles due to unfilled empty grains (sterile florets)",
      "Dark brown band at floret base"
    ],
    cause: "Burkholderia glumae proliferating inside florets during reproductive stage.",
    favorableConditions: ["High nighttime temperatures (>25°C)", "Frequent rainfall during flowering", "Dense canopy"],
    preventions: [
      "Seed treatment with hot water (56°C for 15 mins) or Oxolinic acid",
      "Plant during optimal planting windows to avoid heat spikes at flowering",
      "Avoid excessive vegetative density"
    ],
    treatment: {
      cultural: [
        "Maintain intermittent irrigation rather than deep stagnant flooding",
        "Remove heavily infected panicles from seed production lots"
      ],
      chemical: [
        "Preventive spray of Oxolinic acid 20% WP at early heading stage",
        "Copper-based bactericides at boot stage where registered"
      ],
      organic: [
        "Seed priming with Pseudomonas fluorescens biocontrol agent (10g/kg seed)"
      ]
    }
  },
  blast: {
    index: 3,
    className: "blast",
    displayName: "Rice Blast",
    displayNameBn: "ধানের ব্লাস্ট রোগ (পাতা/শীষ ব্লাস্ট)",
    scientificName: "Magnaporthe oryzae (Pyricularia oryzae)",
    category: "Fungal",
    severity: "Critical",
    description: "One of the most destructive fungal diseases of rice, producing spindle-shaped lesions on leaves and neck rot on panicles.",
    symptoms: [
      "Spindle/diamond-shaped spots with gray or white centers and brown/reddish margins",
      "Lesions enlarge and coalesce causing complete leaf blighting",
      "Blackened nodes ('node blast') or rotted panicle base ('neck blast') causing complete lodging"
    ],
    cause: "Magnaporthe oryzae airborne conidia spore germination under cool moist nights.",
    favorableConditions: ["Dew duration >10 hours", "Temperatures 20-28°C", "Excessive nitrogen", "Drought stress followed by rain"],
    preventions: [
      "Grow blast-resistant cultivars (e.g. BRRI dhan89, BRRI dhan92)",
      "Avoid dry seedbed and soil water deficit during tillering",
      "Avoid excessive nitrogen; apply nitrogen in 3 split doses with potassium"
    ],
    treatment: {
      cultural: [
        "Keep field consistently saturated with 2-3 cm water during vegetative phase",
        "Destroy infected stubble and straw after harvest"
      ],
      chemical: [
        "Tricyclazole 75 WP (e.g. Trooper/Beam) @ 0.75g/L water at first sign",
        "Or Azoxystrobin + Difenoconazole (e.g. Amistar Top) @ 1ml/L water",
        "Or Kasugamycin 3% SL @ 2ml/L water at afternoon hours"
      ],
      organic: [
        "Trichoderma harzianum foliar spray @ 5g/L",
        "Neem oil 3ml/L emulsified with liquid soap"
      ]
    }
  },
  brown_spot: {
    index: 4,
    className: "brown_spot",
    displayName: "Brown Spot",
    displayNameBn: "বাদামী দাগ রোগ (ব্রাউন স্পট)",
    scientificName: "Bipolaris oryzae (Cochliobolus miyabeanus)",
    category: "Fungal",
    severity: "Medium",
    description: "Oval, dark brown lesions on leaves and glumes, often associated with nutrient-deficient or water-stressed soils.",
    symptoms: [
      "Small, circular to oval sesame-seed shaped brown lesions with yellow halo",
      "Spots on grain husks leading to black speckled grains and low milling recovery",
      "Seedling damping-off and poor vigor"
    ],
    cause: "Bipolaris oryzae fungal spores attacking stressed plants.",
    favorableConditions: ["Poor or exhausted soils (low silicon, potassium, zinc)", "Intermittent drought", "High humidity (86-100%)"],
    preventions: [
      "Soil nutrient management: apply recommended Zinc (ZnSO4) and Potassium (MOP)",
      "Seed treatment with Carbendazim 50 WP (2g/kg seed) before sowing",
      "Maintain adequate soil moisture"
    ],
    treatment: {
      cultural: [
        "Top-dress with Potash and micronutrients (Zinc and Boron)",
        "Improve drainage in waterlogged poor soils"
      ],
      chemical: [
        "Mancozeb 75 WP @ 2.5g/L water",
        "Or Propiconazole 25 EC (e.g. Tilt) @ 1ml/L water",
        "Or Carbendazim + Mancozeb (e.g. Companion) @ 2g/L"
      ],
      organic: [
        "Pseudomonas fluorescens 10g/L or Trichoderma viride 5g/L foliar spray",
        "Biochar and silicate rock dust amendment to boost silica uptake"
      ]
    }
  },
  dead_heart: {
    index: 5,
    className: "dead_heart",
    displayName: "Dead Heart (Stem Borer Damage)",
    displayNameBn: "মাজরা পোকার আক্রমণ (ডেড হার্ট)",
    scientificName: "Scirpophaga incertulas / Chilo suppressalis",
    category: "Pest",
    severity: "High",
    description: "Larval boring of the rice stem causing the central vegetative tiller whorl to wither and pull out effortlessly.",
    symptoms: [
      "Central leaf whorl turns yellow, dries up, and easily pulls out with severed base ('dead heart')",
      "At heading stage, causes completely bleached, empty white panicles ('white head')",
      "Tiny larval entry holes and frass pellets inside stem"
    ],
    cause: "Yellow stem borer (YSB) larvae feeding inside internal vascular bundles of tiller.",
    favorableConditions: ["Dense planting", "Staggered transplanting in the area", "High vegetative nitrogen growth"],
    preventions: [
      "Install pheromone traps (e.g. YSB Lure) @ 4 traps/bigha for early monitoring",
      "Clip leaf tips of seedlings before transplanting to remove egg masses",
      "Conserve natural predators: spiders, parasitoid wasps (Trichogramma japonicum)"
    ],
    treatment: {
      cultural: [
        "Hand pick and destroy egg masses from nursery and early field",
        "Perch bamboo poles (T-perches) for insectivorous birds in the field",
        "Alternate wetting and drying (AWD) to expose lower stems"
      ],
      chemical: [
        "Cartap Hydrochloride 4G or 50 SP @ 1g/L water",
        "Or Chlorantraniliprole 18.5 SC (e.g. Coragen) @ 0.4ml/L water",
        "Or Fipronil 5 SC @ 2ml/L water where threshold (>5% dead heart) exceeded"
      ],
      organic: [
        "Release Trichogramma japonicum cards @ 50,000 parasitoids/ha weekly",
        "Spray Bacillus thuringiensis (Bt) kurstaki @ 2g/L at evening",
        "Neem Azadirachtin 10,000 ppm @ 2ml/L"
      ]
    }
  },
  downy_mildew: {
    index: 6,
    className: "downy_mildew",
    displayName: "Downy Mildew",
    displayNameBn: "ডাউনি মিলডিউ রোগ",
    scientificName: "Sclerophthora macrospora",
    category: "Fungal",
    severity: "Medium",
    description: "Oomycete pathogen causing yellow-green chlorotic blotches, stunting, distorted leaves, and abnormal panicle development.",
    symptoms: [
      "White downy coating on the lower surface of leaves under wet humid mornings",
      "Stunted tillers with twisted, rolled, or flag-like leaves",
      "Abnormal leafy floral proliferation instead of healthy grains (crazy top)"
    ],
    cause: "Sclerophthora macrospora zoospores spread through floodwater in submerged fields.",
    favorableConditions: ["Submerged seedlings in stagnant floodwaters", "Cool water (18-24°C)", "Waterlogged nurseries"],
    preventions: [
      "Avoid submerging seedbeds and nursery plots during early monsoon",
      "Use well-drained nursery raised beds",
      "Seed treatment with Metalaxyl @ 2g/kg seed"
    ],
    treatment: {
      cultural: [
        "Drain inundated fields immediately",
        "Rogue out and bury severely distorted stunted plants"
      ],
      chemical: [
        "Metalaxyl 8% + Mancozeb 64% WP (e.g. Ridomil Gold) @ 2g/L water",
        "Or Cymoxanil + Mancozeb @ 2.5g/L water"
      ],
      organic: [
        "Bordeaux mixture 1% spray",
        "Garlic-chili aqueous extract spray as antifungal wash"
      ]
    }
  },
  hispa: {
    index: 7,
    className: "hispa",
    displayName: "Rice Hispa",
    displayNameBn: "ধানের পামরী পোকা (হিসপা)",
    scientificName: "Dicladispa armigera",
    category: "Pest",
    severity: "High",
    description: "Spiny beetle pest whose adults scrape the upper epidermis and larvae mine between leaf layers, turning leaves whitish-gray.",
    symptoms: [
      "Parallel white feeding streaks on leaf blades made by adult beetles",
      "Blister-like leaf mines caused by internal grubs",
      "Severely affected field appears scorched or bleached from a distance"
    ],
    cause: "Dicladispa armigera adult beetle feeding and internal larval leaf mining.",
    favorableConditions: ["High humidity (>85%) after pre-monsoon rains", "Dense vegetative growth", "Excess nitrogen"],
    preventions: [
      "Sweep net sweeping to capture and destroy adult beetles during morning hours",
      "Clip off leaf tips before transplanting to eliminate hispa eggs and grubs",
      "Conserve green mirid bugs and spiders"
    ],
    treatment: {
      cultural: [
        "Sweep with a cloth net across the field to destroy caught adult beetles",
        "Clip and destroy heavily mined flag leaves"
      ],
      chemical: [
        "Chlorpyrifos 20 EC @ 2ml/L water",
        "Or Malathion 57 EC @ 2ml/L water",
        "Or Quinalphos 25 EC @ 2ml/L water when economic threshold (>1 beetle/hill) is crossed"
      ],
      organic: [
        "Foliar spray with Beauveria bassiana entomopathogenic fungus @ 5g/L",
        "Neem oil 5ml/L + liquid dish soap 2ml/L"
      ]
    }
  },
  normal: {
    index: 8,
    className: "normal",
    displayName: "Healthy Rice Leaf",
    displayNameBn: "সুস্থ ধানের পাতা (রোগমুক্ত)",
    category: "Healthy",
    severity: "None",
    description: "Normal, vigorous green rice leaf with no visible pathogen lesions, discoloration, or insect pest damage.",
    symptoms: [
      "Uniform green coloration without necrotic spots or chlorotic halos",
      "Smooth, intact leaf blade and margin without pest mining or bacterial oozing",
      "Turgid erect canopy angle indicating adequate hydration and nitrogen assimilation"
    ],
    cause: "Healthy crop condition.",
    favorableConditions: ["Balanced soil fertility", "Proper Alternate Wetting and Drying (AWD)", "Good sunlight and airflow"],
    preventions: [
      "Maintain AWD irrigation schedule to save water and strengthen root depth",
      "Apply balanced N-P-K-S-Zn based on soil test or leaf color chart (LCC)",
      "Continue regular weekly scouting for early signs of blast or stem borer"
    ],
    treatment: {
      cultural: [
        "Follow recommended vegetative and reproductive care practices",
        "Ensure optimal weed management around bunds"
      ],
      chemical: [],
      organic: [
        "Foliar spray of Seaweed extract or vermiwash @ 5ml/L to maintain plant vigor"
      ]
    }
  },
  tungro: {
    index: 9,
    className: "tungro",
    displayName: "Rice Tungro Disease",
    displayNameBn: "টুংরো রোগ (হলুদ হওয়া রোগ)",
    scientificName: "Rice tungro bacilliform virus (RTBV) + spherical virus (RTSV)",
    category: "Viral",
    severity: "Critical",
    description: "Viral disease transmitted by green leafhoppers (GLH), resulting in stunted tillering, yellow-orange leaves, and delayed flowering.",
    symptoms: [
      "Yellow or orange-yellow discoloration starting from leaf tips and expanding downward",
      "Severe plant stunting and drastically reduced tiller production",
      "Delayed flowering with partially exerted, sterile or mottled panicles"
    ],
    cause: "Dual viral infection (RTBV + RTSV) transmitted semi-persistently by green leafhopper (Nephotettix virescens).",
    favorableConditions: ["High green leafhopper population in nearby stubble", "Sequential transplanting in neighboring plots", "Young vegetative seedling stage"],
    preventions: [
      "Grow tungro-resistant or GLH-resistant cultivars (e.g. BRRI dhan71, BRRI dhan75)",
      "Synchronous planting across neighboring farmer communities",
      "Eliminate ratoon and wild rice hosts harboring the virus between seasons"
    ],
    treatment: {
      cultural: [
        "Uproot and burn or bury infected tungro hills immediately to stop virus spread",
        "Drain field water temporarily to reduce GLH nymph reproduction"
      ],
      chemical: [
        "Control insect vector (GLH): Imidacloprid 17.8 SL @ 0.5ml/L water",
        "Or Thiamethoxam 25 WG @ 0.3g/L water",
        "Or Dinotefuran 20 SG @ 0.4g/L water"
      ],
      organic: [
        "Install yellow sticky traps @ 15 traps/bigha to monitor and trap GLH",
        "Spray Metarhizium anisopliae biopesticide @ 5g/L against hoppers"
      ]
    }
  }
};

export const MODEL_VALIDATION_METRICS = {
  model_name: "EfficientNet-B0 Rice Leaf Disease Classifier",
  architecture: "efficientnet_b0",
  version: "1.0",
  dataset: {
    total_images: 2082,
    num_classes: 10,
    classes: [
      "bacterial_leaf_blight",
      "bacterial_leaf_streak",
      "bacterial_panicle_blight",
      "blast",
      "brown_spot",
      "dead_heart",
      "downy_mildew",
      "hispa",
      "normal",
      "tungro"
    ]
  },
  metrics: {
    accuracy: 0.9505,
    macro_f1: 0.9456,
    macro_precision: 0.9378,
    macro_recall: 0.9550,
    class_f1_scores: {
      bacterial_leaf_blight: 0.94,
      bacterial_leaf_streak: 0.92,
      bacterial_panicle_blight: 0.97,
      blast: 0.95,
      brown_spot: 0.95,
      dead_heart: 0.99,
      downy_mildew: 0.91,
      hispa: 0.94,
      normal: 0.97,
      tungro: 0.93
    }
  },
  preprocessing: {
    image_size: 224,
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
    color_format: "RGB",
    tensor_format: "CHW",
    dtype: "float32"
  }
};

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_INFERENCE_TIMEOUT_MS = 10000; // 10s

