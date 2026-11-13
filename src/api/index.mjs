// src/api/middleware.ts
import crypto from "node:crypto";
import { createClerkClient, verifyToken } from "@clerk/backend";

// src/server/db.ts
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

// src/data/products.ts
var PRODUCTS = [
  {
    id: "netrify-1",
    slug: "ecell-varsity-bomber-jacket",
    name: "NIT Raipur E-Cell Official Varsity Bomber Jacket",
    club: "The Entrepreneurship Cell (E-Cell), NIT Raipur",
    clubShort: "E-Cell NITRR",
    category: "Outerwear",
    price: 1199,
    originalPrice: 1599,
    tagline: "380GSM Brushed Heavyweight Fleece \u2022 Custom Back Name Embroidery",
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
    tagline: "Arched Collegiate Lettering \u2022 380GSM Ultra-Soft Fleece",
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
    tagline: "Micro-Ripstop Membrane \u2022 Concealed Storm Zips",
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
    tagline: "Neon Cyberpunk Techwear \u2022 Dual-Sided 8-Pass Screen Print",
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
    tagline: "8-Bit Coffee & Code \u2022 240GSM Bio-Washed Cotton",
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
    tagline: "Holographic Glitch Aesthetic \u2022 National Hackathon Series",
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
    tagline: "Neon Edgerunner Anime \u2022 Competitive Programming Culture",
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
    tagline: "240 GSM Heavyweight Cotton \u2022 Front Pocket Seal \u2022 Oversized Fit",
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
    tagline: "Classic Collegiate Arch \u2022 220 GSM Regular Fit",
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
    tagline: "Architectural Line Art \u2022 Varsity 01 Back Print",
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
    tagline: "'Continuing... Legacy' Back \u2022 Minimalist Front Tower Sketch",
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
    tagline: "Cuban Link Collar Print \u2022 Front Pocket Emblem",
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
    tagline: "Core Engineering Pride \u2022 High-Density Tower Print",
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
    tagline: "Fine Pique Knit \u2022 Embroidered Golden Crest \u2022 Classic Collar",
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
    tagline: "Think. Unite. Lead. Transform. \u2022 Official Chapter Drop",
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
    tagline: "Touch LED Temperature Display \u2022 Double-Wall Vacuum 500ml",
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
    tagline: "350ml Gloss Ceramic \u2022 High-Definition Monogram Seal",
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
    tagline: "Heavy Metal Die-Cast \u2022 Enamel Finish \u2022 Campus Landmarks",
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
    tagline: "High-Gloss Protective Dome \u2022 Official Seal & Champion Ring",
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
    tagline: "100% Washed Cotton Twill \u2022 3D Direct Embroidered Crest",
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
    tagline: "Luxury Hardbox \u2022 Debossed Leather Diary + Pen + Thermal Flask",
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
    tagline: "Ruby Red Leather Notebook \u2022 Metal Pen \u2022 Gift Presentation Box",
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
    tagline: "Club Exclusive \u2022 240 GSM Oversized Fit \u2022 Scuderia 44 Back Print",
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
    tagline: "Club Exclusive \u2022 240 GSM Oversized Fit \u2022 Papaya 01 Back Print",
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
    tagline: "Club Exclusive \u2022 240 GSM Oversized Fit \u2022 Silver Arrows 63 Print",
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
    tagline: "Club Exclusive \u2022 240 GSM Oversized Fit \u2022 Racing 03 Back Print",
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

// src/data/coupons.ts
var INITIAL_COUPONS = [
  {
    code: "NITRR10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 999,
    maxDiscount: 350,
    isActive: true,
    usageCount: 0,
    description: "10% off on orders above \u20B9999 for all students & faculty."
  },
  {
    code: "FREESHIP",
    discountType: "fixed",
    discountValue: 99,
    minOrderAmount: 499,
    isActive: true,
    usageCount: 0,
    description: "Flat \u20B999 waiver covering domestic courier & packing fees."
  },
  {
    code: "ALUMNI20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 1999,
    maxDiscount: 800,
    isActive: true,
    usageCount: 0,
    description: "20% off on premium varsity jackets & archival drops for alumni."
  },
  {
    code: "WELCOME50",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 500,
    isActive: true,
    usageCount: 0,
    description: "Flat \u20B950 off on first campus merchandise order."
  }
];

// src/config/clerk.ts
var RAW_CLERK_PUBLISHABLE_KEY = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY?.trim() || "";
function isValidClerkPublishableKey(key) {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed.startsWith("pk_test_") && !trimmed.startsWith("pk_live_")) {
    return false;
  }
  const parts = trimmed.split("_");
  if (parts.length !== 3 || !parts[2]) {
    return false;
  }
  if (trimmed.includes("your_clerk_publishable_key")) {
    return false;
  }
  try {
    const base64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return decoded.endsWith("$") && decoded.length > 4 && decoded.slice(0, -1).includes(".");
  } catch {
    return false;
  }
}
var IS_CLERK_CONFIGURED = isValidClerkPublishableKey(RAW_CLERK_PUBLISHABLE_KEY);
var CLERK_PUBLISHABLE_KEY = IS_CLERK_CONFIGURED ? RAW_CLERK_PUBLISHABLE_KEY : "";
function getClerkAccountsUrl(key = CLERK_PUBLISHABLE_KEY) {
  if (!isValidClerkPublishableKey(key)) return "";
  try {
    const raw = key.replace(/^pk_(test|live)_/, "").replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(raw).replace(/\$$/, "");
    return `https://${decoded.replace(".clerk.accounts.dev", ".accounts.dev")}`;
  } catch {
    return "";
  }
}
var CLERK_ACCOUNTS_URL = getClerkAccountsUrl();
var ROLE_TITLES = {
  super_admin: "Super Administrator & Store Owner",
  operations_lead: "Operations Lead",
  verification_desk: "Payment Verification Officer",
  hostel_coordinator: "Hostel & Logistics Coordinator"
};
var ROLE_PERMISSIONS = {
  super_admin: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: true,
    manageProducts: true,
    deleteProducts: true,
    manageCoupons: true,
    manageStaff: true,
    manageNewsletter: true
  },
  operations_lead: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: true,
    manageProducts: true,
    deleteProducts: true,
    manageCoupons: true,
    manageStaff: true,
    manageNewsletter: true
  },
  verification_desk: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: false,
    manageProducts: true,
    deleteProducts: false,
    manageCoupons: true,
    manageStaff: false,
    manageNewsletter: true
  },
  hostel_coordinator: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: false,
    manageProducts: true,
    deleteProducts: false,
    manageCoupons: false,
    manageStaff: false,
    manageNewsletter: false
  }
};
function normalizeAdminRole(role) {
  if (role === "super_admin" || role === "operations_lead" || role === "verification_desk" || role === "hostel_coordinator") {
    return role;
  }
  if (role === "admin") return "super_admin";
  if (role === "staff") return "operations_lead";
  return "operations_lead";
}
function getRoleTitleForRole(role) {
  return ROLE_TITLES[role] || ROLE_TITLES.operations_lead;
}
function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.operations_lead;
}

// src/server/staffConfig.ts
var PRIMARY_OWNER_EMAIL = "heyvikrant24@gmail.com";
var STAFF_EMAIL_SEED = [
  "heyvikrant24@gmail.com",
  "admin@nitrrfie.in",
  "operations.head@nitrrfie.in",
  "logistics@nitrrfie.in",
  "store@nitrr.ac.in"
];
function getDefaultRoleForEmail(email) {
  const clean = email.toLowerCase().trim();
  if (clean === PRIMARY_OWNER_EMAIL || clean === "admin@nitrrfie.in") return "super_admin";
  if (clean === "operations.head@nitrrfie.in") return "operations_lead";
  if (clean === "logistics@nitrrfie.in") return "hostel_coordinator";
  if (clean === "store@nitrr.ac.in") return "verification_desk";
  return "operations_lead";
}

// src/server/db.ts
var singletonDb = null;
var singletonDbPath = null;
function ensureDirectoryForFile(filePath) {
  if (filePath === ":memory:" || filePath.startsWith("file:")) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function initializeSchema(db) {
  try {
    db.exec(`PRAGMA journal_mode = WAL;`);
  } catch {
  }
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 50,
      in_stock INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carts (
      user_id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES carts(user_id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_key TEXT NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      size TEXT NOT NULL,
      custom_design_json TEXT,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, product_id, variant_key)
    );

    CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      utr_number TEXT,
      idempotency_key TEXT,
      status TEXT NOT NULL,
      total INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      cancelled_at TEXT,
      cancellation_reason TEXT,
      refund_status TEXT,
      updated_by TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_utr ON orders(utr_number);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      officer_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      details TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

    CREATE TABLE IF NOT EXISTS staff_roster (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      role_title TEXT NOT NULL,
      added_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_meta (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
      consent_given INTEGER NOT NULL DEFAULT 1,
      consent_source TEXT NOT NULL DEFAULT 'newsletter_form',
      unsubscribe_token TEXT NOT NULL UNIQUE,
      confirmation_email_status TEXT NOT NULL DEFAULT 'pending',
      confirmation_message_id TEXT,
      confirmation_sent_at TEXT,
      confirmed_at TEXT,
      brevo_contact_synced INTEGER NOT NULL DEFAULT 0,
      brevo_contact_synced_at TEXT,
      subscribed_at TEXT NOT NULL,
      unsubscribed_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

    CREATE TABLE IF NOT EXISTS support_inquiries (
      id TEXT PRIMARY KEY,
      organization TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      estimated_quantity INTEGER NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_support_inquiries_created_at ON support_inquiries(created_at DESC);
  `);
  const existingCols = new Set(
    db.prepare(`PRAGMA table_info(newsletter_subscribers)`).all().map(
      (col) => col.name
    )
  );
  if (!existingCols.has("confirmed_at")) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN confirmed_at TEXT`);
  }
  if (!existingCols.has("brevo_contact_synced")) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN brevo_contact_synced INTEGER NOT NULL DEFAULT 0`);
  }
  if (!existingCols.has("brevo_contact_synced_at")) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN brevo_contact_synced_at TEXT`);
  }
  const existingOrderCols = new Set(
    db.prepare(`PRAGMA table_info(orders)`).all().map(
      (col) => col.name
    )
  );
  if (!existingOrderCols.has("idempotency_key")) {
    db.exec(`ALTER TABLE orders ADD COLUMN idempotency_key TEXT`);
  }
  if (!existingOrderCols.has("version")) {
    db.exec(`ALTER TABLE orders ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
  }
  if (!existingOrderCols.has("cancelled_at")) {
    db.exec(`ALTER TABLE orders ADD COLUMN cancelled_at TEXT`);
  }
  if (!existingOrderCols.has("cancellation_reason")) {
    db.exec(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
  }
  if (!existingOrderCols.has("refund_status")) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_status TEXT`);
  }
  if (!existingOrderCols.has("updated_by")) {
    db.exec(`ALTER TABLE orders ADD COLUMN updated_by TEXT`);
  }
  const existingProductCols = new Set(
    db.prepare(`PRAGMA table_info(products)`).all().map(
      (col) => col.name
    )
  );
  if (!existingProductCols.has("version")) {
    db.exec(`ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency
    ON orders(idempotency_key)
    WHERE idempotency_key IS NOT NULL
  `);
}
function seedCatalogIfEmpty(db, catalog = PRODUCTS) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO products (
      id, slug, name, price, original_price, stock, in_stock, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const product of catalog) {
    const stock = typeof product.stock === "number" ? Math.max(0, Math.floor(product.stock)) : 50;
    const inStock = product.inStock === false || stock <= 0 ? 0 : 1;
    const normalized = {
      ...product,
      stock,
      inStock: inStock === 1
    };
    insertStmt.run(
      product.id,
      product.slug,
      product.name,
      Math.max(0, Math.round(product.price)),
      Math.max(0, Math.round(product.originalPrice)),
      stock,
      inStock,
      JSON.stringify(normalized),
      now
    );
  }
  const selectExistingStmt = db.prepare(`SELECT data_json FROM products WHERE id = ?`);
  const updateImageStmt = db.prepare(`UPDATE products SET data_json = ?, updated_at = ? WHERE id = ?`);
  for (const product of catalog) {
    const row = selectExistingStmt.get(product.id);
    if (!row) continue;
    try {
      const parsed = JSON.parse(row.data_json);
      let changed = false;
      if (!parsed.image || parsed.image.includes("images.unsplash.com") || parsed.image === "/assets/aistudio/ecell-varsity-jacket_daef387e.png") {
        parsed.image = product.image;
        changed = true;
      }
      if (parsed.secondaryImage && parsed.secondaryImage.includes("images.unsplash.com")) {
        if (product.secondaryImage) {
          parsed.secondaryImage = product.secondaryImage;
        } else {
          delete parsed.secondaryImage;
        }
        changed = true;
      } else if (!parsed.secondaryImage && product.secondaryImage && changed) {
        parsed.secondaryImage = product.secondaryImage;
      }
      if (changed) {
        updateImageStmt.run(JSON.stringify(parsed), now, product.id);
      }
    } catch {
    }
  }
}
function seedAdminFoundationIfEmpty(db) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const couponCount = db.prepare(`SELECT COUNT(*) AS count FROM coupons`).get();
  if (couponCount.count === 0) {
    const insertCoupon = db.prepare(`
      INSERT OR IGNORE INTO coupons (
        code, discount_type, discount_value, min_order_amount, max_discount,
        expires_at, is_active, usage_count, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);
    for (const c of INITIAL_COUPONS) {
      insertCoupon.run(
        c.code.toUpperCase(),
        c.discountType,
        Math.round(c.discountValue),
        Math.round(c.minOrderAmount || 0),
        typeof c.maxDiscount === "number" ? Math.round(c.maxDiscount) : null,
        c.expiresAt || null,
        c.isActive ? 1 : 0,
        c.description,
        now,
        now
      );
    }
  }
  const insertStaff = db.prepare(`
    INSERT OR IGNORE INTO staff_roster (email, role, role_title, added_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const email of STAFF_EMAIL_SEED) {
    const cleanEmail = email.toLowerCase().trim();
    const role = getDefaultRoleForEmail(cleanEmail);
    insertStaff.run(
      cleanEmail,
      role,
      getRoleTitleForRole(role),
      "system",
      now,
      now
    );
  }
  db.prepare(`
    INSERT OR IGNORE INTO admin_meta (id, version, updated_at)
    VALUES ('global', 1, ?)
  `).run(now);
}
function loadDatabaseSyncConstructor() {
  try {
    const req = createRequire(import.meta.url);
    const mod = req("node:sqlite");
    if (!mod?.DatabaseSync) {
      throw new Error("DatabaseSync export is missing from node:sqlite.");
    }
    return mod.DatabaseSync;
  } catch (err) {
    throw new Error(
      `SQLite runtime unavailable (${err?.message || "node:sqlite not supported"}). Ensure Node.js 22.x is selected in Vercel Project Settings -> General -> Node.js Version.`
    );
  }
}
function createStoreDatabase(dbPath) {
  const DatabaseSyncCtor = loadDatabaseSyncConstructor();
  ensureDirectoryForFile(dbPath);
  const db = new DatabaseSyncCtor(dbPath);
  initializeSchema(db);
  seedCatalogIfEmpty(db);
  seedAdminFoundationIfEmpty(db);
  return db;
}
function resolveWritableDbPath() {
  const configured = process.env.STORE_DB_PATH?.trim();
  if (configured) return configured;
  const isServerlessReadOnly = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerlessReadOnly) {
    return path.join(os.tmpdir(), "nitrr-store.db");
  }
  const defaultPath = path.join(process.cwd(), "data", "store.db");
  try {
    ensureDirectoryForFile(defaultPath);
    fs.accessSync(path.dirname(defaultPath), fs.constants.W_OK);
    return defaultPath;
  } catch {
    return path.join(os.tmpdir(), "nitrr-store.db");
  }
}
function getStoreDatabase() {
  const targetPath = resolveWritableDbPath();
  if (singletonDb && singletonDbPath === targetPath) {
    return singletonDb;
  }
  if (singletonDb) {
    try {
      singletonDb.close();
    } catch {
    }
  }
  singletonDb = createStoreDatabase(targetPath);
  singletonDbPath = targetPath;
  return singletonDb;
}
function runInTransaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
    }
    throw err;
  }
}

// src/api/middleware.ts
var ipRateMap = /* @__PURE__ */ new Map();
var RATE_WINDOW_MS = 60 * 1e3;
var clerkUserEmailCache = /* @__PURE__ */ new Map();
var CLERK_EMAIL_CACHE_TTL_MS = 60 * 1e3;
var customTokenVerifier = null;
var jwksCache = /* @__PURE__ */ new Map();
function getClerkFrontendApiFromEnv() {
  const pubKey = (process.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
  if (!isValidClerkPublishableKey(pubKey)) return "";
  try {
    const encoded = pubKey.split("_")[2];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf8").replace(/\$$/, "");
  } catch {
    return "";
  }
}
async function getClerkJwtPublicKeyPem(token, frontendApi) {
  const headerB64 = token.split(".")[0];
  if (!headerB64) return void 0;
  const headerJson = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  const now = Date.now();
  let cached = jwksCache.get(frontendApi);
  if (!cached || cached.expiresAt <= now) {
    const res = await fetch(`https://${frontendApi}/.well-known/jwks.json`);
    if (!res.ok) return void 0;
    const data = await res.json();
    if (!Array.isArray(data.keys)) return void 0;
    cached = { keys: data.keys, expiresAt: now + 10 * 60 * 1e3 };
    jwksCache.set(frontendApi, cached);
  }
  const jwk = cached.keys.find((k) => !headerJson.kid || k.kid === headerJson.kid) || cached.keys[0];
  if (!jwk) return void 0;
  const keyObj = crypto.createPublicKey({ key: jwk, format: "jwk" });
  return keyObj.export({ type: "spki", format: "pem" }).toString();
}
function timingSafeSecretEquals(provided, expected) {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function extractVerifiedClaimEmail(claims) {
  if (!claims) return void 0;
  const candidates = [claims.email, claims.primary_email, claims.email_address];
  for (const val of candidates) {
    if (typeof val === "string" && val.includes("@")) {
      return val.toLowerCase().trim();
    }
  }
  return void 0;
}
async function verifyCustomerSession(req, allowQueryToken = false) {
  let token = "";
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  } else if (allowQueryToken && typeof req.query?.token === "string") {
    token = req.query.token.trim();
  }
  if (!token) {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Authentication required: missing session bearer token."
    };
  }
  try {
    if (customTokenVerifier) {
      const payload = await customTokenVerifier(token);
      if (payload?.sub) {
        return {
          authenticated: true,
          userId: payload.sub,
          email: typeof payload.email === "string" && payload.email.includes("@") ? payload.email.toLowerCase().trim() : void 0
        };
      }
      return { authenticated: false, statusCode: 401, error: "Invalid session token." };
    }
    const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (clerkSecretKey) {
      const verified = await verifyToken(token, { secretKey: clerkSecretKey });
      if (!verified?.sub) {
        return { authenticated: false, statusCode: 401, error: "Invalid Clerk session token." };
      }
      return {
        authenticated: true,
        userId: verified.sub,
        email: extractVerifiedClaimEmail(verified)
      };
    }
    const frontendApi = getClerkFrontendApiFromEnv();
    if (frontendApi) {
      const jwtKey = await getClerkJwtPublicKeyPem(token, frontendApi);
      if (jwtKey) {
        const verified = await verifyToken(token, { jwtKey });
        if (verified?.sub) {
          return {
            authenticated: true,
            userId: verified.sub,
            email: extractVerifiedClaimEmail(verified)
          };
        }
      }
    }
    return {
      authenticated: false,
      statusCode: 401,
      error: "Server cannot verify session token: Clerk keys are not configured."
    };
  } catch {
    return {
      authenticated: false,
      statusCode: 401,
      error: "Session token verification failed or token has expired."
    };
  }
}
async function resolveAuthoritativeClerkEmail(userId) {
  const now = Date.now();
  const cached = clerkUserEmailCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.email;
  }
  const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecretKey) {
    return null;
  }
  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const user = await clerk.users.getUser(userId);
    const primaryRecord = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    const verifiedRecord = primaryRecord?.verification?.status === "verified" ? primaryRecord : user.emailAddresses.find((e) => e.verification?.status === "verified") || primaryRecord;
    const email = verifiedRecord?.emailAddress?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return null;
    }
    clerkUserEmailCache.set(userId, {
      email,
      expiresAt: now + CLERK_EMAIL_CACHE_TTL_MS
    });
    return email;
  } catch {
    return null;
  }
}
function purgeExpiredLimits() {
  const now = Date.now();
  for (const [ip, record] of ipRateMap.entries()) {
    if (now > record.resetTime) {
      ipRateMap.delete(ip);
    }
  }
}
function enforceRateLimit(req, res, maxRequests = 20) {
  purgeExpiredLimits();
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const record = ipRateMap.get(ip);
  if (!record || now > record.resetTime) {
    ipRateMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  record.count += 1;
  if (record.count > maxRequests) {
    res.status(429).json({
      error: "Rate limit exceeded. Please wait a moment before sending more requests."
    });
    return false;
  }
  return true;
}
function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}
function extractHostCandidate(value) {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim().toLowerCase();
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).host.toLowerCase();
    }
    return trimmed.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
