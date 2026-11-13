import type { Product } from "../types/store.ts";

export const PRODUCTS: Product[] = [
  {
    id: "netrify-1",
    slug: "ecell-varsity-bomber-jacket",
    name: "NIT Raipur E-Cell Official Varsity Bomber Jacket",
    club: "The Entrepreneurship Cell (E-Cell), NIT Raipur",
    clubShort: "E-Cell NITRR",
    category: "Outerwear",
    price: 1199,
    originalPrice: 1599,
    tagline: "380GSM Brushed Heavyweight Fleece • Custom Back Name Embroidery",
    description: "The flagship collegiate varsity bomber jacket engineered for E-Cell NIT Raipur. Built with a premium wool-poly blend exterior, insulated quilted interior, customized student name lettering across the rear panel, and the embroidered 'Hold the Vision' institutional motto.",
    image: "/images/catalog/normalized/ecell-varsity-jacket.png",
    secondaryImage: "/images/catalog/normalized/nitrr-varsity-black-hoodie.jpg",
    badge: "Flagship Outerwear",
    colorways: [
      { name: "Classic Black", hex: "#121214" },
      { name: "Deep Navy", hex: "#18233C" },
      { name: "Olive Green", hex: "#2E3B29" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Custom Name Chainstitch Embroidery on Back",
      "Embroidered E-Cell Minimalist Crest on Left Chest",
      "Heavyweight 380 GSM Quilted Thermal Insulation",
      "Heavy Ribbed Bomber Collar, Cuffs & Hem"
    ],
    customizable: true,
    featured: true,
    specs: {
      material: "Heavyweight Brushed Fleece / Wool-Poly Blend",
      gsm: "380 GSM Heavyweight Fleece",
      fit: "Collegiate Relaxed Fit (Unisex)",
      print: "Custom Student Name Chainstitch Embroidery"
    }
  },
  {
    id: "netrify-2",
    slug: "nit-raipur-classic-varsity-hoodie",
    name: "NIT Raipur Heritage Collegiate Pullover Hoodie",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Outerwear",
    price: 799,
    originalPrice: 999,
    tagline: "Arched Collegiate Lettering • 380GSM Ultra-Soft Fleece",
    description: "The quintessential campus hoodie. Features bold arched golden-yellow 'NIT RAIPUR' varsity lettering, the official collegiate seal, kangaroo pouch pocket, and an ultra-soft brushed fleece interior designed for Raipur winters.",
    image: "/images/catalog/normalized/nitrr-varsity-black-hoodie.jpg",
    badge: "Campus Essential",
    colorways: [
      { name: "Midnight Black", hex: "#121214" },
      { name: "Collegiate Navy", hex: "#18233C" },
      { name: "Heather Oatmeal", hex: "#D6D3CD" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "380 GSM Ultra-Soft Brushed Cotton Fleece",
      "Double-Layer Thermal Crossover Hood with Metal Eyelets",
      "High-Density Screen-Printed Collegiate Seal",
      "Heavy Duty Kangaroo Pouch Pocket"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "100% Combed Heavy Cotton Fleece",
      gsm: "380 GSM Brushed Fleece",
      fit: "Drop-Shoulder Standard Collegiate Fit",
      print: "Archival High-Density Plastisol Screen Print"
    }
  },
  {
    id: "netrify-3",
    slug: "nitrrfie-all-weather-jacket",
    name: "NITRRFIE All-Weather Technical Shell Jacket",
    club: "NIT Raipur Foundation for Innovation and Entrepreneurship",
    clubShort: "NITRRFIE Tech",
    category: "Outerwear",
    price: 1499,
    originalPrice: 1899,
    tagline: "Micro-Ripstop Membrane • Concealed Storm Zips",
    description: "Engineered for student commutes in any weather. Features a windproof water-repellent micro-ripstop outer shell, breathable thermal fleece lining, storm-flap zippered pockets, and high-visibility reflective NIT Raipur institutional accents.",
    image: "/images/catalog/normalized/ecell-varsity-jacket.png",
    badge: "Technical Shell",
    colorways: [
      { name: "Stealth Black", hex: "#0E0E0E" },
      { name: "Storm Slate", hex: "#3A3F47" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "DWR Water-Repellent Coated Ripstop Shell",
      "Microfleece Thermal Insulation",
      "Concealed Storm-Zip Front & Deep Pockets",
      "Reflective NIT Raipur Collegiate Accents"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "Durable Micro-Ripstop Nylon",
      gsm: "All-Weather Technical Grade",
      fit: "Structured Modular Fit",
      print: "Reflective Technical Institutional Monogram"
    }
  },
  {
    id: "netrify-4",
    slug: "robotix-club-cyberpunk-hoodie",
    name: "NIT Raipur Robotix Club Mecha Samurai Hoodie",
    club: "Robotix Club, National Institute of Technology Raipur",
    clubShort: "Robotix NITRR",
    category: "Technical Societies",
    price: 799,
    originalPrice: 1099,
    tagline: "Neon Cyberpunk Techwear • Dual-Sided 8-Pass Screen Print",
    description: "Official limited release from Robotix Club NIT Raipur. Features a clean minimalist robot gear crest on the left chest and a stunning full-back neon cyberpunk mecha samurai print with Japanese typography on 380 GSM fleece.",
    image: "/images/catalog/normalized/robotix-cyberpunk-hoodie-front.jpg",
    secondaryImage: "/images/catalog/normalized/robotix-cyberpunk-hoodie-back.jpg",
    badge: "Limited Tech Drop",
    colorways: [
      { name: "Cyber Black", hex: "#121214" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Multi-Pass High-Resolution 8-Color Back Artwork",
      "Minimalist Front Robotix Gear Crest",
      "Drop-Shoulder Relaxed Streetwear Cut",
      "380 GSM Heavyweight Pre-shrunk Cotton Blend"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "100% Combed Heavyweight Bio-Washed Cotton Blend",
      gsm: "380 GSM Heavyweight",
      fit: "Drop-Shoulder Relaxed Streetwear Fit",
      print: "8-Color Vibrant Plastisol Back Artwork"
    }
  },
  {
    id: "netrify-5",
    slug: "tcp-codeutsava-pixel-coder-tee",
    name: "NIT Raipur TCP CodeUtsava 8-Bit Pixel Coder Tee",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    category: "Technical Societies",
    price: 499,
    originalPrice: 649,
    tagline: "8-Bit Coffee & Code • 240GSM Bio-Washed Cotton",
    description: "Official developer culture tee from Turing Club of Programmers (TCP). Depicts the iconic 8-bit pixel coder companion clutching a coffee cup while debugging on a laptop with the CodeUtsava emblem.",
    image: "/images/catalog/normalized/tcp-pixel-coder-tee.png",
    badge: "Hackathon Edition",
    colorways: [
      { name: "Terminal Black", hex: "#151515" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Bio-Washed Combed Cotton",
      "Crisp Pixel-Art Screen Printing",
      "Turing Club of Programmers Sleeve Tag",
      "Relaxed Silhouette for 36-Hour Hackathons"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Bio-Washed Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Boxy Streetwear Fit",
      print: "Crisp Low-Profile Pixel Screen Print"
    }
  },
  {
    id: "netrify-6",
    slug: "tcp-codeutsava-born-to-hack-tee",
    name: "NIT Raipur TCP CodeUtsava 'Born to Hack' Glitch Tee",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    category: "Technical Societies",
    price: 499,
    originalPrice: 649,
    tagline: "Holographic Glitch Aesthetic • National Hackathon Series",
    description: "Bold hacker aesthetic designed for CodeUtsava. Displays a vivid holographic glitch skull with stylized 'BORN TO HACK' athletic lettering. Made with breathable, high-density combed cotton.",
    image: "/images/catalog/normalized/tcp-born-to-hack-tee.png",
    badge: "Official Hackathon",
    colorways: [
      { name: "Hacker Black", hex: "#141416" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Holographic Glitch Multi-Pass Screen Print",
      "Reinforced Ribbed Crewneck Collar",
      "Official CodeUtsava National Hackathon Edition",
      "100% Breathable Combed Cotton"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Relaxed Fit (Unisex)",
      print: "Holographic Glitch Screen Print"
    }
  },
  {
    id: "netrify-7",
    slug: "tcp-codeutsava-cyberpunk-edgerunner-tee",
    name: "NIT Raipur TCP CodeUtsava Cyberpunk Edgerunner Tee",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    category: "Technical Societies",
    price: 499,
    originalPrice: 649,
    tagline: "Neon Edgerunner Anime • Competitive Programming Culture",
    description: "Inspired by futuristic cyberpunk anime and modern competitive programming. Features vibrant yellow & cyan neon tech frames around a cybernetic netrunner laptop hacker.",
    image: "/images/catalog/normalized/tcp-cyberpunk-edgerunner-tee.png",
    badge: "TCP Limited Drop",
    colorways: [
      { name: "Cyber Black", hex: "#18181A" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Ultra-Vibrant Fade-Resistant Screen Printing",
      "Soft Bio-Washed Combed Cotton",
      "Official TCP Society Branding",
      "Drop-Shoulder Boxy Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Boxy Silhouette",
      print: "Plastisol Multi-Color Screen Print"
    }
  },
  {
    id: "netrify-8",
    slug: "nit-raipur-sand-pocket-oversized-tee",
    name: "NIT Raipur Sand Pocket Heavyweight Oversized Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "240 GSM Heavyweight Cotton • Front Pocket Seal • Oversized Fit",
    description: "Premium stone-sand streetwear tee. Engineered with a structured utility chest pocket bearing the official NIT Raipur multicolored seal and EST. 1956 lettering, flanked by bold vertical maroon typography.",
    image: "/images/catalog/normalized/nitrr-sand-pocket-oversized-tee.jpg",
    badge: "Collegiate Heavyweight",
    colorways: [
      { name: "Sand Beige", hex: "#D8C7B5" },
      { name: "Off White", hex: "#F5F5F0" },
      { name: "Washed Carbon", hex: "#222222" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240+ GSM Heavyweight Combed Cotton",
      "Custom Chest Utility Pocket with Embroidered Seal",
      "Vertical Distress Typography",
      "Drop-Shoulder Boxy Silhouette"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "100% Combed Heavyweight Bio-Washed Cotton",
      gsm: "240 GSM Premium Drop-Shoulder",
      fit: "Collegiate Drop-Shoulder Oversized Fit",
      print: "Direct Satin Embroidery on Utility Pocket"
    }
  },
  {
    id: "netrify-9",
    slug: "nit-raipur-arched-regular-fit-tee",
    name: "NIT Raipur Classic Arched Regular Fit Crew Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 499,
    originalPrice: 649,
    tagline: "Classic Collegiate Arch • 220 GSM Regular Fit",
    description: "The timeless collegiate crewneck. Features an arched maroon 'NIT RAIPUR' graphic with the authentic institute seal centered beneath. Perfect for everyday classroom lectures and campus life.",
    image: "/images/catalog/normalized/nitrr-sand-regular-fit-tee.jpg",
    badge: "Everyday Staple",
    colorways: [
      { name: "Natural Ecru", hex: "#ECE7DE" },
      { name: "Classic White", hex: "#FFFFFF" },
      { name: "Navy Blue", hex: "#18233C" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "220 GSM Bio-Washed Combed Cotton",
      "Arched Collegiate Varsity Font",
      "High-Precision Full-Color Institute Crest",
      "Tailored Everyday Regular Fit"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Bio-Washed Cotton",
      gsm: "220 GSM Combed Cotton",
      fit: "Tailored Everyday Fit",
      print: "Collegiate Arch Screen Print"
    }
  },
  {
    id: "netrify-10",
    slug: "nit-raipur-architecture-01-white-tee",
    name: "NIT Raipur Main Building '01' Oversized Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "Architectural Line Art • Varsity 01 Back Print",
    description: "An architectural tribute to the iconic NIT Raipur main building facade. The front features a hand-drafted building sketch framed by the Chhattisgarh state border, paired with an athletic varsity 'NIT RAIPUR 01' jersey print on the back.",
    image: "/images/catalog/normalized/nitrr-white-architecture-01-tee.jpg",
    secondaryImage: "/images/catalog/normalized/nitrr-black-architecture-pocket-tee.jpg",
    badge: "Architectural Series",
    colorways: [
      { name: "Crisp White", hex: "#FFFFFF" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Heavyweight White Cotton",
      "Front Architectural Main Building Line Art",
      "Back Bold Varsity Athletic '01' Typo",
      "Relaxed Drop-Shoulder Street Cut"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Boxy Fit",
      print: "Architectural Fine-Line Print"
    }
  },
  {
    id: "netrify-11",
    slug: "nit-raipur-continuing-legacy-black-tee",
    name: "NIT Raipur 'Continuing Legacy' Oversized Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "'Continuing... Legacy' Back • Minimalist Front Tower Sketch",
    description: "Celebrates seven decades of engineering excellence. Jet black drop-shoulder tee with front architectural tower sketch and a massive gold-outlined varsity back print declaring 'CONTINUING... LEGACY'.",
    image: "/images/catalog/normalized/nitrr-black-continuing-legacy-tee.jpg",
    badge: "Legacy Series",
    colorways: [
      { name: "Midnight Black", hex: "#121214" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Combed Ring-Spun Cotton",
      "Gold-Accented Varsity Back Typography",
      "Minimalist Front Tower Line-Illustration",
      "Drop-Shoulder Boxy Streetwear Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Ring-Spun Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Boxy Silhouette",
      print: "Gold-Accented Varsity Screen Print"
    }
  },
  {
    id: "netrify-12",
    slug: "nit-raipur-sand-chain-collar-tee",
    name: "NIT Raipur Chain-Collar Statement Oversized Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "Cuban Link Collar Print • Front Pocket Emblem",
    description: "An edgy street-culture interpretation of collegiate merchandise. Features a simulated maroon link chain draping around the ribbed collar with arched NIT lettering and a chest pocket bearing the color seal.",
    image: "/images/catalog/normalized/nitrr-sand-chain-collar-tee.jpg",
    badge: "Statement Piece",
    colorways: [
      { name: "Sand Beige", hex: "#D8C7B5" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Signature Cuban Chain Collar Artwork",
      "Front Utility Chest Pocket with Seal & EST. 1956",
      "Heavyweight 240 GSM Premium Cotton",
      "Streetwear Drop-Shoulder Proportion"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Proportion",
      print: "Collar Chain & Pocket Multi-Pass Print"
    }
  },
  {
    id: "netrify-13",
    slug: "nit-raipur-core-grad-black-tee",
    name: "NIT Raipur 'Core Grad' Engineering Oversized Tee",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "Core Engineering Pride • High-Density Tower Print",
    description: "Designed for proud engineers. Left-chest multicolored emblem on deep black cotton with an imposing back blueprint of the central university tower and bold 'CORE GRAD' signature.",
    image: "/images/catalog/normalized/nitrr-black-coregrad-tee.jpg",
    secondaryImage: "/images/catalog/normalized/nitrr-black-architecture-pocket-tee.jpg",
    badge: "Engineering Core",
    colorways: [
      { name: "Pitch Black", hex: "#121214" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Dense Combed Cotton",
      "High-Definition Architectural Back Blueprint",
      "Gold & White Two-Tone Back Typography",
      "Generous Oversized Streetwear Fit"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Generous Oversized Streetwear Fit",
      print: "Architectural Blueprint Back Screen Print"
    }
  },
  {
    id: "netrify-14",
    slug: "nit-raipur-signature-polo-tee",
    name: "NIT Raipur Signature Embroidered Collegiate Polo",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Heritage",
    category: "Campus Essentials",
    price: 599,
    originalPrice: 799,
    tagline: "Fine Pique Knit • Embroidered Golden Crest • Classic Collar",
    description: "The distinguished collegiate polo shirt. Tailored with heavyweight 240 GSM pique knit cotton, dual-button reinforced placket, ribbed collar, and fine metallic gold embroidery of the NIT Raipur insignia.",
    image: "/images/catalog/normalized/nitrr-sand-regular-fit-tee.jpg",
    badge: "Executive Polo",
    colorways: [
      { name: "Ecru Sand", hex: "#D8C7B5" },
      { name: "Collegiate Navy", hex: "#18233C" },
      { name: "Jet Black", hex: "#121214" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Premium Honeycomb Pique Cotton",
      "Direct Metallic Thread Chest Embroidery",
      "Ribbed Collar & Sleeves with Tone-on-Tone Buttons",
      "Side Vents for Superior Campus Comfort"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "100% Combed Heavyweight Honeycomb Pique",
      gsm: "240 GSM Institutional Pique",
      fit: "Tailored Collegiate Fit (Unisex)",
      print: "Direct Metallic Thread Chest Crest Embroidery"
    }
  },
  {
    id: "netrify-15",
    slug: "think-india-executive-tee",
    name: "NIT Raipur Think India Executive Oversized Tee",
    club: "Think India, NIT Raipur Chapter",
    clubShort: "Think India NITRR",
    category: "Club Drops",
    price: 599,
    originalPrice: 799,
    tagline: "Think. Unite. Lead. Transform. • Official Chapter Drop",
    description: "The official Think India coordinator series. Front left-chest sun logo with bold back mountain peak artwork and the founding motto 'Think. Unite. Lead. Transform.'. Custom student name printing available on request.",
    image: "/images/catalog/normalized/think-india-mocha-tee.png",
    secondaryImage: "/images/catalog/normalized/think-india-black-tee.png",
    badge: "Institutional Edition",
    colorways: [
      { name: "Mocha Brown", hex: "#4A3728" },
      { name: "Midnight Black", hex: "#121214" },
      { name: "Crisp White", hex: "#F7F7F4" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Custom Student Coordinator Name Printing on Back",
      "Think India Official Sun Crest on Chest",
      "Heavyweight 240 GSM Bio-Washed Combed Cotton",
      "Pre-shrunk Fabric with Anti-Pilling Finish"
    ],
    customizable: true,
    featured: true,
    specs: {
      material: "100% Combed Heavy Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Boxy Silhouette",
      print: "Custom Student Coordinator Name Printing"
    }
  },
  {
    id: "netrify-16",
    slug: "nit-raipur-smart-led-temp-bottle",
    name: "NIT Raipur Smart LED Touch Temperature Bottle",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Gear",
    category: "Accessories",
    price: 1299,
    originalPrice: 1699,
    tagline: "Touch LED Temperature Display • Double-Wall Vacuum 500ml",
    description: "Matte black double-wall 304 food-grade stainless steel thermal flask. Features a capacitive touch LED lid that displays exact beverage temperature in real time, keeping drinks hot for 12 hours or ice-cold for 24 hours. Laser-engraved with the official NIT Raipur crest.",
    image: "/images/catalog/normalized/nitrr-temp-smart-bottle.jpg",
    badge: "Smart Hardware",
    colorways: [
      { name: "Matte Black", hex: "#121214" }
    ],
    sizes: ["500 ml"],
    features: [
      "Smart Touch LED Cap with Real-Time Temp Readout",
      "Double-Wall Vacuum Insulated 304 Food-Grade Steel",
      "12-Hour Hot / 24-Hour Cold Thermal Retention",
      "Precision Laser-Etched Institute Insignia"
    ],
    customizable: false,
    featured: true,
    specs: {
      material: "304 Food-Grade Stainless Steel",
      gsm: "Double-Wall Thermal Vacuum",
      fit: "500ml Ergonomic Flask",
      print: "Precision Laser Engraving"
    }
  },
  {
    id: "netrify-17",
    slug: "nit-raipur-classic-ceramic-mug",
    name: "NIT Raipur Classic Collegiate Ceramic Stoneware Mug",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Gear",
    category: "Accessories",
    price: 299,
    originalPrice: 399,
    tagline: "350ml Gloss Ceramic • High-Definition Monogram Seal",
    description: "Start your study sessions with the official NIT Raipur coffee mug. Crafted with chip-resistant premium white ceramic, a glossy glaze, comfortable C-handle, and crisp high-definition printing of the institute seal.",
    image: "/images/catalog/normalized/nitrr-coffee-mug.jpg",
    badge: "Campus Desk Essential",
    colorways: [
      { name: "Gloss White", hex: "#F8F8F6" }
    ],
    sizes: ["350 ml"],
    features: [
      "100% Microwave & Dishwasher Safe",
      "High-Fidelity Glossy Ceramic Glaze",
      "Ergonomic Wide Comfort-Grip Handle",
      "Official High-Density Institute Monogram"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "High-Fire Ceramic Stoneware",
      gsm: "Chip-Resistant Institutional Grade",
      fit: "350ml Comfort-Grip Mug",
      print: "High-Definition Sublimation Monogram"
    }
  },
  {
    id: "netrify-18",
    slug: "nit-raipur-heritage-metal-keychains",
    name: "NIT Raipur Heritage Metal Enamel Keychains (Set of 5)",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Gear",
    category: "Accessories",
    price: 299,
    originalPrice: 449,
    tagline: "Heavy Metal Die-Cast • Enamel Finish • Campus Landmarks",
    description: "Premium die-cast metallic keychains featuring prominent NIT Raipur campus landmarks including the iconic Main Building Tower, Seal, Tree of Knowledge, and State Map. Finished with scratch-resistant enamel and heavy-duty steel split rings.",
    image: "/images/catalog/normalized/nitrr-keychain-set-5.jpg",
    secondaryImage: "/images/catalog/normalized/nitrr-keychain-heritage-set.jpg",
    badge: "Heritage Keepsake",
    colorways: [
      { name: "Matte Black & Gold", hex: "#B89745" },
      { name: "Antique Silver", hex: "#9E9E9E" }
    ],
    sizes: ["One Size"],
    features: [
      "Solid Die-Cast Zinc Alloy Construction",
      "Detailed Laser Engraving & Enamel Fill",
      "Heavy-Duty Stainless Steel Split Keyring",
      "Features Tower, Campus Seal, and EST. 1956"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "Die-Cast Zinc Alloy with Brass/Enamel Finish",
      gsm: "Solid Hand Feel",
      fit: "Universal Split Keyring",
      print: "Deep Relief 3D Engraving & Hard Enamel"
    }
  },
  {
    id: "netrify-19",
    slug: "nit-raipur-official-seal-badge",
    name: "NIT Raipur Collegiate Enamel Seal Badges (Pair)",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Gear",
    category: "Accessories",
    price: 49,
    originalPrice: 99,
    tagline: "High-Gloss Protective Dome • Official Seal & Champion Ring",
    description: "Show your campus pride on bags, jackets, and lanyards. Sturdy button pin badge displaying the multi-color official NIT Raipur emblem surrounded by the golden 'CHAMPION' collegiate ring with a secure safety-pin clasp.",
    image: "/images/catalog/normalized/nitrr-badge-seal.jpg",
    secondaryImage: "/images/catalog/normalized/nitrr-badge-gold-metallic.jpg",
    badge: "Official Lapel Pin",
    colorways: [
      { name: "Gold Metallic Rim", hex: "#D4AF37" }
    ],
    sizes: ["44 mm"],
    features: [
      "Scratch-Resistant High-Gloss Acrylic Dome",
      "Rust-Proof Stainless Steel Pin Backing",
      "Crisp Full-Color Institute Seal",
      "Perfect for Backpacks, Lanyards, & Blazers"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "Stainless Steel Pin & High-Gloss Acrylic Dome",
      gsm: "Precision Cast",
      fit: "44mm Diameter",
      print: "Full-Color Sub-Surface Print"
    }
  },
  {
    id: "netrify-20",
    slug: "nit-raipur-collegiate-twill-cap",
    name: "NIT Raipur Embroidered Collegiate Twill Cap",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Gear",
    category: "Accessories",
    price: 249,
    originalPrice: 399,
    tagline: "100% Washed Cotton Twill • 3D Direct Embroidered Crest",
    description: "Stay shaded in style under the Raipur sun. Constructed from 100% breathable washed cotton twill, featuring a 6-panel structured crown, pre-curved visor, direct 3D embroidery of the NIT Raipur crest, and an adjustable brass buckle.",
    image: "/images/catalog/normalized/nitrr-collegiate-cap.jpg",
    badge: "Campus Sunwear",
    colorways: [
      { name: "Stone Beige", hex: "#D8C7B5" },
      { name: "Collegiate Navy", hex: "#18233C" }
    ],
    sizes: ["Adjustable"],
    features: [
      "100% Heavy Washed Cotton Twill",
      "High-Density Direct Embroidered Institute Crest",
      "Antique Brass Adjustable Metal Buckle",
      "Embroidered Ventilation Eyelets"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Heavy Washed Cotton Twill",
      gsm: "Heavyweight Structured Twill",
      fit: "6-Panel Structured Crown with Adjustable Buckle",
      print: "High-Density 3D Satin Crest Embroidery"
    }
  },
  {
    id: "netrify-21",
    slug: "nit-raipur-executive-gifting-set",
    name: "NIT Raipur Executive 3-Piece Luxury Dignitary Set",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Executive",
    category: "Stationery & Gifts",
    price: 1499,
    originalPrice: 1999,
    tagline: "Luxury Hardbox • Debossed Leather Diary + Pen + Thermal Flask",
    description: "The ultimate institutional gift for visiting dignitaries, alumni, faculty, and graduating batches. Encased in a custom matte presentation box with precision foam cutouts, containing a debossed vegan-leather journal, metal rollerball pen, and matching vacuum flask.",
    image: "/images/catalog/normalized/nitrr-executive-gifting-set.jpg",
    badge: "Official Dignitary Box",
    colorways: [
      { name: "Institutional Charcoal & Orange", hex: "#222222" }
    ],
    sizes: ["Deluxe Box Set"],
    features: [
      "A5 Premium Faux-Leather Debossed Journal with Magnetic Tab",
      "Executive Weight Balanced Metal Rollerball Pen",
      "500ml Insulated Double-Wall Flask with Institute Crest",
      "Heavyweight Rigid Matte Presentation Gift Box"
    ],
    customizable: true,
    featured: true,
    specs: {
      material: "Matte Rigid Presentation Box + Vegan Leather + Metal",
      gsm: "Institutional Luxury Grade",
      fit: "Deluxe 3-Piece Presentation Box",
      print: "Gold-Foiled Debossed Institutional Seal"
    }
  },
  {
    id: "netrify-22",
    slug: "nit-raipur-stationery-diary-pen-set",
    name: "NIT Raipur Stationery Journal & Rollerball Pen Set",
    club: "National Institute of Technology Raipur",
    clubShort: "NIT Raipur Executive",
    category: "Stationery & Gifts",
    price: 999,
    originalPrice: 1299,
    tagline: "Ruby Red Leather Notebook • Metal Pen • Gift Presentation Box",
    description: "The official executive stationery set. Features a rich ruby-red hardbound journal with gold-foiled 'NIT RAIPUR' embossing, gold-tone magnetic clasp, ribbon bookmark, and a matching red-and-gold executive ballpoint pen.",
    image: "/images/catalog/normalized/nitrr-stationery-diary-pen-set.jpg",
    badge: "Executive Stationery",
    colorways: [
      { name: "Ruby Red & Gold", hex: "#631A1A" }
    ],
    sizes: ["Standard Box Set"],
    features: [
      "A5 Hardbound Executive Diary with 192 Ruled 80 GSM Pages",
      "Gold-Tone Metallic Magnetic Locking Clasp",
      "Smooth-Flow German Ink Metal Ballpoint Pen",
      "Satin Ribbon Bookmark & Expandable Inner Document Pocket"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "Hardbound Leatherette & Balanced Metal Rollerball",
      gsm: "80 GSM Acid-Free Ruled Pages",
      fit: "A5 Standard Notebook Set",
      print: "Gold-Foil Hot Stamped Emblem"
    }
  },
  {
    id: "netrify-23",
    slug: "innovation-cell-ferrari-44-oversized-tee",
    name: "NIT Raipur Innovation Cell Scuderia 44 Oversized Tee",
    club: "Innovation Cell, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Club Exclusive • 240 GSM Oversized Fit • Scuderia 44 Back Print",
    description: "Official Innovation Cell NIT Raipur motorsport drop. Jet black oversized streetwear tee featuring the Innovation Cell front chest emblem and bold Scuderia Ferrari #44 racing typography on the back.",
    image: "/images/merchandise/innovation-cell-ferrari-tee.jpg",
    badge: "Innovation Cell Drop",
    colorways: [
      { name: "Pitch Black & Crimson", hex: "#141416" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Heavyweight Bio-Washed Combed Cotton",
      "Front Left-Chest Innovation Cell Crest",
      "Full-Back Motorsport #44 Graphic Screen Print",
      "Drop-Shoulder Oversized Unisex Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Bio-Washed Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Oversized Fit",
      print: "High-Density Multi-Pass Screen Print"
    }
  },
  {
    id: "netrify-24",
    slug: "innovation-cell-mclaren-01-oversized-tee",
    name: "NIT Raipur Innovation Cell Papaya 01 Oversized Tee",
    club: "Innovation Cell, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Club Exclusive • 240 GSM Oversized Fit • Papaya 01 Back Print",
    description: "Official Innovation Cell NIT Raipur motorsport drop. Heavyweight black oversized tee featuring the Innovation Cell chest crest and signature Papaya Orange #01 back print.",
    image: "/images/merchandise/innovation-cell-mclaren-tee.jpg",
    badge: "Innovation Cell Drop",
    colorways: [
      { name: "Pitch Black & Papaya", hex: "#141416" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Heavyweight Bio-Washed Combed Cotton",
      "Front Left-Chest Innovation Cell Crest",
      "Full-Back Papaya #01 Graphic Screen Print",
      "Drop-Shoulder Oversized Unisex Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Bio-Washed Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Oversized Fit",
      print: "High-Density Multi-Pass Screen Print"
    }
  },
  {
    id: "netrify-25",
    slug: "innovation-cell-mercedes-63-oversized-tee",
    name: "NIT Raipur Innovation Cell Petronas 63 Oversized Tee",
    club: "Innovation Cell, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Club Exclusive • 240 GSM Oversized Fit • Silver Arrows 63 Print",
    description: "Official Innovation Cell NIT Raipur motorsport drop. Heavyweight black oversized tee featuring the Innovation Cell chest emblem and vibrant teal-accented #63 back print.",
    image: "/images/merchandise/innovation-cell-mercedes-tee.jpg",
    badge: "Innovation Cell Drop",
    colorways: [
      { name: "Pitch Black & Teal", hex: "#141416" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Heavyweight Bio-Washed Combed Cotton",
      "Front Left-Chest Innovation Cell Crest",
      "Full-Back Teal #63 Graphic Screen Print",
      "Drop-Shoulder Oversized Unisex Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Bio-Washed Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Oversized Fit",
      print: "High-Density Multi-Pass Screen Print"
    }
  },
  {
    id: "netrify-26",
    slug: "innovation-cell-redbull-03-oversized-tee",
    name: "NIT Raipur Innovation Cell Racing 03 Oversized Tee",
    club: "Innovation Cell, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Club Exclusive • 240 GSM Oversized Fit • Racing 03 Back Print",
    description: "Official Innovation Cell NIT Raipur motorsport drop. Heavyweight black oversized tee featuring the Innovation Cell chest emblem and bold Red Bull Racing #03 back print.",
    image: "/images/merchandise/innovation-cell-redbull-tee.jpg",
    badge: "Innovation Cell Drop",
    colorways: [
      { name: "Pitch Black & Cobalt", hex: "#141416" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM Heavyweight Bio-Washed Combed Cotton",
      "Front Left-Chest Innovation Cell Crest",
      "Full-Back Racing #03 Graphic Screen Print",
      "Drop-Shoulder Oversized Unisex Silhouette"
    ],
    customizable: false,
    featured: false,
    specs: {
      material: "100% Combed Heavy Bio-Washed Cotton",
      gsm: "240 GSM Heavyweight",
      fit: "Drop-Shoulder Oversized Fit",
      print: "High-Density Multi-Pass Screen Print"
    }
  }
];