function validateOrigin(req, res) {
  const origin = req.headers["origin"];
  if (typeof origin !== "string" || !origin.trim()) {
    return true;
  }
  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    res.status(400).json({ error: "Malformed Origin header." });
    return false;
  }
  if (originHost === "localhost" || originHost.startsWith("localhost:") || originHost === "127.0.0.1" || originHost.startsWith("127.0.0.1:")) {
    return true;
  }
  const allowedHosts = /* @__PURE__ */ new Set();
  const addHost = (raw) => {
    if (!raw) return;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const item of values) {
      for (const part of item.split(",")) {
        const parsed = extractHostCandidate(part);
        if (parsed) allowedHosts.add(parsed);
      }
    }
  };
  addHost(req.headers["host"]);
  addHost(req.headers["x-forwarded-host"]);
  addHost(process.env.APP_URL);
  addHost(process.env.APP_PUBLIC_URL);
  addHost(process.env.ALLOWED_ORIGINS);
  addHost(process.env.VERCEL_URL);
  addHost(process.env.VERCEL_BRANCH_URL);
  addHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (allowedHosts.size > 0 && !allowedHosts.has(originHost)) {
    console.warn("[Security] validateOrigin rejected request:", {
      originHost,
      allowedHosts: Array.from(allowedHosts)
    });
    res.status(403).json({ error: "Forbidden: Untrusted cross-origin request rejected." });
    return false;
  }
  return true;
}
function resolveStaffIdentityByEmail(rawEmail, userId) {
  const cleanEmail = rawEmail.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes("@")) return null;
  try {
    const db = getStoreDatabase();
    const row = db.prepare(`SELECT email, role, role_title FROM staff_roster WHERE email = ? LIMIT 1`).get(cleanEmail);
    if (row) {
      const normalizedRole = normalizeAdminRole(row.role);
      return {
        userId,
        email: row.email,
        role: normalizedRole,
        roleTitle: row.role_title || getRoleTitleForRole(normalizedRole),
        permissions: getPermissionsForRole(normalizedRole)
      };
    }
  } catch {
  }
  const isStaticSeeded = STAFF_EMAIL_SEED.some((e) => e.toLowerCase() === cleanEmail);
  if (isStaticSeeded) {
    const role = getDefaultRoleForEmail(cleanEmail);
    return {
      userId,
      email: cleanEmail,
      role,
      roleTitle: getRoleTitleForRole(role),
      permissions: getPermissionsForRole(role)
    };
  }
  return null;
}
async function resolveStaffFromCustomerSession(session) {
  const verifiedEmail = session.email || await resolveAuthoritativeClerkEmail(session.userId);
  if (!verifiedEmail) {
    return null;
  }
  return resolveStaffIdentityByEmail(verifiedEmail, session.userId);
}
function hasAdminPermission(auth, permission) {
  if (!auth.authorized || !auth.identity) return false;
  const perms = auth.identity.permissions || getPermissionsForRole(auth.identity.role);
  return Boolean(perms[permission]);
}
function buildSuperAdminSystemIdentity() {
  const role = "super_admin";
  return {
    email: PRIMARY_OWNER_EMAIL,
    role,
    roleTitle: getRoleTitleForRole(role),
    permissions: getPermissionsForRole(role)
  };
}
async function verifyAdminSessionAsync(req, allowQueryToken = false) {
  const adminSecretKey = process.env.ADMIN_SECRET_KEY?.trim();
  const customKey = req.headers["x-admin-key"];
  if (adminSecretKey && typeof customKey === "string" && timingSafeSecretEquals(customKey.trim(), adminSecretKey)) {
    return {
      authorized: true,
      identity: buildSuperAdminSystemIdentity()
    };
  }
  let token = "";
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  } else if (allowQueryToken && typeof req.query?.token === "string") {
    token = req.query.token.trim();
  }
  if (!token) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Unauthorized: Missing or invalid Authorization Bearer header."
    };
  }
  if (adminSecretKey && timingSafeSecretEquals(token, adminSecretKey)) {
    return {
      authorized: true,
      identity: buildSuperAdminSystemIdentity()
    };
  }
  const session = await verifyCustomerSession(req, allowQueryToken);
  if (!session.authenticated || !session.userId) {
    return {
      authorized: false,
      statusCode: session.statusCode || 401,
      error: session.error || "Unauthorized: Administrative authentication required."
    };
  }
  const staffIdentity = await resolveStaffFromCustomerSession({
    userId: session.userId,
    email: session.email
  });
  if (!staffIdentity) {
    return {
      authorized: false,
      statusCode: 403,
      error: "Forbidden: Account is not authorized on the staff roster."
    };
  }
  return {
    authorized: true,
    identity: staffIdentity
  };
}

// src/api/health.ts
function handleHealthCheck(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  let dbReady = false;
  try {
    const db = getStoreDatabase();
    db.prepare("SELECT 1").get();
    dbReady = true;
  } catch {
    dbReady = false;
  }
  return res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "healthy" : "degraded",
    database: dbReady ? "connected" : "unavailable",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "NIT Raipur Merchandise & Operations Engine",
    uptime: process.uptime()
  });
}

// src/server/cartEvents.ts
var subscribersByUser = /* @__PURE__ */ new Map();
function subscribeToUserCartEvents(userId, listener) {
  let set = subscribersByUser.get(userId);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    subscribersByUser.set(userId, set);
  }
  set.add(listener);
  return () => {
    const current = subscribersByUser.get(userId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      subscribersByUser.delete(userId);
    }
  };
}
function broadcastUserCartEvent(event) {
  const listeners = subscribersByUser.get(event.userId);
  if (!listeners || listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
    }
  }
}

// src/server/productEvents.ts
var catalogListeners = /* @__PURE__ */ new Set();
function subscribeToCatalogEvents(listener) {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}
function broadcastCatalogEvent(event) {
  if (catalogListeners.size === 0) return;
  for (const listener of catalogListeners) {
    try {
      listener(event);
    } catch {
    }
  }
}

// src/server/cartService.ts
var CartServiceError = class extends Error {
  constructor(message, statusCode = 400, code = "CART_ERROR") {
    super(message);
    this.name = "CartServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
};
function normalizeCustomDesign(design) {
  if (!design || typeof design !== "object") return void 0;
  const text = typeof design.text === "string" ? design.text.trim().slice(0, 40) : "";
  if (!text) return void 0;
  const placement = design.placement === "chest_crest" || design.placement === "sleeve_batch" ? design.placement : "back_embroidery";
  const color = typeof design.color === "string" && design.color.trim() ? design.color.trim() : "#ffffff";
  const fontSize = typeof design.fontSize === "number" && Number.isFinite(design.fontSize) ? Math.min(48, Math.max(8, Math.round(design.fontSize))) : 18;
  return { text, placement, color, fontSize };
}
function buildVariantKey(colorName, size, customDesign) {
  const cleanColor = colorName.trim() || "Standard";
  const cleanSize = size.trim() || "Free Size";
  const normalized = normalizeCustomDesign(customDesign);
  const customPart = normalized ? `${normalized.text.toUpperCase()}::${normalized.placement}::${normalized.color}` : "";
  return `${cleanColor}::${cleanSize}::${customPart}`;
}
function buildCanonicalCartItemId(productId, colorName, size, customDesign) {
  const cleanColor = colorName.trim() || "Standard";
  const cleanSize = size.trim() || "Free Size";
  const normalized = normalizeCustomDesign(customDesign);
  const customKey = normalized ? `-${normalized.text}-${normalized.placement}` : "";
  return `${productId}-${cleanColor}-${cleanSize}${customKey}`;
}
function parseProductRow(row) {
  const parsed = JSON.parse(row.data_json);
  const version = typeof row.version === "number" ? row.version : parsed.version ?? 1;
  return {
    ...parsed,
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    inStock: row.in_stock === 1 && row.stock > 0,
    version
  };
}
function getProductById(db, productId) {
  const row = db.prepare(
    `SELECT id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at
       FROM products WHERE id = ?`
  ).get(productId);
  if (!row) return null;
  return parseProductRow(row);
}
function getAllCatalogProducts(db) {
  const rows = db.prepare(
    `SELECT id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at
       FROM products ORDER BY rowid ASC`
  ).all();
  return rows.map(parseProductRow);
}
var DEFAULT_PRODUCT_IMAGE = "/assets/aistudio/nitrr_new_logo_new_155e66c7.png";
var MAX_PRODUCT_IMAGE_DATA_URL_LENGTH = 15e5;
function sanitizeProductImageUri(raw, fallback, fieldLabel = "Product image") {
  if (raw === void 0 || raw === null) return fallback;
  if (typeof raw !== "string") {
    throw new CartServiceError(`${fieldLabel} must be a valid URL or uploaded image.`, 400, "INVALID_IMAGE");
  }
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length > MAX_PRODUCT_IMAGE_DATA_URL_LENGTH) {
      throw new CartServiceError(
        `${fieldLabel} exceeds the 1MB uploaded image size limit. Please upload a smaller file or use an HTTPS URL.`,
        400,
        "IMAGE_TOO_LARGE"
      );
    }
    return trimmed;
  }
  throw new CartServiceError(
    `${fieldLabel} format is invalid. Use an HTTPS URL, local asset path, or PNG/JPG/WebP image up to 1MB.`,
    400,
    "INVALID_IMAGE"
  );
}
function upsertCatalogProduct(db, product, options = {}) {
  const saved = runInTransaction(db, () => {
    const existingRow = db.prepare(`SELECT id, version FROM products WHERE id = ? LIMIT 1`).get(product.id);
    if (existingRow && typeof options.expectedVersion === "number" && existingRow.version !== options.expectedVersion) {
      throw new CartServiceError(
        `Product "${product.name}" was updated by another administrator. Refreshing latest catalog state.`,
        409,
        "VERSION_CONFLICT"
      );
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const stock = typeof product.stock === "number" ? Math.max(0, Math.floor(product.stock)) : 50;
    const inStock = product.inStock === false || stock <= 0 ? 0 : 1;
    const nextVersion = existingRow ? existingRow.version + 1 : 1;
    const normalized = {
      ...product,
      image: sanitizeProductImageUri(product.image, DEFAULT_PRODUCT_IMAGE, "Primary product image"),
      secondaryImage: sanitizeProductImageUri(product.secondaryImage, void 0, "Secondary product image"),
      price: Math.max(0, Math.round(product.price)),
      originalPrice: Math.max(0, Math.round(product.originalPrice)),
      stock,
      inStock: inStock === 1,
      version: nextVersion
    };
    db.prepare(`
      INSERT INTO products (id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        price = excluded.price,
        original_price = excluded.original_price,
        stock = excluded.stock,
        in_stock = excluded.in_stock,
        version = products.version + 1,
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).run(
      normalized.id,
      normalized.slug,
      normalized.name,
      normalized.price,
      normalized.originalPrice,
      stock,
      inStock,
      nextVersion,
      JSON.stringify(normalized),
      now
    );
    return normalized;
  });
  broadcastCatalogEvent({
    type: "catalog_updated",
    reason: "product_upserted",
    productId: saved.id,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return saved;
}
function deleteCatalogProduct(db, productId) {
  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(productId);
  if (info.changes > 0) {
    broadcastCatalogEvent({
      type: "catalog_updated",
      reason: "product_deleted",
      productId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
function adjustCatalogProductStock(db, productId, delta) {
  const updated = runInTransaction(db, () => {
    const existing = getProductById(db, productId);
    if (!existing) return null;
    const current = existing.stock ?? 50;
    const nextStock = Math.max(0, current + Math.trunc(delta));
    const nextVersion = (existing.version ?? 1) + 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextProduct = {
      ...existing,
      stock: nextStock,
      inStock: nextStock > 0,
      version: nextVersion
    };
    db.prepare(`
      UPDATE products
      SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ?
      WHERE id = ?
    `).run(nextStock, nextStock > 0 ? 1 : 0, nextVersion, JSON.stringify(nextProduct), now, productId);
    return nextProduct;
  });
  if (updated) {
    broadcastCatalogEvent({
      type: "catalog_updated",
      reason: "stock_adjusted",
      productId: updated.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return updated;
}
function ensureUserCartRow(db, userId, now) {
  db.prepare(`
    INSERT OR IGNORE INTO carts (user_id, version, created_at, updated_at)
    VALUES (?, 1, ?, ?)
  `).run(userId, now, now);
  return db.prepare(`SELECT user_id, version, created_at, updated_at FROM carts WHERE user_id = ?`).get(userId);
}
function touchUserCartVersion(db, userId, now) {
  db.prepare(`
    UPDATE carts
    SET version = version + 1, updated_at = ?
    WHERE user_id = ?
  `).run(now, userId);
  const row = db.prepare(`SELECT version FROM carts WHERE user_id = ?`).get(userId);
  return row?.version ?? 1;
}
function resolveColorway(product, colorName, colorHex) {
  const match = product.colorways.find(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (match) return match;
  if (product.colorways.length > 0) {
    return {
      name: colorName.trim() || product.colorways[0].name,
      hex: colorHex || product.colorways[0].hex
    };
  }
  return { name: colorName.trim() || "Standard", hex: colorHex || "#18181b" };
}
function resolveSize(product, requestedSize) {
  const clean = requestedSize.trim();
  const exact = product.sizes.find((s) => s.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;
  if (clean) return clean;
  return product.sizes[0] || "Free Size";
}
function buildFallbackUnavailableProduct(productId) {
  return {
    id: productId,
    slug: productId,
    name: "Unavailable Archive Item",
    club: "NIT Raipur Store",
    clubShort: "Unavailable",
    category: "Archive",
    price: 0,
    originalPrice: 0,
    tagline: "This product is no longer listed in the active catalog.",
    description: "Product removed or unavailable.",
    image: "/assets/aistudio/ecell-varsity-jacket_daef387e.png",
    badge: "Unavailable",
    colorways: [{ name: "Standard", hex: "#18181b" }],
    sizes: ["Free Size"],
    features: [],
    stock: 0,
    inStock: false
  };
}
function hydrateCartRows(db, userId, extraWarnings = []) {
  const cartRow = db.prepare(`SELECT user_id, version, created_at, updated_at FROM carts WHERE user_id = ?`).get(userId);
  const rows = db.prepare(`
      SELECT id, user_id, product_id, variant_key, color_name, color_hex, size,
             custom_design_json, quantity, created_at, updated_at
      FROM cart_items
      WHERE user_id = ?
      ORDER BY created_at ASC, rowid ASC
    `).all(userId);
  const warnings = [...extraWarnings];
  let hasStockIssues = false;
  const items = rows.map((row) => {
    const trustedProduct = getProductById(db, row.product_id);
    const customDesign = row.custom_design_json ? JSON.parse(row.custom_design_json) : void 0;
    if (!trustedProduct) {
      hasStockIssues = true;
      warnings.push(
        `An item (${row.product_id}, ${row.size}) is no longer available in the catalog. Remove it before checkout.`
      );
      return {
        cartItemId: row.id,
        product: buildFallbackUnavailableProduct(row.product_id),
        selectedColor: { name: row.color_name, hex: row.color_hex },
        selectedSize: row.size,
        quantity: row.quantity,
        customDesign,
        availableStock: 0,
        availabilityStatus: "unavailable",
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    const isAvailable = trustedProduct.inStock !== false && availableStock > 0;
    let availabilityStatus = "available";
    if (!isAvailable) {
      availabilityStatus = "out_of_stock";
      hasStockIssues = true;
      warnings.push(
        `"${trustedProduct.name}" (${row.color_name}, ${row.size}) is currently out of stock.`
      );
    } else if (row.quantity > availableStock) {
      hasStockIssues = true;
      warnings.push(
        `Only ${availableStock} unit(s) of "${trustedProduct.name}" are currently in stock (you have ${row.quantity} in your bag).`
      );
    }
    return {
      cartItemId: row.id,
      product: trustedProduct,
      selectedColor: resolveColorway(trustedProduct, row.color_name, row.color_hex),
      selectedSize: row.size,
      quantity: row.quantity,
      customDesign,
      availableStock,
      availabilityStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
  return {
    items,
    version: cartRow?.version ?? 1,
    updatedAt: cartRow?.updated_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    warnings: Array.from(new Set(warnings)),
    hasStockIssues
  };
}
function getUserCart(db, userId) {
  return hydrateCartRows(db, userId);
}
function mergeGuestCart(db, userId, guestItems, sourceClientId) {
  const warnings = [];
  const result = runInTransaction(db, () => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    ensureUserCartRow(db, userId, now);
    const groupedGuest = /* @__PURE__ */ new Map();
    for (const raw of guestItems) {
      if (!raw || typeof raw.productId !== "string" || !raw.productId.trim()) continue;
      const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
      const customDesign = normalizeCustomDesign(raw.customDesign);
      const variantKey = buildVariantKey(raw.colorName || "Standard", raw.size || "Free Size", customDesign);
      const mapKey = `${raw.productId.trim()}::${variantKey}`;
      const existing = groupedGuest.get(mapKey);
      if (existing) {
        existing.quantity += qty;
      } else {
        groupedGuest.set(mapKey, {
          productId: raw.productId.trim(),
          colorName: raw.colorName || "Standard",
          colorHex: raw.colorHex,
          size: raw.size || "Free Size",
          quantity: qty,
          customDesign,
          variantKey
        });
      }
    }
    const selectExistingItem = db.prepare(`
      SELECT id, quantity FROM cart_items
      WHERE user_id = ? AND product_id = ? AND variant_key = ?
    `);
    const insertItem = db.prepare(`
      INSERT INTO cart_items (
        id, user_id, product_id, variant_key, color_name, color_hex, size,
        custom_design_json, quantity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateItemQty = db.prepare(`
      UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?
    `);
    for (const entry of groupedGuest.values()) {
      const trustedProduct = getProductById(db, entry.productId);
      if (!trustedProduct) {
        const canonicalColor = entry.colorName.trim() || "Standard";
        const canonicalSize = entry.size.trim() || "Free Size";
        const variantKey2 = buildVariantKey(canonicalColor, canonicalSize, entry.customDesign);
        const existingRow2 = selectExistingItem.get(userId, entry.productId, variantKey2);
        if (!existingRow2) {
          const itemId = buildCanonicalCartItemId(
            entry.productId,
            canonicalColor,
            canonicalSize,
            entry.customDesign
          );
          insertItem.run(
            itemId,
            userId,
            entry.productId,
            variantKey2,
            canonicalColor,
            entry.colorHex || "#18181b",
            canonicalSize,
            entry.customDesign ? JSON.stringify(entry.customDesign) : null,
            entry.quantity,
            now,
            now
          );
        }
        warnings.push(
          `Item "${entry.productId}" from your guest bag is no longer in the store catalog and needs removal before checkout.`
        );
        continue;
      }
      const resolvedColor = resolveColorway(trustedProduct, entry.colorName, entry.colorHex);
      const resolvedSize = resolveSize(trustedProduct, entry.size);
      const variantKey = buildVariantKey(resolvedColor.name, resolvedSize, entry.customDesign);
      const availableStock = Math.max(0, trustedProduct.stock ?? 50);
      const existingRow = selectExistingItem.get(userId, trustedProduct.id, variantKey);
      if (trustedProduct.inStock === false || availableStock <= 0) {
        if (!existingRow) {
          const itemId = buildCanonicalCartItemId(
            trustedProduct.id,
            resolvedColor.name,
            resolvedSize,
            entry.customDesign
          );
          insertItem.run(
            itemId,
            userId,
            trustedProduct.id,
            variantKey,
            resolvedColor.name,
            resolvedColor.hex,
            resolvedSize,
            entry.customDesign ? JSON.stringify(entry.customDesign) : null,
            entry.quantity,
            now,
            now
          );
        }
        warnings.push(
          `"${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) is currently out of stock.`
        );
        continue;
      }
      if (existingRow) {
        const combinedRaw = existingRow.quantity + entry.quantity;
        const cappedQty = Math.min(availableStock, combinedRaw);
        if (combinedRaw > availableStock) {
          warnings.push(
            `Combined quantity for "${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) was capped at available stock (${availableStock}).`
          );
        }
        updateItemQty.run(cappedQty, now, existingRow.id, userId);
      } else {
        const cappedQty = Math.min(availableStock, entry.quantity);
        if (entry.quantity > availableStock) {
          warnings.push(
            `Quantity for "${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) was adjusted to available stock (${availableStock}).`
          );
        }
        const itemId = buildCanonicalCartItemId(
          trustedProduct.id,
          resolvedColor.name,
          resolvedSize,
          entry.customDesign
        );
        insertItem.run(
          itemId,
          userId,
          trustedProduct.id,
          variantKey,
          resolvedColor.name,
          resolvedColor.hex,
          resolvedSize,
          entry.customDesign ? JSON.stringify(entry.customDesign) : null,
          cappedQty,
          now,
          now
        );
      }
    }
    if (groupedGuest.size > 0) {
      touchUserCartVersion(db, userId, now);
    }
    return hydrateCartRows(db, userId, warnings);
  });
  if (guestItems.length > 0) {
    broadcastUserCartEvent({
      type: "cart_updated",
      userId,
      version: result.version,
      updatedAt: result.updatedAt,
      sourceClientId
    });
  }
  return result;
}
function addOrIncrementCartItem(db, userId, input, sourceClientId) {
  const warnings = [];
  const result = runInTransaction(db, () => {
    const trustedProduct = getProductById(db, input.productId);
    if (!trustedProduct) {
      throw new CartServiceError("Selected product does not exist in store catalog.", 404, "PRODUCT_NOT_FOUND");
    }
    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    if (trustedProduct.inStock === false || availableStock <= 0) {
      throw new CartServiceError(`"${trustedProduct.name}" is currently out of stock.`, 409, "OUT_OF_STOCK");
    }
    const addQty = Math.max(1, Math.floor(Number(input.quantity) || 1));
    const customDesign = normalizeCustomDesign(input.customDesign);
    const resolvedColor = resolveColorway(trustedProduct, input.colorName, input.colorHex);
    const resolvedSize = resolveSize(trustedProduct, input.size);
    const variantKey = buildVariantKey(resolvedColor.name, resolvedSize, customDesign);
    const itemId = buildCanonicalCartItemId(
      trustedProduct.id,
      resolvedColor.name,
      resolvedSize,
      customDesign
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    ensureUserCartRow(db, userId, now);
    const existing = db.prepare(`
        SELECT id, quantity FROM cart_items
        WHERE user_id = ? AND product_id = ? AND variant_key = ?
      `).get(userId, trustedProduct.id, variantKey);
    if (existing) {
      const requestedTotal = existing.quantity + addQty;
      if (existing.quantity >= availableStock) {
        throw new CartServiceError(
          `Maximum available stock (${availableStock}) for "${trustedProduct.name}" is already in your bag.`,
          409,
          "STOCK_LIMIT_REACHED"
        );
      }
      const nextQty = Math.min(availableStock, requestedTotal);
      if (requestedTotal > availableStock) {
        warnings.push(
          `Quantity for "${trustedProduct.name}" (${resolvedSize}) capped at available stock (${availableStock}).`
        );
      }
      db.prepare(`UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(
        nextQty,
        now,
        existing.id,
        userId
      );
    } else {
      const nextQty = Math.min(availableStock, addQty);
      if (addQty > availableStock) {
        warnings.push(
          `Only ${availableStock} unit(s) of "${trustedProduct.name}" available; added ${nextQty}.`
        );
      }
      db.prepare(`
        INSERT INTO cart_items (
          id, user_id, product_id, variant_key, color_name, color_hex, size,
          custom_design_json, quantity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        userId,
        trustedProduct.id,
        variantKey,
        resolvedColor.name,
        resolvedColor.hex,
        resolvedSize,
        customDesign ? JSON.stringify(customDesign) : null,
        nextQty,
        now,
        now
      );
    }
    touchUserCartVersion(db, userId, now);
    return hydrateCartRows(db, userId, warnings);
  });
  broadcastUserCartEvent({
    type: "cart_updated",
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId
  });
  return result;
}
function setCartItemQuantity(db, userId, cartItemId, quantity, sourceClientId) {
  const cleanQty = Math.floor(Number(quantity) || 0);
  if (cleanQty <= 0) {
    return removeCartItem(db, userId, cartItemId, sourceClientId);
  }
  const result = runInTransaction(db, () => {
    const row = db.prepare(`SELECT id, product_id FROM cart_items WHERE id = ? AND user_id = ?`).get(cartItemId, userId);
    if (!row) {
      throw new CartServiceError("Cart item not found for this account.", 404, "CART_ITEM_NOT_FOUND");
    }
    const trustedProduct = getProductById(db, row.product_id);
    if (!trustedProduct || trustedProduct.inStock === false || (trustedProduct.stock ?? 50) <= 0) {
      throw new CartServiceError(
        "This item is currently out of stock or unavailable. Remove it from your bag.",
        409,
        "OUT_OF_STOCK"
      );
    }
    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    if (cleanQty > availableStock) {
      throw new CartServiceError(
        `Only ${availableStock} unit(s) of "${trustedProduct.name}" are available in stock.`,
        409,
        "STOCK_LIMIT_REACHED"
      );
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(
      cleanQty,
      now,
      cartItemId,
      userId
    );
    touchUserCartVersion(db, userId, now);
    return hydrateCartRows(db, userId);
  });
  broadcastUserCartEvent({
    type: "cart_updated",
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId
  });
  return result;
}
function removeCartItem(db, userId, cartItemId, sourceClientId) {
  const result = runInTransaction(db, () => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    ensureUserCartRow(db, userId, now);
    const info = db.prepare(`DELETE FROM cart_items WHERE id = ? AND user_id = ?`).run(cartItemId, userId);
    if (info.changes > 0) {
      touchUserCartVersion(db, userId, now);
    }
    return hydrateCartRows(db, userId);
  });
  broadcastUserCartEvent({
    type: "cart_updated",
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId
  });
  return result;
}
function clearUserCart(db, userId, sourceClientId) {
  const result = runInTransaction(db, () => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    ensureUserCartRow(db, userId, now);
    db.prepare(`DELETE FROM cart_items WHERE user_id = ?`).run(userId);
    touchUserCartVersion(db, userId, now);
    return hydrateCartRows(db, userId);
  });
  broadcastUserCartEvent({
    type: "cart_updated",
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId
  });
  return result;
}
function validateGuestCartItems(db, guestItems) {
  const warnings = [];
  let hasStockIssues = false;
  const validatedItems = [];
  for (const raw of guestItems) {
    if (!raw || typeof raw.productId !== "string") continue;
    const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
    const customDesign = normalizeCustomDesign(raw.customDesign);
    const trustedProduct = getProductById(db, raw.productId.trim());
    if (!trustedProduct) {
      hasStockIssues = true;
      warnings.push(`Product "${raw.productId}" is no longer available in the store catalog.`);
      validatedItems.push({
        cartItemId: buildCanonicalCartItemId(raw.productId, raw.colorName || "Standard", raw.size || "Free Size", customDesign),
        product: buildFallbackUnavailableProduct(raw.productId),
        selectedColor: { name: raw.colorName || "Standard", hex: raw.colorHex || "#18181b" },
        selectedSize: raw.size || "Free Size",
        quantity: qty,
        customDesign,
        availableStock: 0,
        availabilityStatus: "unavailable"
      });
      continue;
    }
    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    const resolvedColor = resolveColorway(trustedProduct, raw.colorName || "Standard", raw.colorHex);
    const resolvedSize = resolveSize(trustedProduct, raw.size || "Free Size");
    let availabilityStatus = "available";
    if (trustedProduct.inStock === false || availableStock <= 0) {
      availabilityStatus = "out_of_stock";
      hasStockIssues = true;
      warnings.push(`"${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) is out of stock.`);
    } else if (qty > availableStock) {
      hasStockIssues = true;
      warnings.push(`Only ${availableStock} unit(s) of "${trustedProduct.name}" are currently in stock.`);
    }
    validatedItems.push({
      cartItemId: buildCanonicalCartItemId(trustedProduct.id, resolvedColor.name, resolvedSize, customDesign),
      product: trustedProduct,
      selectedColor: resolvedColor,
      selectedSize: resolvedSize,
      quantity: qty,
      customDesign,
      availableStock,
      availabilityStatus
    });
  }
  return {
    items: validatedItems,
    version: 1,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    warnings: Array.from(new Set(warnings)),
    hasStockIssues
  };
}

// src/server/adminEvents.ts
import crypto2 from "node:crypto";
var adminListeners = /* @__PURE__ */ new Set();
function subscribeToAdminEvents(listener) {
  adminListeners.add(listener);
  return () => {
    adminListeners.delete(listener);
  };
}
function broadcastAdminEvent(event) {
  if (adminListeners.size === 0) return;
  for (const listener of adminListeners) {
    try {
      listener(event);
    } catch {
    }
  }
}
function getAdminMeta(db) {
  const row = db.prepare(`SELECT version, updated_at FROM admin_meta WHERE id = 'global'`).get();
  if (!row) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`INSERT OR IGNORE INTO admin_meta (id, version, updated_at) VALUES ('global', 1, ?)`).run(
      now
    );
    return { version: 1, updatedAt: now };
  }
  return { version: row.version, updatedAt: row.updated_at };
}
function bumpAdminVersion(db, reason, actorEmail, targetId, sourceClientId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO admin_meta (id, version, updated_at)
    VALUES ('global', 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      version = admin_meta.version + 1,
      updated_at = excluded.updated_at
  `).run(now);
  const meta = getAdminMeta(db);
  broadcastAdminEvent({
    type: "admin_updated",
    reason,
    version: meta.version,
    updatedAt: meta.updatedAt,
    actorEmail,
    targetId,
    sourceClientId
  });
  return meta;
}
function recordAuditLog(db, entry) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = `log-${Date.now()}-${crypto2.randomUUID().slice(0, 8)}`;
  const officerEmail = (entry.officerEmail || "system").toLowerCase().trim();
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, officer_email, action, target_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, now, officerEmail, entry.action, entry.targetId || null, entry.details);
  return {
    id,
    timestamp: now,
    officerEmail,
    action: entry.action,
    targetId: entry.targetId,
    details: entry.details
  };
}

// src/server/orderService.ts
var OrderServiceError = class extends Error {
  constructor(message, statusCode = 400, code = "ORDER_ERROR") {
    super(message);
    this.name = "OrderServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
};
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
}
function sanitizeReceiptDataUrl(raw) {
  if (typeof raw !== "string") return void 0;
  const trimmed = raw.trim();
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return void 0;
  }
  if (trimmed.length > 6e5) return void 0;
  return trimmed;
}
function parseOrderRow(row) {
  const parsed = JSON.parse(row.payload_json);
  return {
    ...parsed,
    id: row.id,
    status: row.status || parsed.status,
    total: typeof row.total === "number" ? row.total : parsed.total,
    version: typeof row.version === "number" ? row.version : parsed.version ?? 1,
    idempotencyKey: row.idempotency_key || parsed.idempotencyKey,
    cancelledAt: row.cancelled_at || parsed.cancelledAt,
    cancellationReason: row.cancellation_reason || parsed.cancellationReason,
    refundStatus: row.refund_status || parsed.refundStatus,
    updatedBy: row.updated_by || parsed.updatedBy,
    updatedAt: row.updated_at || parsed.updatedAt
  };
}
function parseCouponRow(row) {
  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderAmount: row.min_order_amount,
    maxDiscount: row.max_discount ?? void 0,
    expiresAt: row.expires_at ?? void 0,
    isActive: row.is_active === 1,
    usageCount: row.usage_count,
    description: row.description
  };
}
function parseStaffRow(row) {
  const role = normalizeAdminRole(row.role);
  return {
    email: row.email,
    role,
    roleTitle: row.role_title || getRoleTitleForRole(role),
    isProtectedOwner: row.email.toLowerCase().trim() === PRIMARY_OWNER_EMAIL,
    addedBy: row.added_by ?? void 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function maskCustomerName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "Student";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
function maskUtrNumber(utr) {
  if (!utr) return void 0;
  const clean = utr.trim();
  if (clean.length <= 4) return "\u2022\u2022\u2022\u2022";
  return `${"\u2022".repeat(Math.min(8, clean.length - 4))}${clean.slice(-4)}`;
}
function toPublicTrackedOrder(order) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    customerName: maskCustomerName(order.customerName),
    rollNumber: order.rollNumber,
    handoverType: order.handoverType,
    deliveryAddress: order.deliveryAddress ? {
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      pincode: order.deliveryAddress.pincode
    } : void 0,
    hostelDetails: order.hostelDetails ? {
      hostelName: order.hostelDetails.hostelName
    } : void 0,
    items: order.items.map((item) => ({
      name: item.name,
      color: item.color,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    })),
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    verificationStatus: order.verificationStatus,
    utrNumber: maskUtrNumber(order.utrNumber),
    verifiedBy: order.verifiedBy,
    verifiedAt: order.verifiedAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason
  };
}
function restoreOrderInventory(db, items, now) {
  const byProduct = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (!item.productId) continue;
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (qty > 0) {
      byProduct.set(item.productId, (byProduct.get(item.productId) || 0) + qty);
    }
  }
  for (const [productId, restoreQty] of byProduct.entries()) {
    const product = getProductById(db, productId);
    if (!product) continue;
    const nextStock = Math.max(0, (product.stock ?? 0) + restoreQty);
    const nextInStock = nextStock > 0 ? 1 : 0;
    const nextVersion = (product.version ?? 1) + 1;
    const updatedProduct = {
      ...product,
      stock: nextStock,
      inStock: nextInStock === 1,
      version: nextVersion
    };
    db.prepare(
      `UPDATE products SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ? WHERE id = ?`
    ).run(nextStock, nextInStock, nextVersion, JSON.stringify(updatedProduct), now, productId);
  }
}
function validateCouponForSubtotal(db, rawCode, subtotal) {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    return { valid: false, discountAmount: 0, error: "Please enter a coupon code." };
  }
  const row = db.prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`).get(code);
  if (!row) {
    return { valid: false, discountAmount: 0, error: "Invalid or unrecognized coupon code." };
  }
  const coupon = parseCouponRow(row);
  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, error: "This coupon code is currently inactive." };
  }
  if (coupon.expiresAt) {
    const expiresMs = Date.parse(coupon.expiresAt);
    if (Number.isFinite(expiresMs) && expiresMs < Date.now()) {
      return { valid: false, discountAmount: 0, error: "This coupon code has expired." };
    }
  }
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (safeSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order value of \u20B9${coupon.minOrderAmount} required for this code.`
    };
  }
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(safeSubtotal * coupon.discountValue / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(safeSubtotal, Math.max(0, discountAmount));
  return { valid: true, coupon, discountAmount };
}
function createGenuineOrder(db, payload, authContext) {
  const customerName = sanitizeString(payload.customerName);
  const email = sanitizeString(payload.email).toLowerCase();
  const phone = sanitizeString(payload.phone).replace(/\D/g, "");
  if (!customerName || customerName.length < 2) {
    throw new OrderServiceError("Customer name is required (min 2 characters).", 400, "INVALID_NAME");
  }
  if (!email || !email.includes("@") || email.length > 100) {
    throw new OrderServiceError("A valid email address is required.", 400, "INVALID_EMAIL");
  }
  if (phone.length < 10) {
    throw new OrderServiceError("A valid 10-digit mobile number is required.", 400, "INVALID_PHONE");
  }
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new OrderServiceError("Order must include at least one item.", 400, "EMPTY_ORDER");
  }
  const handoverType = payload.handoverType || "makerspace_desk";
  if (!["makerspace_desk", "home_delivery", "hostel_delivery"].includes(handoverType)) {
    throw new OrderServiceError("Invalid handover type specified.", 400, "INVALID_HANDOVER");
  }
  if (handoverType === "home_delivery" || handoverType === "hostel_delivery") {
    const addr = payload.deliveryAddress;
    if (!addr || !sanitizeString(addr.addressLine) || !sanitizeString(addr.city) || !sanitizeString(addr.state) || !sanitizeString(addr.pincode)) {
      throw new OrderServiceError(
        "Delivery address, city, state, and PIN code are required for courier delivery.",
        400,
        "MISSING_ADDRESS"
      );
    }
  }
  const paymentMethod = payload.paymentMethod === "cash_at_desk" ? "cash_at_desk" : "upi_razorpay";
  const cleanRoll = sanitizeString(payload.rollNumber).toUpperCase();
  const cleanUtr = paymentMethod === "upi_razorpay" ? sanitizeString(payload.utrNumber) : "";
  const cleanReceipt = paymentMethod === "upi_razorpay" ? sanitizeReceiptDataUrl(payload.paymentReceiptImage) : void 0;
  const cleanIdempotencyKey = sanitizeString(payload.idempotencyKey).slice(0, 120) || void 0;
  if (cleanUtr && !(/^[0-9]{12}$/.test(cleanUtr) || /^[A-Za-z0-9]{10,18}$/.test(cleanUtr))) {
    throw new OrderServiceError(
      "UPI Reference/UTR must be a valid 12-digit or 10\u201318 character alphanumeric transaction ID.",
      400,
      "INVALID_UTR"
    );
  }
  const txResult = runInTransaction(db, () => {
    if (cleanIdempotencyKey) {
      const existingByKey = db.prepare(`SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1`).get(cleanIdempotencyKey);
      if (existingByKey) {
        return { order: parseOrderRow(existingByKey), idempotentReplay: true };
      }
    }
    if (cleanUtr) {
      const dupUtr = db.prepare(`SELECT id FROM orders WHERE utr_number = ? AND status != 'cancelled' LIMIT 1`).get(cleanUtr);
      if (dupUtr) {
        throw new OrderServiceError(
          "This UPI UTR has already been registered with another order. Duplicate payment proof rejected.",
          409,
          "DUPLICATE_UTR"
        );
      }
    }
    const requestedByProduct = /* @__PURE__ */ new Map();
    const orderItems = [];
    for (let idx = 0; idx < payload.items.length; idx++) {
      const item = payload.items[idx];
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const trustedProduct = getProductById(db, item.productId);
      if (!trustedProduct) {
        throw new OrderServiceError(
          `Product "${sanitizeString(item.name) || item.productId}" is no longer available.`,
          409,
          "PRODUCT_UNAVAILABLE"
        );
      }
      const availableStock = Math.max(0, trustedProduct.stock ?? 50);
      const totalRequestedForProduct = (requestedByProduct.get(trustedProduct.id) || 0) + qty;
      requestedByProduct.set(trustedProduct.id, totalRequestedForProduct);
      if (trustedProduct.inStock === false || availableStock <= 0) {
        throw new OrderServiceError(`"${trustedProduct.name}" is out of stock.`, 409, "OUT_OF_STOCK");
      }
      if (totalRequestedForProduct > availableStock) {
        throw new OrderServiceError(
          `Insufficient inventory for "${trustedProduct.name}": requested ${totalRequestedForProduct}, available ${availableStock}.`,
          409,
          "INSUFFICIENT_STOCK"
        );
      }
      const customDesign = normalizeCustomDesign(item.customDesign);
      orderItems.push({
        id: item.productId || `item-${idx + 1}`,
        productId: trustedProduct.id,
        name: trustedProduct.name,
        color: sanitizeString(item.color) || trustedProduct.colorways[0]?.name || "Standard",
        size: sanitizeString(item.size) || trustedProduct.sizes[0] || "Free Size",
        price: trustedProduct.price,
        quantity: qty,
        image: trustedProduct.image || "/assets/aistudio/nitrr_new_logo_new_155e66c7.png",
        customDesign
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const [productId, qty] of requestedByProduct.entries()) {
      const prod = getProductById(db, productId);
      const nextStock = Math.max(0, (prod.stock ?? 50) - qty);
      const nextInStock = nextStock > 0 ? 1 : 0;
      const nextVersion = (prod.version ?? 1) + 1;
      const updatedJson = JSON.stringify({
        ...prod,
        stock: nextStock,
        inStock: nextInStock === 1,
        version: nextVersion
      });
      db.prepare(
        `UPDATE products SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ? WHERE id = ?`
      ).run(nextStock, nextInStock, nextVersion, updatedJson, now, productId);
    }
    const calculatedSubtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const cleanCoupon = sanitizeString(payload.couponCode).toUpperCase() || void 0;
    let discountAmount = 0;
    let appliedCouponCode;
    if (cleanCoupon) {
      const couponCheck = validateCouponForSubtotal(db, cleanCoupon, calculatedSubtotal);
      if (!couponCheck.valid || !couponCheck.coupon) {
        throw new OrderServiceError(
          couponCheck.error || "Coupon code is invalid or no longer eligible for this order.",
          400,
          "INVALID_COUPON"
        );
      }
      discountAmount = couponCheck.discountAmount;
      appliedCouponCode = couponCheck.coupon.code;
      db.prepare(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = ? WHERE code = ?`).run(
        now,
        couponCheck.coupon.code
      );
    }
    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);
    let orderId = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const randomSuffix = Math.floor(1e4 + Math.random() * 9e4);
      const candidate = `NITRR-${(/* @__PURE__ */ new Date()).getFullYear()}-${randomSuffix}`;
      const clash = db.prepare(`SELECT 1 FROM orders WHERE id = ? LIMIT 1`).get(candidate);
      if (!clash) {
        orderId = candidate;
        break;
      }
    }
    if (!orderId) {
      orderId = `NITRR-${(/* @__PURE__ */ new Date()).getFullYear()}-${Date.now().toString().slice(-6)}`;
    }
    const paymentStatus = paymentMethod === "cash_at_desk" ? "pay_on_handover" : "pending_verification";
    const verificationStatus = paymentMethod === "cash_at_desk" ? "unverified" : cleanUtr ? "utr_submitted" : cleanReceipt ? "whatsapp_verified" : "unverified";
    const order = {
      id: orderId,
      createdAt: now,
      customerName,
      rollNumber: cleanRoll,
      email,
      phone,
      handoverType,
      deliveryAddress: handoverType === "home_delivery" || handoverType === "hostel_delivery" ? {
        addressLine: sanitizeString(payload.deliveryAddress?.addressLine),
        city: sanitizeString(payload.deliveryAddress?.city),
        state: sanitizeString(payload.deliveryAddress?.state),
        pincode: sanitizeString(payload.deliveryAddress?.pincode),
        landmark: sanitizeString(payload.deliveryAddress?.landmark)
      } : void 0,
      pickupDeskDetails: handoverType === "makerspace_desk" ? {
        desk: "Makerspace Desk (Ground Floor, Main Bldg)",
        timing: "4:00 PM \u2013 7:30 PM (Mon\u2013Sat)"
      } : void 0,
      hostelDetails: handoverType === "hostel_delivery" && payload.hostelDetails ? {
        hostelName: sanitizeString(payload.hostelDetails.hostelName),
        roomNumber: sanitizeString(payload.hostelDetails.roomNumber)
      } : void 0,
      items: orderItems,
      subtotal: calculatedSubtotal,
      discountAmount: discountAmount > 0 ? discountAmount : void 0,
      couponCode: appliedCouponCode,
      handoverFee: 0,
      total: finalTotal,
      status: "confirmed",
      paymentMethod,
      paymentStatus,
      verificationStatus,
      utrNumber: cleanUtr || void 0,
      paymentReceiptImage: cleanReceipt,
      whatsappVerified: Boolean(cleanReceipt),
      version: 1,
      idempotencyKey: cleanIdempotencyKey,
      refundStatus: "none",
      updatedAt: now
    };
    db.prepare(`
      INSERT INTO orders (
        id, user_id, utr_number, idempotency_key, status, total, version,
        cancelled_at, cancellation_reason, refund_status, updated_by,
        payload_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'none', NULL, ?, ?, ?)
    `).run(
      order.id,
      authContext.authenticatedUserId || null,
      order.utrNumber || null,
      cleanIdempotencyKey || null,
      order.status,
      order.total,
      1,
      JSON.stringify(order),
      now,
      now
    );
    recordAuditLog(db, {
      officerEmail: email,
      action: "ORDER_CREATED",
      targetId: order.id,
      details: `Genuine customer order placed for \u20B9${order.total} (${order.items.length} line item(s), ${paymentMethod === "cash_at_desk" ? "Cash at Desk" : cleanUtr ? `UTR ${cleanUtr} awaiting verification` : "UPI awaiting verification"}).`
    });
    return { order, idempotentReplay: false };
  });
  if (!txResult.idempotentReplay) {
    if (authContext.authenticatedUserId) {
      clearUserCart(db, authContext.authenticatedUserId, authContext.sourceClientId);
    }
    bumpAdminVersion(db, "order_created", email, txResult.order.id, authContext.sourceClientId);
    broadcastCatalogEvent({
      type: "catalog_updated",
      reason: "order_stock_reserved",
      updatedAt: txResult.order.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return txResult;
}
function verifyOrderPayment(db, params) {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId) {
    throw new OrderServiceError("orderId is required for payment verification.", 400, "MISSING_ORDER_ID");
  }
  const cleanUtr = sanitizeString(params.utrNumber);
  const txResult = runInTransaction(db, () => {
    const row = db.prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`).get(cleanOrderId);
    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} was not found.`, 404, "ORDER_NOT_FOUND");
    }
    if (typeof params.expectedVersion === "number" && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was modified by another administrator. Please review the refreshed state.`,
        409,
        "VERSION_CONFLICT"
      );
    }
    const current = parseOrderRow(row);
    if (current.status === "cancelled") {
      throw new OrderServiceError(
        "Cannot verify payment on a cancelled order.",
        409,
        "ORDER_CANCELLED"
      );
    }
    if (cleanUtr) {
      const dupUtr = db.prepare(`SELECT id FROM orders WHERE utr_number = ? AND id != ? AND status != 'cancelled' LIMIT 1`).get(cleanUtr, cleanOrderId);
      if (dupUtr) {
        throw new OrderServiceError(
          `UTR ${cleanUtr} is already assigned to order ${dupUtr.id}.`,
          409,
          "DUPLICATE_UTR"
        );
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextVersion = row.version + 1;
    const nextStatus = current.status === "confirmed" ? "preparing" : current.status;
    const nextUtr = cleanUtr || current.utrNumber || "Verified by Officer";
    const updated = {
      ...current,
      utrNumber: nextUtr,
      verificationStatus: "desk_verified",
      paymentStatus: "paid",
      status: nextStatus,
      verifiedBy: params.verifiedByLabel,
      verifiedAt: now,
      version: nextVersion,
      updatedBy: params.actorEmail,
      updatedAt: now
    };
    db.prepare(`
      UPDATE orders
      SET utr_number = ?, status = ?, version = ?, updated_by = ?, payload_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.utrNumber || null,
      updated.status,
      nextVersion,
      params.actorEmail,
      JSON.stringify(updated),
      now,
      cleanOrderId
    );
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: "PAYMENT_VERIFIED",
      targetId: cleanOrderId,
      details: `Verified payment${updated.utrNumber ? ` (UTR ${updated.utrNumber})` : ""} and marked order as paid.`
    });
    return updated;
  });
  const meta = bumpAdminVersion(
    db,
    "payment_verified",
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );
  return { order: txResult, version: meta.version };
}
function bulkVerifyPendingOrders(db, params) {
  const verifiedOrders = runInTransaction(db, () => {
    const rows = db.prepare(`SELECT * FROM orders WHERE status != 'cancelled' ORDER BY created_at DESC`).all();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedList = [];
    for (const row of rows) {
      const order = parseOrderRow(row);
      if (order.verificationStatus !== "utr_submitted") continue;
      const nextVersion = row.version + 1;
      const nextStatus = order.status === "confirmed" ? "preparing" : order.status;
      const updated = {
        ...order,
        verificationStatus: "desk_verified",
        paymentStatus: "paid",
        status: nextStatus,
        verifiedBy: params.verifiedByLabel,
        verifiedAt: now,
        version: nextVersion,
        updatedBy: params.actorEmail,
        updatedAt: now
      };
      db.prepare(`
        UPDATE orders
        SET status = ?, version = ?, updated_by = ?, payload_json = ?, updated_at = ?
        WHERE id = ?
      `).run(updated.status, nextVersion, params.actorEmail, JSON.stringify(updated), now, order.id);
      updatedList.push(updated);
    }
    if (updatedList.length > 0) {
      recordAuditLog(db, {
        officerEmail: params.actorEmail,
        action: "PAYMENT_VERIFIED",
        targetId: updatedList.map((o) => o.id).join(", "),
        details: `Bulk verified ${updatedList.length} pending UTR order(s).`
      });
    }
    return updatedList;
  });
  const meta = verifiedOrders.length > 0 ? bumpAdminVersion(db, "bulk_verify_payments", params.actorEmail, void 0, params.sourceClientId) : getAdminMeta(db);
  return {
    verifiedCount: verifiedOrders.length,
    orders: verifiedOrders,
    version: meta.version
  };
}
var VALID_ORDER_STATUSES = [
  "confirmed",
  "preparing",
  "ready_for_handover",
  "delivered",
  "cancelled"
];
function updateOrderStatusAdmin(db, params) {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId || !VALID_ORDER_STATUSES.includes(params.status)) {
    throw new OrderServiceError("Valid orderId and order status are required.", 400, "INVALID_STATUS");
  }
  const updated = runInTransaction(db, () => {
    const row = db.prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`).get(cleanOrderId);
    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} not found.`, 404, "ORDER_NOT_FOUND");
    }
    if (typeof params.expectedVersion === "number" && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was updated by another administrator. Syncing latest state.`,
        409,
        "VERSION_CONFLICT"
      );
    }
    const current = parseOrderRow(row);
    if (current.status === "cancelled" && params.status !== "cancelled") {
      throw new OrderServiceError(
        "Cancelled orders cannot be reactivated after inventory restoration.",
        409,
        "ALREADY_CANCELLED"
      );
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextVersion = row.version + 1;
    const isCancelling = current.status !== "cancelled" && params.status === "cancelled";
    let nextOrder = {
      ...current,
      status: params.status,
      version: nextVersion,
      updatedBy: params.actorEmail,
      updatedAt: now
    };
    if (isCancelling) {
      restoreOrderInventory(db, current.items, now);
      const reason = sanitizeString(params.cancellationReason) || "Cancelled by store administrator";
      const refundNeeded = current.paymentStatus === "paid";
      nextOrder = {
        ...nextOrder,
        cancelledAt: now,
        cancellationReason: reason,
        refundStatus: refundNeeded ? "pending" : "none",
        refundAmount: refundNeeded ? current.total : 0
      };
    }
    db.prepare(`
      UPDATE orders
      SET status = ?, version = ?, cancelled_at = ?, cancellation_reason = ?,
          refund_status = ?, updated_by = ?, payload_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      nextOrder.status,
      nextVersion,
      nextOrder.cancelledAt || null,
      nextOrder.cancellationReason || null,
      nextOrder.refundStatus || "none",
      params.actorEmail,
      JSON.stringify(nextOrder),
      now,
      cleanOrderId
    );
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: isCancelling ? "ORDER_CANCELLED" : "ORDER_STATUS_UPDATE",
      targetId: cleanOrderId,
      details: isCancelling ? `Cancelled order and restored stock (${nextOrder.cancellationReason}).${nextOrder.refundStatus === "pending" ? ` Refund \u20B9${nextOrder.refundAmount} flagged as pending.` : ""}` : `Updated order status from ${current.status} to ${params.status}.`
    });
    return nextOrder;
  });
  const meta = bumpAdminVersion(
    db,
    params.status === "cancelled" ? "order_cancelled" : "order_status_updated",
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );
  if (params.status === "cancelled") {
    broadcastCatalogEvent({
      type: "catalog_updated",
      reason: "order_cancelled_stock_restored",
      updatedAt: meta.updatedAt
    });
  }
  return { order: updated, version: meta.version };
}
function deleteOrderAdmin(db, params) {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId) {
    throw new OrderServiceError("orderId is required to delete an order record.", 400, "MISSING_ORDER_ID");
  }
  runInTransaction(db, () => {
    const row = db.prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`).get(cleanOrderId);
    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} not found.`, 404, "ORDER_NOT_FOUND");
    }
    if (typeof params.expectedVersion === "number" && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was modified by another administrator before deletion.`,
        409,
        "VERSION_CONFLICT"
      );
    }
    const order = parseOrderRow(row);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (order.status !== "cancelled") {
      restoreOrderInventory(db, order.items, now);
    }
    db.prepare(`DELETE FROM orders WHERE id = ?`).run(cleanOrderId);
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: "ORDER_DELETED",
      targetId: cleanOrderId,
      details: `Deleted order record (${order.customerName}, \u20B9${order.total})${order.status !== "cancelled" ? " and restored stock" : ""}.`
    });
  });
  const meta = bumpAdminVersion(
    db,
    "order_deleted",
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );
  broadcastCatalogEvent({
    type: "catalog_updated",
    reason: "order_deleted_stock_restored",
    updatedAt: meta.updatedAt
  });
  return { deletedOrderId: cleanOrderId, version: meta.version };
}
function listOrdersAdmin(db) {
  const rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
  return rows.map(parseOrderRow);
}
function listCustomerOrders(db, userId) {
  const rows = db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
  return rows.map(parseOrderRow);
}
function lookupPublicTrackedOrder(db, rawQuery) {
  const q = sanitizeString(rawQuery);
  if (!q) return null;
  const upper = q.toUpperCase();
  const digits = q.replace(/\D/g, "");
  const byId = db.prepare(`SELECT * FROM orders WHERE UPPER(id) = ? LIMIT 1`).get(upper);
  if (byId) return toPublicTrackedOrder(parseOrderRow(byId));
  const rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
  for (const row of rows) {
    const order = parseOrderRow(row);
    if (order.rollNumber && order.rollNumber.toUpperCase() === upper) {
      return toPublicTrackedOrder(order);
    }
    if (digits.length === 10 && order.phone.replace(/\D/g, "").endsWith(digits)) {
      return toPublicTrackedOrder(order);
    }
  }
  return null;
}
function listCoupons(db) {
  const rows = db.prepare(`SELECT * FROM coupons ORDER BY created_at DESC, code ASC`).all();
  return rows.map(parseCouponRow);
}
function createCouponAdmin(db, input, actorEmail, sourceClientId) {
  const code = sanitizeString(input.code).toUpperCase().replace(/\s+/g, "");
  if (!code || code.length < 3) {
    throw new OrderServiceError("Coupon code must be at least 3 characters.", 400, "INVALID_COUPON");
  }
  const discountType = input.discountType === "fixed" ? "fixed" : "percentage";
  const discountValue = Math.max(1, Math.round(Number(input.discountValue) || 0));
  if (discountType === "percentage" && discountValue > 90) {
    throw new OrderServiceError("Percentage discount cannot exceed 90%.", 400, "INVALID_COUPON");
  }
  const minOrderAmount = Math.max(0, Math.round(Number(input.minOrderAmount) || 0));
  const maxDiscount = typeof input.maxDiscount === "number" && input.maxDiscount > 0 ? Math.round(input.maxDiscount) : void 0;
  const expiresAt = sanitizeString(input.expiresAt) || void 0;
  const description = sanitizeString(input.description) || `${code} official promotion`;
  const created = runInTransaction(db, () => {
    const existing = db.prepare(`SELECT code FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (existing) {
      throw new OrderServiceError(`Coupon code "${code}" already exists.`, 409, "COUPON_EXISTS");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO coupons (
        code, discount_type, discount_value, min_order_amount, max_discount,
        expires_at, is_active, usage_count, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount ?? null,
      expiresAt ?? null,
      input.isActive === false ? 0 : 1,
      description,
      now,
      now
    );
    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: "COUPON_CREATED",
      targetId: code,
      details: `Created promo code ${code} (${discountType === "percentage" ? `${discountValue}%` : `\u20B9${discountValue}`} off, min order \u20B9${minOrderAmount}).`
    });
    const row = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code);
    return parseCouponRow(row);
  });
  const meta = bumpAdminVersion(db, "coupon_created", actorEmail, code, sourceClientId);
  return { coupon: created, version: meta.version };
}
function toggleCouponAdmin(db, rawCode, actorEmail, sourceClientId) {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError("Coupon code is required.", 400, "INVALID_COUPON");
  }
  const toggled = runInTransaction(db, () => {
    const row = db.prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (!row) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, "COUPON_NOT_FOUND");
    }
    const nextActive = row.is_active === 1 ? 0 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`UPDATE coupons SET is_active = ?, updated_at = ? WHERE code = ?`).run(
      nextActive,
      now,
      code
    );
    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: "COUPON_TOGGLED",
      targetId: code,
      details: `${nextActive === 1 ? "Activated" : "Deactivated"} promo code ${code}.`
    });
    const updated = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code);
    return parseCouponRow(updated);
  });
  const meta = bumpAdminVersion(db, "coupon_toggled", actorEmail, code, sourceClientId);
  return { coupon: toggled, version: meta.version };
}
function updateCouponAdmin(db, rawCode, updates, actorEmail, sourceClientId) {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError("Coupon code is required.", 400, "INVALID_COUPON");
  }
  const updated = runInTransaction(db, () => {
    const row = db.prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (!row) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, "COUPON_NOT_FOUND");
    }
    const discountType = updates.discountType === "fixed" || updates.discountType === "percentage" ? updates.discountType : row.discount_type;
    const discountValue = updates.discountValue !== void 0 ? Math.max(1, Math.round(Number(updates.discountValue) || 0)) : row.discount_value;
    if (discountType === "percentage" && discountValue > 90) {
      throw new OrderServiceError("Percentage discount cannot exceed 90%.", 400, "INVALID_COUPON");
    }
    const minOrderAmount = updates.minOrderAmount !== void 0 ? Math.max(0, Math.round(Number(updates.minOrderAmount) || 0)) : row.min_order_amount;
    const maxDiscount = discountType === "fixed" ? null : updates.maxDiscount !== void 0 ? typeof updates.maxDiscount === "number" && updates.maxDiscount > 0 ? Math.round(updates.maxDiscount) : null : row.max_discount;
    const expiresAt = updates.expiresAt !== void 0 ? sanitizeString(updates.expiresAt) || null : row.expires_at;
    const isActive = updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : row.is_active;
    const description = updates.description !== void 0 ? sanitizeString(updates.description) || `${code} official promotion` : row.description;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      UPDATE coupons
      SET discount_type = ?, discount_value = ?, min_order_amount = ?, max_discount = ?,
          expires_at = ?, is_active = ?, description = ?, updated_at = ?
      WHERE code = ?
    `).run(
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiresAt,
      isActive,
      description,
      now,
      code
    );
    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: "COUPON_UPDATED",
      targetId: code,
      details: `Updated promo code ${code} (${discountType === "percentage" ? `${discountValue}%` : `\u20B9${discountValue}`} off, min order \u20B9${minOrderAmount}, ${isActive ? "active" : "disabled"}).`
    });
    const nextRow = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code);
    return parseCouponRow(nextRow);
  });
  const meta = bumpAdminVersion(db, "coupon_updated", actorEmail, code, sourceClientId);
  return { coupon: updated, version: meta.version };
}
function deleteCouponAdmin(db, rawCode, actorEmail, sourceClientId) {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError("Coupon code is required.", 400, "INVALID_COUPON");
  }
  runInTransaction(db, () => {
    const existing = db.prepare(`SELECT code FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (!existing) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, "COUPON_NOT_FOUND");
    }
    db.prepare(`DELETE FROM coupons WHERE code = ?`).run(code);
    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: "COUPON_DELETED",
      targetId: code,
      details: `Deleted promo code ${code} from catalog promotions.`
    });
  });
  const meta = bumpAdminVersion(db, "coupon_deleted", actorEmail, code, sourceClientId);
  return { deletedCode: code, version: meta.version };
}
function listStaffRoster(db) {
  const rows = db.prepare(`SELECT * FROM staff_roster ORDER BY created_at ASC, email ASC`).all();
  return rows.map(parseStaffRow);
}
function addStaffMemberAdmin(db, params) {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email || !email.includes("@")) {
    throw new OrderServiceError("A valid institutional email address is required.", 400, "INVALID_EMAIL");
  }
  const role = normalizeAdminRole(params.role || "operations_lead");
  const roleTitle = getRoleTitleForRole(role);
  const member = runInTransaction(db, () => {
    const existing = db.prepare(`SELECT email FROM staff_roster WHERE email = ? LIMIT 1`).get(email);
    if (existing) {
      throw new OrderServiceError(`${email} is already registered on the staff roster.`, 409, "STAFF_EXISTS");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO staff_roster (email, role, role_title, added_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, role, roleTitle, params.actorEmail, now, now);
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: "STAFF_ADDED",
      targetId: email,
      details: `Added ${email} to central staff roster as ${roleTitle}.`
    });
    const row = db.prepare(`SELECT * FROM staff_roster WHERE email = ?`).get(email);
    return parseStaffRow(row);
  });
  const meta = bumpAdminVersion(db, "staff_added", params.actorEmail, email, params.sourceClientId);
  return { staff: member, version: meta.version };
}
function updateStaffRoleAdmin(db, params) {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email || !email.includes("@")) {
    throw new OrderServiceError("Valid staff email is required.", 400, "INVALID_EMAIL");
  }
  if (email === PRIMARY_OWNER_EMAIL) {
    throw new OrderServiceError(
      "Primary owner role is permanently locked to Super Administrator.",
      403,
      "PROTECTED_OWNER"
    );
  }
  const role = normalizeAdminRole(params.role);
  const roleTitle = getRoleTitleForRole(role);
  const updated = runInTransaction(db, () => {
    const existing = db.prepare(`SELECT * FROM staff_roster WHERE email = ? LIMIT 1`).get(email);
    if (!existing) {
      throw new OrderServiceError(`${email} was not found on the staff roster.`, 404, "STAFF_NOT_FOUND");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`UPDATE staff_roster SET role = ?, role_title = ?, updated_at = ? WHERE email = ?`).run(
      role,
      roleTitle,
      now,
      email
    );
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: "STAFF_ROLE_UPDATED",
      targetId: email,
      details: `Updated ${email} role from ${existing.role_title} to ${roleTitle}.`
    });
    const row = db.prepare(`SELECT * FROM staff_roster WHERE email = ?`).get(email);
    return parseStaffRow(row);
  });
  const meta = bumpAdminVersion(db, "staff_role_updated", params.actorEmail, email, params.sourceClientId);
  return { staff: updated, version: meta.version };
}
function removeStaffMemberAdmin(db, params) {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email) {
    throw new OrderServiceError("Staff email is required.", 400, "INVALID_EMAIL");
  }
  if (email === PRIMARY_OWNER_EMAIL) {
    throw new OrderServiceError("Primary owner account cannot be removed.", 403, "PROTECTED_OWNER");
  }
  if (email === params.actorEmail.toLowerCase().trim()) {
    throw new OrderServiceError("You cannot remove your own active staff account.", 400, "SELF_REMOVE_BLOCKED");
  }
  runInTransaction(db, () => {
    const existing = db.prepare(`SELECT email FROM staff_roster WHERE email = ? LIMIT 1`).get(email);
    if (!existing) {
      throw new OrderServiceError(`${email} is not on the staff roster.`, 404, "STAFF_NOT_FOUND");
    }
    db.prepare(`DELETE FROM staff_roster WHERE email = ?`).run(email);
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: "STAFF_REMOVED",
      targetId: email,
      details: `Removed ${email} from central staff roster.`
    });
  });
  const meta = bumpAdminVersion(db, "staff_removed", params.actorEmail, email, params.sourceClientId);
  return { removedEmail: email, version: meta.version };
}
function listAuditLogs(db, limit = 150) {
  const rows = db.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`).all(limit);
  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    officerEmail: row.officer_email,
    action: row.action,
    targetId: row.target_id ?? void 0,
    details: row.details
  }));
}
function parseBoundaryMs(raw, isEnd) {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms2 = Date.parse(`${trimmed}${isEnd ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
    return Number.isFinite(ms2) ? ms2 : null;
  }
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}
function computeAdminDashboard(db, filters = {}) {
  const allOrders = listOrdersAdmin(db);
  const products = getAllCatalogProducts(db);
  const coupons = listCoupons(db);
  const auditLogs = listAuditLogs(db);
  const staffRoster = listStaffRoster(db);
  const meta = getAdminMeta(db);
  const fromMs = parseBoundaryMs(filters.from, false);
  const toMs = parseBoundaryMs(filters.to, true);
  const orders = allOrders.filter((o) => {
    const createdMs = Date.parse(o.createdAt);
    if (!Number.isFinite(createdMs)) return true;
    if (fromMs !== null && createdMs < fromMs) return false;
    if (toMs !== null && createdMs > toMs) return false;
    return true;
  });
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const lowStockCount = products.filter((p) => {
    const stock = Math.max(0, p.stock ?? 50);
    return p.inStock !== false && stock > 0 && stock <= 5;
  }).length;
  const outOfStockCount = products.filter((p) => p.inStock === false || (p.stock ?? 50) <= 0).length;
  const stats = {
    totalCount: orders.length,
    confirmedCount: orders.filter((o) => o.status === "confirmed").length,
    pendingVerificationCount: activeOrders.filter((o) => o.paymentStatus !== "paid").length,
    preparingCount: orders.filter((o) => o.status === "preparing").length,
    readyCount: orders.filter((o) => o.status === "ready_for_handover").length,
    deliveredCount: orders.filter((o) => o.status === "delivered").length,
    cancelledCount: orders.filter((o) => o.status === "cancelled").length,
    hostelDeliveries: activeOrders.filter((o) => o.handoverType === "hostel_delivery").length,
    courierDeliveries: activeOrders.filter((o) => o.handoverType === "home_delivery").length,
    deskPickups: activeOrders.filter((o) => o.handoverType === "makerspace_desk").length,
    verifiedPayments: activeOrders.filter((o) => o.paymentStatus === "paid").length,
    grossRevenue: activeOrders.reduce((sum, o) => sum + o.total, 0),
    verifiedRevenue: activeOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
    pendingRevenue: activeOrders.filter((o) => o.paymentStatus !== "paid").reduce((sum, o) => sum + o.total, 0),
    lowStockCount,
    outOfStockCount
  };
  const customerMap = /* @__PURE__ */ new Map();
  for (const order of orders) {
    const key = (order.email || order.rollNumber || order.id).toLowerCase().trim();
    const isCancelled = order.status === "cancelled";
    const existing = customerMap.get(key);
    if (!existing) {
      customerMap.set(key, {
        id: key,
        name: order.customerName,
        rollNumber: order.rollNumber,
        email: order.email,
        phone: order.phone,
        orderCount: isCancelled ? 0 : 1,
        totalSpent: isCancelled ? 0 : order.total,
        lastOrderDate: order.createdAt,
        lastDeliveryType: order.handoverType,
        lastOrderStatus: order.status
      });
    } else {
      if (!isCancelled) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
      }
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt;
        existing.lastDeliveryType = order.handoverType;
        existing.lastOrderStatus = order.status;
      }
    }
  }
  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate)
  );
  const alerts = [];
  const pendingUtrCount = activeOrders.filter((o) => o.verificationStatus === "utr_submitted").length;
  if (pendingUtrCount > 0) {
    alerts.push({
      id: "alert-pending-utr",
      severity: "warning",
      title: `${pendingUtrCount} UPI payment(s) awaiting officer verification`,
      description: "Verify submitted 12-digit UTR numbers in Verification Desk before dispatching.",
      targetTab: "verification"
    });
  }
  const pendingRefundCount = orders.filter(
    (o) => o.status === "cancelled" && o.refundStatus === "pending"
  ).length;
  if (pendingRefundCount > 0) {
    alerts.push({
      id: "alert-pending-refunds",
      severity: "critical",
      title: `${pendingRefundCount} cancelled paid order(s) require refund settlement`,
      description: "Review cancelled orders in the Order Ledger to process customer refunds.",
      targetTab: "orders"
    });
  }
  if (outOfStockCount > 0) {
    alerts.push({
      id: "alert-out-of-stock",
      severity: "critical",
      title: `${outOfStockCount} catalog SKU(s) are currently out of stock`,
      description: "Restock or archive depleted items in the Inventory tab.",
      targetTab: "inventory"
    });
  } else if (lowStockCount > 0) {
    alerts.push({
      id: "alert-low-stock",
      severity: "warning",
      title: `${lowStockCount} catalog SKU(s) running low (\u2264 5 units left)`,
      description: "Check stock levels in the Inventory tab to prevent checkout shortages.",
      targetTab: "inventory"
    });
  }
  return {
    orders,
    stats,
    products,
    coupons,
    customers,
    auditLogs,
    staffRoster,
    alerts,
    meta: {
      version: meta.version,
      updatedAt: meta.updatedAt,
      from: filters.from || null,
      to: filters.to || null
    }
  };
}

// src/api/orders.ts
function getSourceClientId(req) {
  const raw = req.headers["x-client-instance-id"];
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 80) : void 0;
}
async function handleOrderProcessing(req, res) {
  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 45)) return;
  const method = req.method?.toUpperCase();
  const db = getStoreDatabase();
  const sourceClientId = getSourceClientId(req);
  if (method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Malformed JSON payload." });
      }
    }
    const payload = body || {};
    const customerAuth = await verifyCustomerSession(req, false);
    const authenticatedUserId = customerAuth.authenticated ? customerAuth.userId : void 0;
    try {
      const { order, idempotentReplay } = createGenuineOrder(db, payload, {
        authenticatedUserId,
        sourceClientId
      });
      return res.status(idempotentReplay ? 200 : 201).json({
        success: true,
        order,
        idempotentReplay,
        message: idempotentReplay ? "Existing order retrieved for idempotent checkout attempt." : "Order processed and registered securely on server."
      });
    } catch (err) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code
        });
      }
      return res.status(err?.statusCode || 400).json({
        error: err?.message || "Unable to process order.",
        code: err?.code
      });
    }
  }
  if (method === "GET") {
    const action = typeof req.query?.action === "string" ? req.query.action : "";
    if (action === "validate_coupon") {
      const code = typeof req.query?.code === "string" ? req.query.code : "";
      const subtotal = Number(req.query?.subtotal || 0);
      const validation = validateCouponForSubtotal(db, code, subtotal);
      return res.status(200).json({
        success: true,
        ...validation,
        discount: validation.discountAmount,
        message: validation.valid ? `Coupon ${validation.coupon?.code || ""} applied.` : validation.error || "Invalid coupon code."
      });
    }
    const trackQuery = typeof req.query?.track === "string" ? req.query.track.trim() : "";
    if (trackQuery) {
      const trackedOrder = lookupPublicTrackedOrder(db, trackQuery);
      if (!trackedOrder) {
        return res.status(404).json({
          success: false,
          error: "No matching order found. Please verify your Order ID, Roll Number, or Phone."
        });
      }
      return res.status(200).json({
        success: true,
        order: trackedOrder
      });
    }
    const scope = typeof req.query?.scope === "string" ? req.query.scope : "";
    if (scope === "mine") {
      const custAuth = await verifyCustomerSession(req, false);
      if (!custAuth.authenticated || !custAuth.userId) {
        return res.status(custAuth.statusCode || 401).json({ error: custAuth.error });
      }
      return res.status(200).json({
        success: true,
        orders: listCustomerOrders(db, custAuth.userId)
      });
    }
    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized) {
      return res.status(auth.statusCode || 401).json({ error: auth.error });
    }
    return res.status(200).json({
      success: true,
      orders: listOrdersAdmin(db),
      officer: auth.identity,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (method === "PATCH") {
    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized) {
      return res.status(auth.statusCode || 401).json({ error: auth.error });
    }
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Malformed JSON payload." });
      }
    }
    const { orderId, status, cancellationReason, expectedVersion } = body || {};
    if (!orderId || !status) {
      return res.status(400).json({ error: "Missing orderId or status in update payload." });
    }
    const requiredPermission = status === "cancelled" ? "cancelOrders" : "updateOrderStatus";
    if (!hasAdminPermission(auth, requiredPermission)) {
      return res.status(403).json({
        error: `Forbidden: Role "${auth.identity?.roleTitle || auth.identity?.role}" lacks permission for this action.`
      });
    }
    try {
      const result = updateOrderStatusAdmin(db, {
        orderId,
        status,
        cancellationReason,
        expectedVersion: typeof expectedVersion === "number" ? expectedVersion : void 0,
        actorEmail: auth.identity?.email || "system",
        sourceClientId
      });
      return res.status(200).json({
        success: true,
        order: result.order,
        orderId: result.order.id,
        status: result.order.status,
        metaVersion: result.version,
        updatedBy: auth.identity?.email
      });
    } catch (err) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || "Unable to update order status." });
    }
  }
  res.setHeader("Allow", "GET, POST, PATCH");
  return res.status(405).json({ error: `Method ${method} Not Allowed on /api/orders.` });
}

// src/api/admin.ts
function getSourceClientId2(req) {
  const raw = req.headers["x-client-instance-id"];
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 80) : void 0;
}
function getSubPath(req) {
  const url = req.originalUrl || req.url || "";
  const cleanUrl = url.split("?")[0];
  const idx = cleanUrl.indexOf("/api/admin");
  if (idx === -1) return "";
  return cleanUrl.slice(idx + "/api/admin".length);
}
async function handleAdminEventsStream(req, res) {
  if (!validateOrigin(req, res)) return;
  const auth = await verifyAdminSessionAsync(req, true);
  if (!auth.authorized) {
    return res.status(auth.statusCode || 401).json({ error: auth.error || "Unauthorized" });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  const db = getStoreDatabase();
  const meta = getAdminMeta(db);
  res.write(
    `retry: 30000
event: connected
data: ${JSON.stringify({
      version: meta.version,
      updatedAt: meta.updatedAt,
      officerEmail: auth.identity?.email
    })}

`
  );
  if (process.env.VERCEL === "1") {
    res.end();
    return;
  }
  const unsubscribe = subscribeToAdminEvents((event) => {
    try {
      res.write(`event: admin_updated
data: ${JSON.stringify(event)}

`);
    } catch {
    }
  });
  const keepAlive = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}
async function handleAdminOperations(req, res) {
  const subPath = getSubPath(req);
  const method = req.method?.toUpperCase() || "GET";
  if (method === "GET" && (subPath === "/events" || subPath === "/events/" || req.query?.stream === "events")) {
    return handleAdminEventsStream(req, res);
  }
  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 90)) return;
  let db;
  try {
    db = getStoreDatabase();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Central store database unavailable.",
      code: "DB_UNAVAILABLE"
    });
  }
  const sourceClientId = getSourceClientId2(req);
  if (method === "GET" && req.query?.action === "me") {
    const auth2 = await verifyAdminSessionAsync(req, false);
    if (auth2.authorized && auth2.identity) {
      return res.status(200).json({
        success: true,
        authorized: true,
        identity: auth2.identity
      });
    }
    const session = await verifyCustomerSession(req, false);
    if (!session.authenticated || !session.userId) {
      return res.status(session.statusCode || 401).json({
        success: false,
        authorized: false,
        error: session.error || "Authentication required."
      });
    }
    const identity = await resolveStaffFromCustomerSession({
      userId: session.userId,
      email: session.email
    });
    return res.status(200).json({
      success: true,
      authorized: Boolean(identity),
      identity: identity || void 0
    });
  }
  const auth = await verifyAdminSessionAsync(req, false);
  if (!auth.authorized || !auth.identity) {
    return res.status(auth.statusCode || 401).json({
      error: auth.error || "Access Denied: Administrative authorization required."
    });
  }
  const actorEmail = auth.identity.email || "system";
  const verifiedByLabel = auth.identity.roleTitle ? `${actorEmail} (${auth.identity.roleTitle})` : actorEmail;
  if (method === "GET") {
    if (!hasAdminPermission(auth, "viewDashboard")) {
      return res.status(403).json({ error: "Forbidden: Missing dashboard read permission." });
    }
    const from = typeof req.query?.from === "string" ? req.query.from : void 0;
    const to = typeof req.query?.to === "string" ? req.query.to : void 0;
    const dashboard = computeAdminDashboard(db, { from, to });
    return res.status(200).json({
      success: true,
      officer: auth.identity,
      dashboard,
      system: {
        serverTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
        clerkIntegration: "active",
        environment: process.env.NODE_ENV || "production"
      },
      message: "Centralized admin dashboard synced."
    });
  }
  if (method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Malformed JSON payload." });
      }
    }
    const payload = body || {};
    const { action } = payload;
    try {
      if (action === "verify_payment") {
        if (!hasAdminPermission(auth, "verifyPayments")) {
          return res.status(403).json({
            error: "Forbidden: Your role does not allow verifying payments."
          });
        }
        const { order, version } = verifyOrderPayment(db, {
          orderId: payload.orderId,
          utrNumber: payload.utrNumber,
          expectedVersion: typeof payload.expectedVersion === "number" ? payload.expectedVersion : void 0,
          verifiedByLabel,
          actorEmail,
          sourceClientId
        });
        return res.status(200).json({
          success: true,
          orderId: order.id,
          order,
          action: "verify_payment",
          verificationStatus: order.verificationStatus,
          paymentStatus: order.paymentStatus,
          utrNumber: order.utrNumber,
          verifiedBy: order.verifiedBy,
          verifiedAt: order.verifiedAt,
          metaVersion: version
        });
      }
      if (action === "bulk_verify_payments") {
        if (!hasAdminPermission(auth, "verifyPayments")) {
          return res.status(403).json({
            error: "Forbidden: Your role does not allow bulk payment verification."
          });
        }
        const result = bulkVerifyPendingOrders(db, {
          verifiedByLabel,
          actorEmail,
          sourceClientId
        });
        return res.status(200).json({
          success: true,
          verifiedCount: result.verifiedCount,
          orders: result.orders,
          metaVersion: result.version
        });
      }
      if (action === "update_order_status" || action === "cancel_order") {
        const targetStatus = action === "cancel_order" ? "cancelled" : payload.status;
        const requiredPerm = targetStatus === "cancelled" ? "cancelOrders" : "updateOrderStatus";
        if (!hasAdminPermission(auth, requiredPerm)) {
          return res.status(403).json({
            error: "Forbidden: Your role does not have permission for this order action."
          });
        }
        const result = updateOrderStatusAdmin(db, {
          orderId: payload.orderId,
          status: targetStatus,
          cancellationReason: payload.cancellationReason,
          expectedVersion: typeof payload.expectedVersion === "number" ? payload.expectedVersion : void 0,
          actorEmail,
          sourceClientId
        });
        return res.status(200).json({
          success: true,
          order: result.order,
          metaVersion: result.version
        });
      }
      if (action === "create_coupon") {
        if (!hasAdminPermission(auth, "manageCoupons")) {
          return res.status(403).json({
            error: "Forbidden: Your role cannot create promotional coupons."
          });
        }
        const result = createCouponAdmin(db, payload.coupon || payload, actorEmail, sourceClientId);
        return res.status(201).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version
        });
      }
      if (action === "toggle_coupon") {
        if (!hasAdminPermission(auth, "manageCoupons")) {
          return res.status(403).json({
            error: "Forbidden: Your role cannot modify promotional coupons."
          });
        }
        const result = toggleCouponAdmin(db, payload.code, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version
        });
      }
      if (action === "update_coupon") {
        if (!hasAdminPermission(auth, "manageCoupons")) {
          return res.status(403).json({
            error: "Forbidden: Your role cannot edit promotional coupons."
          });
        }
        const updates = payload.updates || payload.coupon || payload;
        const targetCode = payload.code || updates?.code;
        const result = updateCouponAdmin(db, targetCode, updates, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version
        });
      }
      if (action === "delete_coupon") {
        if (!hasAdminPermission(auth, "manageCoupons")) {
          return res.status(403).json({
            error: "Forbidden: Your role cannot delete promotional coupons."
          });
        }
        const result = deleteCouponAdmin(db, payload.code, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          deletedCode: result.deletedCode,
          metaVersion: result.version
        });
      }
      if (action === "add_staff") {
        if (!hasAdminPermission(auth, "manageStaff")) {
          return res.status(403).json({
            error: "Forbidden: Only Super Administrators or Operations Leads can manage staff access."
          });
        }
        const result = addStaffMemberAdmin(db, {
          email: payload.email,
          role: payload.role,
          actorEmail,
          sourceClientId
        });
        return res.status(201).json({
          success: true,
          staff: result.staff,
          metaVersion: result.version
        });
      }
      if (action === "update_staff_role") {
        if (!hasAdminPermission(auth, "manageStaff")) {
          return res.status(403).json({
            error: "Forbidden: Only Super Administrators or Operations Leads can update staff roles."
          });
        }
        const result = updateStaffRoleAdmin(db, {
          email: payload.email,
          role: payload.role,
          actorEmail,
          sourceClientId
        });
        return res.status(200).json({
          success: true,
          staff: result.staff,
          metaVersion: result.version
        });
      }
      if (action === "remove_staff") {
        if (!hasAdminPermission(auth, "manageStaff")) {
          return res.status(403).json({
            error: "Forbidden: Only Super Administrators or Operations Leads can remove staff access."
          });
        }
        const result = removeStaffMemberAdmin(db, {
          email: payload.email,
          actorEmail,
          sourceClientId
        });
        return res.status(200).json({
          success: true,
          removedEmail: result.removedEmail,
          metaVersion: result.version
        });
      }
      return res.status(400).json({ error: `Unsupported admin action: ${action}` });
    } catch (err) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || "Unable to execute admin operation." });
    }
  }
  if (method === "DELETE") {
    if (!hasAdminPermission(auth, "deleteOrders")) {
      return res.status(403).json({
        error: "Forbidden: Your role cannot permanently delete orders. Use Cancel Order instead."
      });
    }
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Malformed JSON payload." });
      }
    }
    const orderId = body?.orderId || req.query?.orderId;
    const expectedVersion = typeof body?.expectedVersion === "number" ? body.expectedVersion : void 0;
    try {
      const result = deleteOrderAdmin(db, {
        orderId,
        expectedVersion,
        actorEmail,
        sourceClientId
      });
      return res.status(200).json({
        success: true,
        deletedOrderId: result.deletedOrderId,
        deletedBy: actorEmail,
        metaVersion: result.version,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || "Failed to delete order." });
    }
  }
  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: `Method ${method} Not Allowed on /api/admin.` });
}

// src/checkout/checkoutLogic.ts
var STORE_UPI_ID = import.meta.env?.VITE_STORE_UPI_ID || "nitrrfie.store@sbi";
var COORDINATOR_PHONE = import.meta.env?.VITE_COORDINATOR_PHONE || "917974766166";

// src/utils/cartLogic.ts
function calculateCartTotals(items, discountAmount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const cleanDiscount = Math.max(0, discountAmount);
  const totalSavings = Math.max(0, originalSubtotal - subtotal) + cleanDiscount;
  const handoverFee = 0;
  const total = Math.max(0, subtotal - cleanDiscount) + handoverFee;
  return {
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal,
    originalSubtotal,
    discountAmount: cleanDiscount,
    totalSavings,
    handoverFee,
    total
  };
}

// src/api/cart.ts
function parseJsonBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  return body || {};
}
function getSourceClientId3(req) {
  const raw = req.headers["x-client-instance-id"];
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 80) : void 0;
}
function getSubPath2(req) {
  const url = req.originalUrl || req.url || "";
  const cleanUrl = url.split("?")[0];
  const idx = cleanUrl.indexOf("/api/cart");
  if (idx === -1) return "";
  return cleanUrl.slice(idx + "/api/cart".length);
}
async function handleCartEvents(req, res) {
  if (!validateOrigin(req, res)) return;
  const auth = await verifyCustomerSession(req, true);
  if (!auth.authenticated || !auth.userId) {
    return res.status(auth.statusCode || 401).json({ error: auth.error || "Unauthorized" });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  const db = getStoreDatabase();
  const initialCart = getUserCart(db, auth.userId);
  res.write(
    `retry: 30000
event: connected
data: ${JSON.stringify({
      version: initialCart.version,
      updatedAt: initialCart.updatedAt
    })}

`
  );
  if (process.env.VERCEL === "1") {
    res.end();
    return;
  }
  const unsubscribe = subscribeToUserCartEvents(auth.userId, (event) => {
    res.write(`event: cart_updated
data: ${JSON.stringify(event)}

`);
  });
  const keepAlive = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}
async function handleCartOperations(req, res) {
  const subPath = getSubPath2(req);
  const method = req.method?.toUpperCase() || "GET";
  if (subPath === "/events" && method === "GET") {
    return handleCartEvents(req, res);
  }
  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 120)) return;
  const db = getStoreDatabase();
  if (subPath === "/validate" && method === "POST") {
    try {
      const body = parseJsonBody(req);
      const guestItems = Array.isArray(body.items) ? body.items : [];
      const payload = validateGuestCartItems(db, guestItems);
      const totals = calculateCartTotals(payload.items);
      return res.status(200).json({ success: true, ...payload, totals });
    } catch {
      return res.status(400).json({ error: "Malformed cart validation payload." });
    }
  }
  const auth = await verifyCustomerSession(req, false);
  if (!auth.authenticated || !auth.userId) {
    return res.status(auth.statusCode || 401).json({
      error: auth.error || "Authentication required to access your saved cart."
    });
  }
  const userId = auth.userId;
  const sourceClientId = getSourceClientId3(req);
  try {
    if ((subPath === "" || subPath === "/") && method === "GET") {
      const cart = getUserCart(db, userId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    if (subPath === "/merge" && method === "POST") {
      const body = parseJsonBody(req);
      const guestItems = Array.isArray(body.items) ? body.items : [];
      const cart = mergeGuestCart(db, userId, guestItems, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    if (subPath === "/items" && method === "POST") {
      const body = parseJsonBody(req);
      if (!body.productId || typeof body.productId !== "string") {
        return res.status(400).json({ error: "productId is required." });
      }
      const cart = addOrIncrementCartItem(
        db,
        userId,
        {
          productId: body.productId,
          colorName: typeof body.colorName === "string" ? body.colorName : "Standard",
          colorHex: typeof body.colorHex === "string" ? body.colorHex : void 0,
          size: typeof body.size === "string" ? body.size : "Free Size",
          quantity: Number(body.quantity) || 1,
          customDesign: body.customDesign
        },
        sourceClientId
      );
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    if (subPath === "/items" && method === "PATCH") {
      const body = parseJsonBody(req);
      const cartItemId = typeof body.cartItemId === "string" ? body.cartItemId.trim() : "";
      if (!cartItemId) {
        return res.status(400).json({ error: "cartItemId is required." });
      }
      const quantity = Number(body.quantity);
      if (!Number.isFinite(quantity)) {
        return res.status(400).json({ error: "Valid numeric quantity is required." });
      }
      const cart = setCartItemQuantity(db, userId, cartItemId, quantity, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    if (subPath === "/items" && method === "DELETE") {
      const body = parseJsonBody(req);
      const queryId = typeof req.query?.cartItemId === "string" ? req.query.cartItemId : "";
      const cartItemId = (typeof body.cartItemId === "string" ? body.cartItemId : queryId).trim();
      if (!cartItemId) {
        return res.status(400).json({ error: "cartItemId is required." });
      }
      const cart = removeCartItem(db, userId, cartItemId, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    if ((subPath === "" || subPath === "/") && method === "DELETE") {
      const cart = clearUserCart(db, userId, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: `Method ${method} not allowed for /api/cart${subPath}` });
  } catch (err) {
    if (err instanceof CartServiceError) {
      const latestCart = getUserCart(db, userId);
      const totals = calculateCartTotals(latestCart.items);
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...latestCart,
        totals
      });
    }
    return res.status(400).json({
      error: err?.message || "Unable to process cart operation."
    });
  }
}

// src/api/products.ts
function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  return body || {};
}
function getSourceClientId4(req) {
  const raw = req.headers["x-client-instance-id"];
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 80) : void 0;
}
function getSubPath3(req) {
  const url = req.originalUrl || req.url || "";
  const cleanUrl = url.split("?")[0];
  const idx = cleanUrl.indexOf("/api/products");
  if (idx === -1) return "";
  return cleanUrl.slice(idx + "/api/products".length);
}
function handleCatalogEventsStream(req, res) {
  if (!validateOrigin(req, res)) return;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  res.write(
    `retry: 30000
event: connected
data: ${JSON.stringify({ updatedAt: (/* @__PURE__ */ new Date()).toISOString() })}

`
  );
  if (process.env.VERCEL === "1") {
    res.end();
    return;
  }
  const unsubscribe = subscribeToCatalogEvents((event) => {
    try {
      res.write(`event: catalog_updated
data: ${JSON.stringify(event)}

`);
    } catch {
    }
  });
  const keepAlive = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
    }
  }, 2e4);
  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}
async function handleProductsApi(req, res) {
  const method = req.method?.toUpperCase() || "GET";
  const subPath = getSubPath3(req);
  if (method === "GET" && (subPath === "/events" || subPath === "/events/" || req.query?.stream === "events")) {
    return handleCatalogEventsStream(req, res);
  }
  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 60)) return;
  let db;
  try {
    db = getStoreDatabase();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Store database unavailable.",
      code: "DB_UNAVAILABLE"
    });
  }
  const sourceClientId = getSourceClientId4(req);
  if (method === "GET") {
    try {
      const products = getAllCatalogProducts(db);
      return res.status(200).json({ success: true, products });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || "Unable to query catalog from database.",
        code: "DB_READ_ERROR"
      });
    }
  }
  const auth = await verifyAdminSessionAsync(req, false);
  if (!auth.authorized || !auth.identity) {
    return res.status(auth.statusCode || 401).json({ error: auth.error });
  }
  const actorEmail = auth.identity.email || "system";
  try {
    const body = parseBody(req);
    if (method === "POST") {
      if (!hasAdminPermission(auth, "manageProducts")) {
        return res.status(403).json({ error: "Forbidden: Your role cannot create catalog items." });
      }
      const product = body.product;
      if (!product?.id || !product?.name) {
        return res.status(400).json({ error: "Valid product payload with id and name is required." });
      }
      const saved = upsertCatalogProduct(db, product);
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: "PRODUCT_CREATED",
        targetId: saved.id,
        details: `Created product "${saved.name}" (\u20B9${saved.price}, stock: ${saved.stock ?? 0}).`
      });
      const meta = bumpAdminVersion(db, "product_created", actorEmail, saved.id, sourceClientId);
      return res.status(200).json({ success: true, product: saved, metaVersion: meta.version });
    }
    if (method === "PATCH") {
      if (!hasAdminPermission(auth, "manageProducts")) {
        return res.status(403).json({ error: "Forbidden: Your role cannot update catalog inventory." });
      }
      if (body.action === "adjust_stock" && typeof body.productId === "string") {
        const delta = Math.trunc(Number(body.delta) || 0);
        const updated = adjustCatalogProductStock(db, body.productId, delta);
        if (!updated) {
          return res.status(404).json({ error: "Product not found." });
        }
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: "STOCK_ADJUSTED",
          targetId: updated.id,
          details: `Adjusted stock for "${updated.name}" by ${delta >= 0 ? `+${delta}` : delta} (now ${updated.stock ?? 0} units).`
        });
        const meta2 = bumpAdminVersion(db, "stock_adjusted", actorEmail, updated.id, sourceClientId);
        return res.status(200).json({ success: true, product: updated, metaVersion: meta2.version });
      }
      const product = body.product;
      if (!product?.id) {
        return res.status(400).json({ error: "Valid product payload with id is required." });
      }
      const expectedVersion = typeof body.expectedVersion === "number" ? body.expectedVersion : typeof product.version === "number" ? product.version : void 0;
      const saved = upsertCatalogProduct(db, product, { expectedVersion });
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: "PRODUCT_UPDATED",
        targetId: saved.id,
        details: `Updated product "${saved.name}" (\u20B9${saved.price}, stock: ${saved.stock ?? 0}).`
      });
      const meta = bumpAdminVersion(db, "product_updated", actorEmail, saved.id, sourceClientId);
      return res.status(200).json({ success: true, product: saved, metaVersion: meta.version });
    }
    if (method === "DELETE") {
      if (!hasAdminPermission(auth, "deleteProducts")) {
        return res.status(403).json({ error: "Forbidden: Your role cannot delete catalog items." });
      }
      const productId = typeof body.productId === "string" ? body.productId : "";
      if (!productId) {
        return res.status(400).json({ error: "productId is required." });
      }
      const existing = getProductById(db, productId);
      if (!existing) {
        return res.status(404).json({ error: "Product not found." });
      }
      deleteCatalogProduct(db, productId);
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: "PRODUCT_DELETED",
        targetId: productId,
        details: `Deleted catalog product "${existing.name}".`
      });
      const meta = bumpAdminVersion(db, "product_deleted", actorEmail, productId, sourceClientId);
      return res.status(200).json({ success: true, productId, metaVersion: meta.version });
    }
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: `Method ${method} not allowed.` });
  } catch (err) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    return res.status(400).json({ error: err?.message || "Invalid product payload." });
  }
}

// src/server/emailService.ts
var SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function checkBrevoConfiguration() {
  const apiKey = process.env.BREVO_API_KEY?.trim() || "";
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "NIT Raipur Store";
  const rawListId = process.env.BREVO_LIST_ID?.trim();
  const parsedListId = rawListId && /^\d+$/.test(rawListId) && Number(rawListId) > 0 ? Number(rawListId) : void 0;
  if (!apiKey) {
    return {
      configured: false,
      reason: "missing_api_key",
      error: "Newsletter subscriptions are temporarily unavailable while email delivery is being configured."
    };
  }
  if (apiKey.startsWith("xsmtpsib-")) {
    return {
      configured: false,
      reason: "smtp_relay_key_used",
      error: "Newsletter subscriptions are temporarily unavailable due to an email configuration issue."
    };
  }
  if (!senderEmail) {
    return {
      configured: false,
      reason: "missing_sender_email",
      error: "Newsletter subscriptions are temporarily unavailable while email delivery is being configured."
    };
  }
  if (!SIMPLE_EMAIL_REGEX.test(senderEmail)) {
    return {
      configured: false,
      reason: "invalid_sender_email",
      error: "Newsletter subscriptions are temporarily unavailable due to an email configuration issue."
    };
  }
  return {
    configured: true,
    apiKey,
    senderEmail,
    senderName,
    ...parsedListId ? { listId: parsedListId } : {}
  };
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeBrevoSnippet(rawText) {
  return rawText.replace(/xkeysib-[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]").replace(/xsmtpsib-[a-zA-Z0-9_-]+/g, "[REDACTED_KEY]").replace(/\s+/g, " ").trim().slice(0, 240);
}
function parseJsonSafe(rawText) {
  if (!rawText) return {};
  try {
    const parsed = JSON.parse(rawText);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function isAuthorizedIpRestriction(status, message) {
  if (status !== 401 && status !== 403) return false;
  const lowerMsg = (message || "").toLowerCase();
  return lowerMsg.includes("unrecognised ip") || lowerMsg.includes("unrecognized ip") || lowerMsg.includes("authorised_ips") || lowerMsg.includes("authorized_ips") || lowerMsg.includes("ip") && lowerMsg.includes("not allowed");
}
function diagnoseBrevoFailure(endpoint, status, code, message) {
  const lowerMsg = (message || "").toLowerCase();
  const scopeLabel = endpoint === "contacts" ? "Contacts API" : "Transactional Email API";
  if (isAuthorizedIpRestriction(status, message)) {
    return `Brevo ${scopeLabel} rejected HTTP ${status} due to Authorized IPs security restriction.`;
  }
  if (status === 401) {
    return `Brevo ${scopeLabel} authentication failed (401). Verify BREVO_API_KEY is a valid active v3 key.`;
  }
  if (status === 403) {
    if (lowerMsg.includes("not activated") || lowerMsg.includes("activate")) {
      return `Brevo ${scopeLabel} rejected HTTP 403 because the Brevo account is not yet activated.`;
    }
    if (lowerMsg.includes("permission") || code === "permission_denied" || lowerMsg.includes("scope")) {
      return `Brevo ${scopeLabel} rejected HTTP 403 due to missing API key permissions.`;
    }
    return `Brevo ${scopeLabel} rejected HTTP 403 (permissions, Authorized IPs, or sender verification).`;
  }
  if (status === 400 && (lowerMsg.includes("sender") || lowerMsg.includes("verified"))) {
    return "Brevo rejected the sender address (400). Verify BREVO_SENDER_EMAIL under Senders & Domains.";
  }
  if (status === 429) {
    return `Brevo ${scopeLabel} rate limit reached (429).`;
  }
  return `Brevo ${scopeLabel} returned HTTP ${status}${code ? ` (${code})` : ""}.`;
}
function buildConfirmationEmailContent(unsubscribeUrl) {
  const subject = "Thank You for Subscribing!";
  const textContent = [
    "Welcome to NIT Raipur Store,",
    "",
    "Thank you for subscribing to our official updates list!",
    "",
    "You're officially in. We'll keep you updated on new merchandise drops, upcoming releases, restocks, and exclusive campus updates from NIT Raipur Store.",
    "",
    "Regards,",
    "NIT Raipur Store Team",
    "",
    "---",
    `You received this welcome email because you subscribed on NIT Raipur Store. To unsubscribe anytime, visit: ${unsubscribeUrl}`
  ].join("\n");
  const safeUnsubUrl = escapeHtml(unsubscribeUrl);
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;background-color:#09090b;color:#fafaf9;">
              <span style="font-size:16px;font-weight:700;letter-spacing:-0.01em;">NIT Raipur Store</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.65;color:#27272a;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#be2d09;">Welcome</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:#09090b;">You're officially in.</h1>
              <p style="margin:0 0 16px;">Thanks for subscribing to NIT Raipur Store. We'll keep you updated on new arrivals, upcoming releases, restocks and exclusive campus updates.</p>
              <p style="margin:0 0 24px;">We're glad to have you with us.</p>
              <p style="margin:0;color:#52525b;">Regards,<br /><strong style="color:#09090b;">NIT Raipur Store Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#fafaf9;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.5;color:#71717a;">
              You are receiving this welcome email because you subscribed to NIT Raipur Store updates.
              <a href="${safeUnsubUrl}" style="color:#be2d09;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, textContent, htmlContent };
}
async function syncContactWithBrevo(params, fetchImpl = fetch) {
  const config = checkBrevoConfiguration();
  if (!config.configured || !config.apiKey) {
    return {
      ok: false,
      code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      reason: config.reason || "missing_configuration",
      error: config.error
    };
  }
  const sendContactRequest = async (includeAttributes) => {
    const payload = {
      email: params.email,
      updateEnabled: true,
      emailBlacklisted: Boolean(params.emailBlacklisted)
    };
    if (!params.emailBlacklisted && config.listId) {
      payload.listIds = [config.listId];
    }
    if (includeAttributes) {
      payload.attributes = {
        SOURCE: "NIT_RAIPUR_STORE",
        ...params.attributes || {}
      };
    }
    return fetchImpl("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
        "user-agent": "NIT-Raipur-Store/1.0"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15e3)
    });
  };
  try {
    let response = await sendContactRequest(true);
    let rawText = await response.text().catch(() => "");
    let data = parseJsonSafe(rawText);
    if (response.status === 400 && typeof data?.message === "string" && /attribute|invalid_parameter/i.test(data.message)) {
      response = await sendContactRequest(false);
      rawText = await response.text().catch(() => "");
      data = parseJsonSafe(rawText);
    }
    if (response.status === 201 || response.status === 204 || response.ok) {
      return {
        ok: true,
        created: response.status === 201,
        contactId: data.id,
        httpStatus: response.status
      };
    }
    const brevoCode = typeof data?.code === "string" ? data.code : void 0;
    const rawMsg = typeof data?.message === "string" ? data.message : sanitizeBrevoSnippet(rawText);
    const lowerRawMsg = rawMsg.toLowerCase();
    const isPermissionScopeOnly = response.status === 403 && !lowerRawMsg.includes("not activated") && !lowerRawMsg.includes("activate") && (brevoCode === "permission_denied" || lowerRawMsg.includes("permission") || lowerRawMsg.includes("scope"));
    const authorizedIpRestricted = isAuthorizedIpRestriction(response.status, rawMsg);
    const reason = diagnoseBrevoFailure(
      "contacts",
      response.status,
      brevoCode,
      rawMsg
    );
    return {
      ok: false,
      httpStatus: response.status,
      brevoCode,
      contactsScopeMissing: isPermissionScopeOnly,
      authorizedIpRestricted,
      code: "BREVO_CONTACTS_FAILED",
      reason,
      error: "Unable to complete subscription right now due to an email service issue. Please try again later."
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 502,
      code: "BREVO_CONTACTS_FAILED",
      reason: `Network failure contacting Brevo Contacts API: ${err?.message || "Unknown error"}`,
      error: "Unable to complete subscription right now because the email service is unavailable. Please try again later."
    };
  }
}
async function sendNewsletterConfirmationViaBrevo(params, fetchImpl = fetch) {
  const config = checkBrevoConfiguration();
  if (!config.configured || !config.apiKey || !config.senderEmail) {
    return {
      ok: false,
      code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      reason: config.reason || "missing_configuration",
      error: config.error
    };
  }
  const { subject, textContent, htmlContent } = buildConfirmationEmailContent(params.unsubscribeUrl);
  try {
    const response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
        "user-agent": "NIT-Raipur-Store/1.0"
      },
      body: JSON.stringify({
        sender: {
          name: config.senderName || "NIT Raipur Store",
          email: config.senderEmail
        },
        replyTo: {
          name: config.senderName || "NIT Raipur Store",
          email: config.senderEmail
        },
        to: [{ email: params.toEmail }],
        subject,
        textContent,
        htmlContent,
        tags: ["newsletter-welcome"]
      }),
      signal: AbortSignal.timeout(15e3)
    });
    const rawText = await response.text().catch(() => "");
    const data = parseJsonSafe(rawText);
    if (!response.ok) {
      const rawMsg = typeof data?.message === "string" ? data.message : sanitizeBrevoSnippet(rawText);
      const reason = diagnoseBrevoFailure(
        "smtp_email",
        response.status,
        data?.code,
        rawMsg
      );
      return {
        ok: false,
        httpStatus: response.status,
        brevoCode: typeof data?.code === "string" ? data.code : void 0,
        authorizedIpRestricted: isAuthorizedIpRestriction(response.status, rawMsg),
        code: "EMAIL_DELIVERY_FAILED",
        reason,
        error: "Unable to complete subscription right now due to an email delivery issue. Please try again later."
      };
    }
    const messageId = typeof data?.messageId === "string" ? data.messageId.trim() : "";
    if (!messageId) {
      return {
        ok: false,
        httpStatus: response.status,
        code: "EMAIL_DELIVERY_FAILED",
        reason: "Brevo Transactional Email API returned 2xx without a valid messageId.",
        error: "Unable to verify confirmation email delivery. Please try again later."
      };
    }
    return {
      ok: true,
      httpStatus: response.status,
      messageId
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 502,
      code: "EMAIL_DELIVERY_FAILED",
      reason: `Network failure contacting Brevo Transactional Email API: ${err?.message || "Unknown error"}`,
      error: "Unable to complete subscription right now because the email service is unavailable. Please try again later."
    };
  }
}

// src/server/newsletterService.ts
import crypto3 from "node:crypto";
var EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var NewsletterServiceError = class extends Error {
  constructor(message, statusCode = 400, code = "NEWSLETTER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
};
function logNewsletterStage(stage, outcome, details = {}) {
  const safePayload = {
    stage,
    outcome,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...details
  };
  console.info(`[Newsletter] ${JSON.stringify(safePayload)}`);
}
var dbEmailLocks = /* @__PURE__ */ new WeakMap();
async function withDatabaseEmailLock(db, email, fn) {
  let lockMap = dbEmailLocks.get(db);
  if (!lockMap) {
    lockMap = /* @__PURE__ */ new Map();
    dbEmailLocks.set(db, lockMap);
  }
  const prev = lockMap.get(email) || Promise.resolve();
  let releaseCurrent;
  const currentDone = new Promise((resolve) => {
    releaseCurrent = resolve;
  });
  const tail = prev.catch(() => void 0).then(() => currentDone);
  lockMap.set(email, tail);
  await prev.catch(() => void 0);
  try {
    return await fn();
  } finally {
    releaseCurrent();
    if (lockMap.get(email) === tail) {
      lockMap.delete(email);
    }
  }
}
function mapSubscriberRow(row) {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    consentGiven: row.consent_given === 1,
    consentSource: row.consent_source,
    confirmationEmailStatus: row.confirmation_email_status,
    confirmationSentAt: row.confirmation_sent_at,
    confirmedAt: row.confirmed_at ?? row.confirmation_sent_at,
    brevoContactSynced: Number(row.brevo_contact_synced || 0) === 1,
    brevoContactSyncedAt: row.brevo_contact_synced_at ?? null,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
    updatedAt: row.updated_at
  };
}
function normalizeNewsletterEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}
function isValidNewsletterEmail(email) {
  const clean = normalizeNewsletterEmail(email);
  return Boolean(clean && clean.length <= 254 && EMAIL_REGEX.test(clean));
}
function maskEmailForLog(email) {
  const atIdx = email.indexOf("@");
  if (atIdx <= 1) return "***";
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  return `${local.slice(0, 2)}***@${domain}`;
}
async function subscribeToNewsletter(db, rawEmail, options) {
  const consentSource = options.consentSource || "newsletter_form";
  logNewsletterStage("request_received", "info", { action: "subscribe", consentSource });
  const email = normalizeNewsletterEmail(rawEmail);
  if (!email) {
    logNewsletterStage("validation", "rejected", { reason: "empty_email", httpStatus: 400 });
    logNewsletterStage("final_status", "rejected", { httpStatus: 400, code: "EMPTY_EMAIL" });
    throw new NewsletterServiceError(
      "Please enter your email address.",
      400,
      "EMPTY_EMAIL"
    );
  }
  if (!isValidNewsletterEmail(email)) {
    logNewsletterStage("validation", "rejected", { reason: "invalid_email_format", httpStatus: 400 });
    logNewsletterStage("final_status", "rejected", { httpStatus: 400, code: "INVALID_EMAIL" });
    throw new NewsletterServiceError(
      "Please enter a valid email address (e.g., name@nitrr.ac.in).",
      400,
      "INVALID_EMAIL"
    );
  }
  const maskedEmail = maskEmailForLog(email);
  logNewsletterStage("validation", "ok", { email: maskedEmail });
  const usesDefaultProvider = !options.syncContact && !options.sendConfirmation;
  if (usesDefaultProvider) {
    const configCheck = checkBrevoConfiguration();
    if (!configCheck.configured) {
      logNewsletterStage("brevo_contacts", "error", {
        httpStatus: 500,
        reason: configCheck.reason
      });
      logNewsletterStage("final_status", "error", {
        httpStatus: 500,
        code: "EMAIL_PROVIDER_NOT_CONFIGURED"
      });
      throw new NewsletterServiceError(
        configCheck.error || "Newsletter subscriptions are temporarily unavailable due to server configuration.",
        500,
        "EMAIL_PROVIDER_NOT_CONFIGURED"
      );
    }
  }
  const syncContact = options.syncContact || syncContactWithBrevo;
  const sendEmail = options.sendConfirmation || sendNewsletterConfirmationViaBrevo;
  const cleanBaseUrl = options.baseUrl.replace(/\/+$/, "");
  return withDatabaseEmailLock(db, email, async () => {
    let existing;
    let isReactivation = false;
    let subscriberId = "";
    let unsubscribeToken = "";
    try {
      const prepResult = runInTransaction(db, () => {
        const found = db.prepare(`SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1`).get(email);
        if (found && found.status === "active") {
          return { alreadyActive: true, found };
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        if (found && found.status === "unsubscribed") {
          db.prepare(
            `UPDATE newsletter_subscribers
             SET status = 'active',
                 consent_given = 1,
                 consent_source = ?,
                 confirmation_email_status = 'pending',
                 unsubscribed_at = NULL,
                 subscribed_at = ?,
                 updated_at = ?
             WHERE id = ?`
          ).run(consentSource, now, now, found.id);
          return {
            alreadyActive: false,
            isReactivation: true,
            previous: found,
            subscriberId: found.id,
            unsubscribeToken: found.unsubscribe_token
          };
        }
        const nextId = `sub_${crypto3.randomUUID()}`;
        const nextToken = crypto3.randomBytes(24).toString("hex");
        db.prepare(
          `INSERT INTO newsletter_subscribers (
             id, email, status, consent_given, consent_source, unsubscribe_token,
             confirmation_email_status, confirmation_message_id, confirmation_sent_at,
             confirmed_at, brevo_contact_synced, brevo_contact_synced_at,
             subscribed_at, unsubscribed_at, updated_at
           ) VALUES (?, ?, 'active', 1, ?, ?, 'pending', NULL, NULL, NULL, 0, NULL, ?, NULL, ?)`
        ).run(nextId, email, consentSource, nextToken, now, now);
        return {
          alreadyActive: false,
          isReactivation: false,
          previous: void 0,
          subscriberId: nextId,
          unsubscribeToken: nextToken
        };
      });
      if (prepResult.alreadyActive) {
        const found = prepResult.found;
        logNewsletterStage("database", "ok", {
          email: maskedEmail,
          action: "already_subscribed",
          priorEmailStatus: found.confirmation_email_status
        });
        if (found.confirmation_email_status === "sent") {
          let latestRow = found;
          if (!found.brevo_contact_synced) {
            const syncRes = await syncContact({
              email,
              emailBlacklisted: false,
              attributes: { SOURCE: found.consent_source.toUpperCase() }
            });
            if (syncRes.ok) {
              const now2 = (/* @__PURE__ */ new Date()).toISOString();
              db.prepare(
                `UPDATE newsletter_subscribers
                 SET brevo_contact_synced = 1, brevo_contact_synced_at = ?, updated_at = ?
                 WHERE id = ?`
              ).run(now2, now2, found.id);
              latestRow = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(found.id);
            }
          }
          logNewsletterStage("final_status", "ok", {
            httpStatus: 200,
            status: "already_subscribed",
            emailDeliveryStatus: "already_sent"
          });
          return {
            status: "already_subscribed",
            subscriber: mapSubscriberRow(latestRow),
            confirmationEmailSent: false,
            emailDeliveryStatus: "already_sent",
            message: "This email is already subscribed to NIT Raipur Store updates."
          };
        }
        let syncedNow = Number(found.brevo_contact_synced || 0) === 1;
        if (!syncedNow) {
          const contactRetry = await syncContact({
            email,
            emailBlacklisted: false,
            attributes: { SOURCE: found.consent_source.toUpperCase() }
          });
          if (contactRetry.ok) {
            syncedNow = true;
            logNewsletterStage("brevo_contacts", "ok", {
              email: maskedEmail,
              upstreamStatus: contactRetry.httpStatus ?? 201,
              retryForExisting: true
            });
          } else {
            logNewsletterStage(
              "brevo_contacts",
              contactRetry.authorizedIpRestricted ? "info" : "error",
              {
                email: maskedEmail,
                retryForExisting: true,
                upstreamStatus: contactRetry.httpStatus ?? null,
                brevoCode: contactRetry.brevoCode ?? null,
                authorizedIpRestricted: Boolean(contactRetry.authorizedIpRestricted),
                ...contactRetry.authorizedIpRestricted ? { deferred: true } : {},
                reason: contactRetry.reason || "contacts_sync_failed"
              }
            );
          }
        }
        const existingUnsubUrl = `${cleanBaseUrl}/unsubscribe?token=${encodeURIComponent(
          found.unsubscribe_token
        )}`;
        const retryDelivery = await sendEmail({
          toEmail: email,
          unsubscribeUrl: existingUnsubUrl
        });
        const now = (/* @__PURE__ */ new Date()).toISOString();
        if (retryDelivery.ok) {
          db.prepare(
            `UPDATE newsletter_subscribers
             SET confirmation_email_status = 'sent',
                 confirmation_message_id = ?,
                 confirmation_sent_at = ?,
                 confirmed_at = ?,
                 brevo_contact_synced = ?,
                 brevo_contact_synced_at = COALESCE(brevo_contact_synced_at, ?),
                 updated_at = ?
             WHERE id = ?`
          ).run(
            retryDelivery.messageId || null,
            now,
            now,
            syncedNow ? 1 : 0,
            syncedNow ? now : null,
            now,
            found.id
          );
          const updatedExisting2 = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(found.id);
          logNewsletterStage("brevo_confirmation_email", "ok", {
            email: maskedEmail,
            retryForExisting: true,
            upstreamStatus: retryDelivery.httpStatus ?? 201,
            hasMessageId: Boolean(retryDelivery.messageId)
          });
          logNewsletterStage("final_status", "ok", {
            httpStatus: 200,
            status: "already_subscribed",
            confirmationEmailSent: true,
            emailDeliveryStatus: "sent"
          });
          return {
            status: "already_subscribed",
            subscriber: mapSubscriberRow(updatedExisting2),
            confirmationEmailSent: true,
            emailDeliveryStatus: "sent",
            message: "You are subscribed and your welcome email is on its way."
          };
        }
        const nextEmailStatus = retryDelivery.authorizedIpRestricted ? "pending" : "failed";
        db.prepare(
          `UPDATE newsletter_subscribers
           SET confirmation_email_status = ?,
               brevo_contact_synced = ?,
               brevo_contact_synced_at = COALESCE(brevo_contact_synced_at, ?),
               updated_at = ?
           WHERE id = ?`
        ).run(nextEmailStatus, syncedNow ? 1 : 0, syncedNow ? now : null, now, found.id);
        const updatedExisting = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(found.id);
        logNewsletterStage(
          "brevo_confirmation_email",
          retryDelivery.authorizedIpRestricted ? "info" : "error",
          {
            email: maskedEmail,
            retryForExisting: true,
            upstreamStatus: retryDelivery.httpStatus ?? null,
            brevoCode: retryDelivery.brevoCode ?? null,
            authorizedIpRestricted: Boolean(retryDelivery.authorizedIpRestricted),
            ...retryDelivery.authorizedIpRestricted ? { deferred: true } : {},
            reason: retryDelivery.reason || "confirmation_email_failed"
          }
        );
        logNewsletterStage(
          "final_status",
          retryDelivery.authorizedIpRestricted ? "info" : "error",
          {
            httpStatus: 200,
            status: "already_subscribed",
            confirmationEmailSent: false,
            emailDeliveryStatus: "failed",
            ...retryDelivery.authorizedIpRestricted ? { deferred: true } : {}
          }
        );
        return {
          status: "already_subscribed",
          subscriber: mapSubscriberRow(updatedExisting),
          confirmationEmailSent: false,
          emailDeliveryStatus: "failed",
          emailError: "Welcome email could not be sent right now.",
          message: "Your subscription is saved, though the welcome email could not be sent right now."
        };
      }
      existing = prepResult.previous;
      isReactivation = prepResult.isReactivation;
      subscriberId = prepResult.subscriberId;
      unsubscribeToken = prepResult.unsubscribeToken;
      logNewsletterStage("database", "ok", {
        email: maskedEmail,
        action: isReactivation ? "pending_reactivation" : "pending_insert"
      });
    } catch (dbErr) {
      if (dbErr instanceof NewsletterServiceError) {
        throw dbErr;
      }
      logNewsletterStage("database", "error", {
        email: maskedEmail,
        httpStatus: 500,
        reason: dbErr?.message ? String(dbErr.message).slice(0, 160) : "sqlite_error"
      });
      logNewsletterStage("final_status", "error", {
        httpStatus: 500,
        code: "DATABASE_ERROR"
      });
      throw new NewsletterServiceError(
        "Unable to save your subscription right now due to a server database error. Please try again later.",
        500,
        "DATABASE_ERROR"
      );
    }
    const rollbackPending = () => {
      try {
        runInTransaction(db, () => {
          if (isReactivation && existing) {
            db.prepare(
              `UPDATE newsletter_subscribers
               SET status = ?,
                   consent_given = ?,
                   consent_source = ?,
                   confirmation_email_status = ?,
                   confirmation_message_id = ?,
                   confirmation_sent_at = ?,
                   confirmed_at = ?,
                   brevo_contact_synced = ?,
                   brevo_contact_synced_at = ?,
                   unsubscribed_at = ?,
                   subscribed_at = ?,
                   updated_at = ?
               WHERE id = ?`
            ).run(
              existing.status,
              existing.consent_given,
              existing.consent_source,
              existing.confirmation_email_status,
              existing.confirmation_message_id,
              existing.confirmation_sent_at,
              existing.confirmed_at,
              existing.brevo_contact_synced,
              existing.brevo_contact_synced_at,
              existing.unsubscribed_at,
              existing.subscribed_at,
              existing.updated_at,
              existing.id
            );
          } else {
            db.prepare(`DELETE FROM newsletter_subscribers WHERE id = ?`).run(subscriberId);
          }
        });
      } catch {
      }
    };
    const contactSync = await syncContact({
      email,
      emailBlacklisted: false,
      attributes: {
        SOURCE: consentSource.toUpperCase()
      }
    });
    let brevoContactSynced = false;
    if (contactSync.ok) {
      brevoContactSynced = true;
      logNewsletterStage("brevo_contacts", "ok", {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 201,
        created: Boolean(contactSync.created)
      });
    } else if (contactSync.contactsScopeMissing) {
      brevoContactSynced = false;
      logNewsletterStage("brevo_contacts", "info", {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 403,
        brevoCode: contactSync.brevoCode ?? "permission_denied",
        reason: "BREVO_API_KEY lacks Contacts permission; continuing with local DB storage and Transactional Email confirmation."
      });
    } else if (contactSync.authorizedIpRestricted) {
      brevoContactSynced = false;
      logNewsletterStage("brevo_contacts", "info", {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 401,
        brevoCode: contactSync.brevoCode ?? "unauthorized",
        authorizedIpRestricted: true,
        deferred: true,
        reason: "Brevo Contacts API blocked dynamic server IP (Authorized IPs security setting); continuing with local DB storage and confirmation email attempt."
      });
    } else {
      rollbackPending();
      const mappedStatus = contactSync.code === "EMAIL_PROVIDER_NOT_CONFIGURED" ? 500 : 502;
      logNewsletterStage("brevo_contacts", "error", {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? null,
        brevoCode: contactSync.brevoCode ?? null,
        reason: contactSync.reason || "contacts_sync_failed"
      });
      logNewsletterStage("final_status", "error", {
        httpStatus: mappedStatus,
        code: contactSync.code || "BREVO_CONTACTS_FAILED"
      });
      throw new NewsletterServiceError(
        contactSync.error || "Unable to complete subscription right now. Please try again later.",
        mappedStatus,
        contactSync.code || "BREVO_CONTACTS_FAILED"
      );
    }
    const unsubscribeUrl = `${cleanBaseUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    const delivery = await sendEmail({
      toEmail: email,
      unsubscribeUrl
    });
    let confirmationEmailSent = true;
    if (!delivery.ok) {
      if (delivery.authorizedIpRestricted) {
        confirmationEmailSent = false;
        logNewsletterStage("brevo_confirmation_email", "info", {
          email: maskedEmail,
          upstreamStatus: delivery.httpStatus ?? 401,
          brevoCode: delivery.brevoCode ?? "unauthorized",
          authorizedIpRestricted: true,
          deferred: true,
          reason: "Brevo Transactional Email API blocked dynamic server IP (Authorized IPs security setting); keeping subscriber active in local DB with pending confirmation email."
        });
      } else {
        rollbackPending();
        const mappedStatus = delivery.code === "EMAIL_PROVIDER_NOT_CONFIGURED" ? 500 : 502;
        logNewsletterStage("brevo_confirmation_email", "error", {
          email: maskedEmail,
          upstreamStatus: delivery.httpStatus ?? null,
          brevoCode: delivery.brevoCode ?? null,
          reason: delivery.reason || "confirmation_email_failed"
        });
        logNewsletterStage("final_status", "error", {
          httpStatus: mappedStatus,
          code: delivery.code || "EMAIL_DELIVERY_FAILED"
        });
        throw new NewsletterServiceError(
          delivery.error || "Failed to send confirmation email. Please try again later.",
          mappedStatus,
          delivery.code || "EMAIL_DELIVERY_FAILED"
        );
      }
    } else {
      logNewsletterStage("brevo_confirmation_email", "ok", {
        email: maskedEmail,
        upstreamStatus: delivery.httpStatus ?? 201,
        hasMessageId: Boolean(delivery.messageId)
      });
    }
    try {
      const sentAt = (/* @__PURE__ */ new Date()).toISOString();
      const updated = runInTransaction(db, () => {
        db.prepare(
          `UPDATE newsletter_subscribers
           SET confirmation_email_status = ?,
               confirmation_message_id = ?,
               confirmation_sent_at = ?,
               confirmed_at = ?,
               brevo_contact_synced = ?,
               brevo_contact_synced_at = ?,
               updated_at = ?
           WHERE id = ?`
        ).run(
          confirmationEmailSent ? "sent" : "pending",
          confirmationEmailSent ? delivery.messageId || null : null,
          confirmationEmailSent ? sentAt : null,
          confirmationEmailSent ? sentAt : null,
          brevoContactSynced ? 1 : 0,
          brevoContactSynced ? sentAt : null,
          sentAt,
          subscriberId
        );
        return db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(subscriberId);
      });
      const emailDeliveryStatus = confirmationEmailSent ? "sent" : "failed";
      logNewsletterStage("final_status", confirmationEmailSent ? "ok" : "info", {
        httpStatus: 201,
        status: "subscribed",
        confirmationEmailSent,
        emailDeliveryStatus,
        ...!confirmationEmailSent ? { deferred: true } : {},
        reactivated: isReactivation
      });
      return {
        status: "subscribed",
        subscriber: mapSubscriberRow(updated),
        confirmationEmailSent,
        emailDeliveryStatus,
        ...confirmationEmailSent ? {} : { emailError: "Welcome email could not be sent right now." },
        message: confirmationEmailSent ? "Your subscription is confirmed and your welcome email is on its way." : "Your subscription is saved, though the welcome email could not be sent right now."
      };
    } catch (finalizeErr) {
      rollbackPending();
      logNewsletterStage("database", "error", {
        email: maskedEmail,
        httpStatus: 500,
        reason: finalizeErr?.message ? String(finalizeErr.message).slice(0, 160) : "finalize_error"
      });
      logNewsletterStage("final_status", "error", {
        httpStatus: 500,
        code: "DATABASE_ERROR"
      });
      throw new NewsletterServiceError(
        "Unable to finalize your subscription right now. Please try again later.",
        500,
        "DATABASE_ERROR"
      );
    }
  });
}
function unsubscribeFromNewsletter(db, params) {
  const token = typeof params.token === "string" ? params.token.trim() : "";
  const email = normalizeNewsletterEmail(params.email || "");
  let row;
  if (token) {
    row = db.prepare(`SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1`).get(token);
  } else if (email) {
    if (!isValidNewsletterEmail(email)) {
      throw new NewsletterServiceError("Please enter a valid email address.", 400, "INVALID_EMAIL");
    }
    row = db.prepare(`SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1`).get(email);
  } else {
    throw new NewsletterServiceError(
      "An unsubscribe token or email address is required.",
      400,
      "MISSING_UNSUBSCRIBE_IDENTIFIER"
    );
  }
  if (!row) {
    if (token) {
      throw new NewsletterServiceError(
        "This unsubscribe link is invalid or has expired.",
        404,
        "SUBSCRIBER_NOT_FOUND"
      );
    }
    return {
      unsubscribed: false,
      alreadyUnsubscribed: true,
      message: "If this email was subscribed, it will no longer receive newsletter updates."
    };
  }
  if (row.status === "unsubscribed") {
    return {
      unsubscribed: true,
      alreadyUnsubscribed: true,
      email: row.email,
      message: "You are already unsubscribed from NIT Raipur Store newsletter updates."
    };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(
    `UPDATE newsletter_subscribers
     SET status = 'unsubscribed',
         unsubscribed_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(now, now, row.id);
  logNewsletterStage("final_status", "ok", {
    action: "unsubscribe",
    email: maskEmailForLog(row.email),
    httpStatus: 200
  });
  return {
    unsubscribed: true,
    alreadyUnsubscribed: false,
    email: row.email,
    message: "You have been unsubscribed and will no longer receive newsletter updates."
  };
}
function listNewsletterSubscribers(db, filters = {}) {
  const countsRow = db.prepare(
    `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed
       FROM newsletter_subscribers`
  ).get();
  const conditions = [];
  const args = [];
  if (filters.status === "active" || filters.status === "unsubscribed") {
    conditions.push("status = ?");
    args.push(filters.status);
  }
  const q = typeof filters.search === "string" ? filters.search.trim().toLowerCase() : "";
  if (q) {
    conditions.push("LOWER(email) LIKE ?");
    args.push(`%${q}%`);
  }
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(
    `SELECT * FROM newsletter_subscribers
       ${whereSql}
       ORDER BY datetime(subscribed_at) DESC, rowid DESC`
  ).all(...args);
  return {
    subscribers: rows.map(mapSubscriberRow),
    counts: {
      total: Number(countsRow?.total || 0),
      active: Number(countsRow?.active || 0),
      unsubscribed: Number(countsRow?.unsubscribed || 0)
    }
  };
}
function updateNewsletterSubscriberStatus(db, id, status) {
  const existing = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(id);
  if (!existing) {
    throw new NewsletterServiceError("Subscriber record not found.", 404, "SUBSCRIBER_NOT_FOUND");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const unsubscribedAt = status === "unsubscribed" ? now : null;
  db.prepare(
    `UPDATE newsletter_subscribers
     SET status = ?,
         unsubscribed_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(status, unsubscribedAt, now, id);
  const updated = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`).get(id);
  return mapSubscriberRow(updated);
}
function deleteNewsletterSubscriber(db, id) {
  const result = db.prepare(`DELETE FROM newsletter_subscribers WHERE id = ?`).run(id);
  return Number(result.changes || 0) > 0;
}

// src/api/newsletter.ts
function parseJsonBody2(req) {
  let body = req.body;
  if (typeof body === "string") {
    const trimmed = body.trim();
    body = trimmed ? JSON.parse(trimmed) : {};
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  return body;
}
function getSubPath4(req) {
  const url = req.originalUrl || req.url || "";
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "");
  const idx = cleanUrl.indexOf("/api/newsletter");
  if (idx === -1) return cleanUrl;
  return cleanUrl.slice(idx + "/api/newsletter".length);
}
function resolveRequestBaseUrl(req) {
  const configured = process.env.APP_PUBLIC_URL?.trim() || process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const origin = req.headers["origin"];
  if (typeof origin === "string" && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, "");
  }
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = typeof forwardedHost === "string" && forwardedHost.trim() ? forwardedHost.split(",")[0].trim() : req.headers["host"];
  const proto = typeof req.headers["x-forwarded-proto"] === "string" ? req.headers["x-forwarded-proto"].split(",")[0].trim() : "http";
  if (typeof host === "string" && host.trim()) {
    return `${proto}://${host.trim()}`;
  }
  return "http://localhost:3000";
}
function sendErrorJson(res, statusCode, message, code) {
  return res.status(statusCode).json({
    success: false,
    ...code ? { code } : {},
    message,
    error: message
  });
}
async function handleNewsletterOperations(req, res) {
  setSecurityHeaders(res);
  const method = req.method?.toUpperCase() || "GET";
  if (method === "OPTIONS") {
    return res.status(204).json({ success: true, message: "OK" });
  }
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 40)) return;
  const subPath = getSubPath4(req);
  try {
    const db = getStoreDatabase();
    if (subPath === "/subscribe" && method === "POST") {
      let body;
      try {
        body = parseJsonBody2(req);
      } catch {
        return sendErrorJson(res, 400, "Malformed JSON payload.", "MALFORMED_JSON");
      }
      const result = await subscribeToNewsletter(db, String(body?.email ?? ""), {
        baseUrl: resolveRequestBaseUrl(req),
        consentSource: "newsletter_form"
      });
      bumpAdminVersion(db, "newsletter_subscribed", result.subscriber.email, result.subscriber.id);
      const statusCode = result.status === "already_subscribed" ? 200 : 201;
      return res.status(statusCode).json({
        success: true,
        status: result.status,
        email: result.subscriber.email,
        confirmationEmailSent: result.confirmationEmailSent,
        emailDeliveryStatus: result.emailDeliveryStatus,
        ...result.emailError ? { emailError: result.emailError } : {},
        message: result.message
      });
    }
    if (subPath === "/unsubscribe" && method === "POST") {
      let body;
      try {
        body = parseJsonBody2(req);
      } catch {
        return sendErrorJson(res, 400, "Malformed JSON payload.", "MALFORMED_JSON");
      }
      const result = unsubscribeFromNewsletter(db, {
        token: typeof body?.token === "string" ? body.token : void 0,
        email: typeof body?.email === "string" ? body.email : void 0
      });
      if (result.unsubscribed && result.email && checkBrevoConfiguration().configured) {
        await syncContactWithBrevo({
          email: result.email,
          emailBlacklisted: true
        }).catch(() => void 0);
      }
      if (result.unsubscribed) {
        bumpAdminVersion(db, "newsletter_unsubscribed", result.email || "subscriber");
      }
      return res.status(200).json({
        success: true,
        unsubscribed: result.unsubscribed,
        alreadyUnsubscribed: result.alreadyUnsubscribed,
        message: result.message
      });
    }
    const adminAuth = await verifyAdminSessionAsync(req);
    if (!adminAuth.authorized || !adminAuth.identity) {
      return sendErrorJson(
        res,
        adminAuth.statusCode || 401,
        adminAuth.error || "Administrative authorization required.",
        adminAuth.statusCode === 403 ? "FORBIDDEN" : "UNAUTHORIZED"
      );
    }
    if (!hasAdminPermission(adminAuth, "manageNewsletter")) {
      return sendErrorJson(
        res,
        403,
        "Forbidden: Your administrative role does not allow managing newsletter subscribers.",
        "FORBIDDEN"
      );
    }
    const actorEmail = adminAuth.identity.email || "system";
    if (subPath === "/subscribers" && method === "GET") {
      const statusParam = typeof req.query?.status === "string" ? req.query.status : "all";
      const statusFilter = statusParam === "active" || statusParam === "unsubscribed" ? statusParam : "all";
      const search = typeof req.query?.q === "string" ? req.query.q : "";
      const payload = listNewsletterSubscribers(db, {
        search,
        status: statusFilter
      });
      return res.status(200).json({
        success: true,
        message: "Subscribers loaded successfully.",
        ...payload
      });
    }
    if (subPath.startsWith("/subscribers/")) {
      const id = decodeURIComponent(subPath.slice("/subscribers/".length));
      if (!id) {
        return sendErrorJson(res, 400, "Subscriber ID is required.", "MISSING_ID");
      }
      if (method === "PATCH") {
        let body;
        try {
          body = parseJsonBody2(req);
        } catch {
          return sendErrorJson(res, 400, "Malformed JSON payload.", "MALFORMED_JSON");
        }
        const nextStatus = body?.status;
        if (nextStatus !== "active" && nextStatus !== "unsubscribed") {
          return sendErrorJson(
            res,
            400,
            'Status must be "active" or "unsubscribed".',
            "INVALID_STATUS"
          );
        }
        const updated = updateNewsletterSubscriberStatus(db, id, nextStatus);
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: "NEWSLETTER_UPDATED",
          targetId: updated.email,
          details: `Marked newsletter subscriber ${updated.email} as ${nextStatus}.`
        });
        bumpAdminVersion(db, "newsletter_updated", actorEmail, updated.id);
        return res.status(200).json({
          success: true,
          message: "Subscriber status updated.",
          subscriber: updated
        });
      }
      if (method === "DELETE") {
        const deleted = deleteNewsletterSubscriber(db, id);
        if (!deleted) {
          return sendErrorJson(res, 404, "Subscriber record not found.", "SUBSCRIBER_NOT_FOUND");
        }
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: "NEWSLETTER_DELETED",
          targetId: id,
          details: `Deleted newsletter subscriber record ${id}.`
        });
        bumpAdminVersion(db, "newsletter_deleted", actorEmail, id);
        return res.status(200).json({
          success: true,
          message: "Subscriber record removed.",
          deletedId: id
        });
      }
    }
    return sendErrorJson(
      res,
      404,
      `Unsupported newsletter endpoint: ${method} ${subPath || "/"}`,
      "NOT_FOUND"
    );
  } catch (err) {
    if (err instanceof NewsletterServiceError) {
      return sendErrorJson(res, err.statusCode, err.message, err.code);
    }
    console.error("[Newsletter API] Unexpected error:", err instanceof Error ? err.message : "Unknown error");
    return sendErrorJson(
      res,
      500,
      "Unexpected server error processing newsletter request.",
      "INTERNAL_SERVER_ERROR"
    );
  }
}

// src/api/support.ts
import crypto4 from "node:crypto";
function createSupportInquiry(db, payload) {
  const organization = sanitizeString(payload.organization).slice(0, 140);
  const contactEmail = sanitizeString(payload.contactEmail).toLowerCase().slice(0, 120);
  const notes = sanitizeString(payload.notes).slice(0, 2e3);
  const qtyNum = Math.floor(Number(payload.estimatedQuantity));
  if (!organization || organization.length < 2) {
    throw new Error("Club, department, or organization name is required (min 2 characters).");
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("A valid contact email address is required.");
  }
  if (!Number.isFinite(qtyNum) || qtyNum < 15 || qtyNum > 5e4) {
    throw new Error("Estimated quantity must be between 15 and 50,000 units.");
  }
  if (!notes || notes.length < 5) {
    throw new Error("Please provide garment details and customization notes.");
  }
  const record = {
    id: `INQ-${(/* @__PURE__ */ new Date()).getFullYear()}-${crypto4.randomBytes(3).toString("hex").toUpperCase()}`,
    organization,
    contactEmail,
    estimatedQuantity: qtyNum,
    notes,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.prepare(`
    INSERT INTO support_inquiries (id, organization, contact_email, estimated_quantity, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.organization,
    record.contactEmail,
    record.estimatedQuantity,
    record.notes,
    record.createdAt
  );
  return record;
}
function listSupportInquiries(db) {
  const rows = db.prepare(
    `SELECT id, organization, contact_email, estimated_quantity, notes, created_at
       FROM support_inquiries ORDER BY created_at DESC LIMIT 200`
  ).all();
  return rows.map((r) => ({
    id: r.id,
    organization: r.organization,
    contactEmail: r.contact_email,
    estimatedQuantity: r.estimated_quantity,
    notes: r.notes,
    createdAt: r.created_at
  }));
}
async function handleSupportApi(req, res) {
  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 30)) return;
  const method = req.method?.toUpperCase() || "POST";
  if (method === "GET") {
    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized || !auth.identity) {
      return res.status(auth.statusCode || 401).json({
        success: false,
        error: auth.error || "Administrative authorization required."
      });
    }
    if (!hasAdminPermission(auth, "viewDashboard")) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Missing permission to view bulk inquiries."
      });
    }
    try {
      const db = getStoreDatabase();
      const inquiries = listSupportInquiries(db);
      return res.status(200).json({ success: true, inquiries });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || "Unable to fetch bulk inquiries from database."
      });
    }
  }
  if (method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: `Method ${method} Not Allowed on /api/support.` });
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Malformed JSON payload." });
    }
  }
  try {
    const db = getStoreDatabase();
    const inquiry = createSupportInquiry(db, body || {});
    bumpAdminVersion(db, "support_inquiry_created", inquiry.contactEmail, inquiry.id);
    return res.status(201).json({
      success: true,
      inquiry: {
        id: inquiry.id,
        organization: inquiry.organization,
        contactEmail: inquiry.contactEmail,
        estimatedQuantity: inquiry.estimatedQuantity,
        createdAt: inquiry.createdAt
      },
      message: "Bulk order inquiry recorded cleanly with NITRRFIE Operations."
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err?.message || "Unable to submit bulk inquiry."
    });
  }
}

// src/api/gemini.ts
import { GoogleGenAI } from "@google/genai";
async function handleGeminiProxy(req, res) {
  setSecurityHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method Not Allowed. Only POST requests are permitted."
    });
  }
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 10)) return;
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Malformed JSON payload." });
    }
  }
  const { prompt } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      error: 'Invalid request: "prompt" field is required and must be a string.'
    });
  }
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: "prompt" cannot be empty.'
    });
  }
  if (trimmedPrompt.length > 4e3) {
    return res.status(400).json({
      error: "Prompt exceeds maximum permitted character limit (4000 chars)."
    });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Gemini AI service is temporarily unavailable: GEMINI_API_KEY is not configured on the server."
    });
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: trimmedPrompt
    });
    return res.status(200).json({
      text: response.text || ""
    });
  } catch (err) {
    console.error("Server-side Gemini API invocation failed:", err?.message || err);
    return res.status(500).json({
      error: "An internal error occurred while processing the request with Gemini AI."
    });
  }
}

// src/api/vercel.ts
function normalizeVercelRequest(req) {
  const rawQuery = { ...req.query || {} };
  const pathParam = rawQuery.__path;
  delete rawQuery.__path;
  const subPath = Array.isArray(pathParam) ? pathParam.join("/") : pathParam || "";
  const cleanSubPath = String(subPath).replace(/^\/+/, "");
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawQuery)) {
    if (Array.isArray(value)) {
      for (const v of value) searchParams.append(key, v);
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }
  const qs = searchParams.toString();
  const normalizedPath = cleanSubPath ? `/api/${cleanSubPath}` : "/api";
  const normalizedUrl = qs ? `${normalizedPath}?${qs}` : normalizedPath;
  req.query = rawQuery;
  req.originalUrl = normalizedUrl;
  req.url = normalizedUrl;
  return req;
}
async function handler(req, res) {
  if (req.method?.toUpperCase() === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Client-Instance-Id, X-Admin-Key"
    );
    return res.status(204).end();
  }
  const apiReq = normalizeVercelRequest(req);
  const apiRes = res;
  const cleanPath = (apiReq.originalUrl || apiReq.url || "").split("?")[0].replace(/\/+$/, "");
  try {
    if (cleanPath === "/api/health") {
      return await handleHealthCheck(apiReq, apiRes);
    }
    getStoreDatabase();
    if (cleanPath === "/api/orders") {
      return await handleOrderProcessing(apiReq, apiRes);
    }
    if (cleanPath === "/api/admin" || cleanPath.startsWith("/api/admin/")) {
      return await handleAdminOperations(apiReq, apiRes);
    }
    if (cleanPath === "/api/products" || cleanPath.startsWith("/api/products/")) {
      return await handleProductsApi(apiReq, apiRes);
    }
    if (cleanPath === "/api/cart" || cleanPath.startsWith("/api/cart/")) {
      return await handleCartOperations(apiReq, apiRes);
    }
    if (cleanPath === "/api/newsletter" || cleanPath.startsWith("/api/newsletter/")) {
      return await handleNewsletterOperations(apiReq, apiRes);
    }
    if (cleanPath === "/api/support") {
      return await handleSupportApi(apiReq, apiRes);
    }
    if (cleanPath === "/api/gemini") {
      return await handleGeminiProxy(apiReq, apiRes);
    }
    return apiRes.status(404).json({ error: "API endpoint not found." });
  } catch (err) {
    console.error("[Vercel API] Unhandled error:", err);
    return apiRes.status(500).json({
      error: typeof err?.message === "string" && err.message ? err.message : "Internal server error processing API request."
    });
  }
}
export {
  handler as default
};
