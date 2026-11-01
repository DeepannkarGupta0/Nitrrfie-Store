import type { Product } from "@/types";

export interface CampusProduct extends Product {
  club?: string;
  clubShort?: string;
  badge?: string;
  originalPrice?: number;
  colorways?: { name: string; hex: string }[];
  sizes?: string[];
  features?: string[];
  customizable?: boolean;
}

export const products: CampusProduct[] = [
  {
    id: "nitrrfie-1",
    slug: "ecell-varsity-bomber-jacket",
    sku: "NITRRFIE-EC-01",
    name: "E-Cell Official Varsity Bomber Jacket",
    tagline: "Hold The Vision • Premium Full-Zip Varsity Outerwear",
    price: 600,
    originalPrice: 799,
    image: "/images/merchandise/e-cell-bomber-jacket.jpg",
    category: "Outerwear",
    club: "The Entrepreneurship Cell (E-Cell), NIT Raipur",
    clubShort: "E-Cell NITRR",
    badge: "Signature Outerwear",
    description: "The official collegiate bomber jacket engineered for E-Cell NIT Raipur. Features custom student name lettering on the back, the iconic 'Hold the Vision' motto, and minimal left-chest embroidery. Built with a wind-resistant shell and insulated fleece lining.",
    colorways: [
      { name: "Classic Black", hex: "#18181b" },
      { name: "Dark Blue", hex: "#1e3a8a" },
      { name: "Olive Green", hex: "#365314" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Custom Name Embroidery on Back",
      "Embroidered E-Cell Minimalist Chest Crest",
      "Heavyweight Fleece Insulation",
      "Ribbed Bomber Collar & Cuffs"
    ],
    customizable: true,
  },
  {
    id: "nitrrfie-2",
    slug: "think-india-oversized-tee",
    sku: "NITRRFIE-TI-02",
    name: "Think India NIT Raipur Executive Oversized Tee",
    tagline: "Think. Unite. Lead. Transform. • Official Coordinator Series",
    price: 499,
    originalPrice: 650,
    image: "/images/merchandise/think-india-nit-raipur-tees.jpg",
    category: "Campus Essentials",
    club: "Think India, NIT Raipur Chapter",
    clubShort: "Think India",
    badge: "Institutional Edition",
    description: "Heavyweight 240 GSM drop-shoulder tee for the coordinators and members of Think India NIT Raipur. Features the iconic national transformation typography across the back and subtle institutional chest branding.",
    colorways: [
      { name: "Mocha Brown", hex: "#4a3728" },
      { name: "Crisp White", hex: "#f8fafc" },
      { name: "Midnight Black", hex: "#18181b" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "240 GSM 100% Combed Terry Cotton",
      "Puff-Printed Back Typography",
      "Pre-shrunk Enzyme Wash Fabric",
      "Comfort Drop-Shoulder Silhouette"
    ],
    customizable: false,
  },
  {
    id: "nitrrfie-3",
    slug: "icell-mclaren-f1-tee",
    sku: "NITRRFIE-IC-03",
    name: "I-Cell F1 Drop: McLaren Papaya Edition",
    tagline: "Papaya Racing Heritage • Club Exclusive Oversized Fit",
    price: 450,
    originalPrice: 599,
    image: "/images/merchandise/innovation-cell-mclaren-tee.jpg",
    category: "Club Drops",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    badge: "Motorsport Drop",
    description: "Motorsport-inspired technical lifestyle tee co-created with the Innovation Cell and student robotics engineers. Features McLaren Papaya racing telemetry graphics and aero speedlines.",
    colorways: [
      { name: "Pitch Black & Papaya", hex: "#18181b" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "High-Density Screen Print",
      "Breathable 220 GSM Cotton Blend",
      "Official Innovation Cell Hem Tag",
      "Fade-Resistant Pigment"
    ],
    customizable: false,
  },
  {
    id: "nitrrfie-4",
    slug: "tcp-codeutsava-hackathon-tee",
    sku: "NITRRFIE-TCP-04",
    name: "TCP CodeUtsava X.0 Official Tech Tee",
    tagline: "Code. Innovate. Celebrate. • Flagship Hackathon Merch",
    price: 450,
    originalPrice: 599,
    image: "/images/merchandise/tcp-codeutsava-podium-tees.jpg",
    category: "Technical Societies",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    badge: "Hackathon Edition",
    description: "The official commemorative tee for Central India's largest student-run hackathon, CodeUtsava by Turing Club of Programmers. Clean algorithmic geometric aesthetics with high-contrast tech societies typography.",
    colorways: [
      { name: "Cyber Cyan", hex: "#06b6d4" },
      { name: "Solar Orange", hex: "#f97316" },
      { name: "Acid Lime", hex: "#84cc16" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Matrix-Inspired Minimalist Typography",
      "Anti-Pilling Cotton Blend",
      "Double-Stitched Seams for Durability",
      "Official CodeUtsava Branding"
    ],
    customizable: true,
  },
  {
    id: "nitrrfie-5",
    slug: "icell-ferrari-f1-tee",
    sku: "NITRRFIE-IC-05",
    name: "I-Cell F1 Drop: Scuderia Ferrari #44 Tee",
    tagline: "Rosso Corsa Passion • Motorsport Technical Edition",
    price: 450,
    originalPrice: 599,
    image: "/images/merchandise/innovation-cell-ferrari-tee.jpg",
    category: "Club Drops",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    badge: "Motorsport Drop",
    description: "Commemorating high-speed automotive engineering and maker design. Features Scuderia #44 racing livery on deep anthracite cotton, celebrated across the NIT Raipur student engineering community.",
    colorways: [
      { name: "Anthracite & Rosso", hex: "#1f2937" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Vibrant Screen Print with Gloss Finish",
      "220 GSM Ringspun Cotton",
      "Reinforced Ribbed Crewneck",
      "Official I-Cell Series"
    ],
    customizable: false,
  },
  {
    id: "nitrrfie-6",
    slug: "makerspace-technical-crew-hoodie",
    sku: "NITRRFIE-MK-06",
    name: "Makerspace NIT Raipur Heavyweight Technical Hoodie",
    tagline: "Build. Hack. Ship. • Workshop & FabLab Series",
    price: 750,
    originalPrice: 999,
    image: "/images/merchandise/think-india-nit-raipur-tees.jpg",
    category: "Outerwear",
    club: "Makerspace NIT Raipur",
    clubShort: "Makerspace",
    badge: "Workshop Edition",
    description: "Engineered for long night shifts in the fablab, computer center, and hackathons. Heavy 380 GSM brushed fleece with oversized kangaroo pockets and laser-cut metal eyelets.",
    colorways: [
      { name: "Carbon Grey", hex: "#374151" },
      { name: "Deep Navy", hex: "#1e3a8a" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    features: [
      "380 GSM Heavyweight Brushed Fleece",
      "Double-Layer Hood with Thick Drawstrings",
      "Hidden Kangaroo Stash Pocket",
      "Precision Screen-Printed Schematics"
    ],
    customizable: true,
  },
  {
    id: "nitrrfie-7",
    slug: "samar-sports-jersey",
    sku: "NITRRFIE-SM-07",
    name: "Samar Annual Sports Festival Dry-Fit Jersey",
    tagline: "Unleash The Arena • Breathable Athletic Gear",
    price: 399,
    originalPrice: 499,
    image: "/images/merchandise/tcp-codeutsava-graphic-tees.jpg",
    category: "Event Specials",
    club: "Sports Committee, NIT Raipur",
    clubShort: "Samar Sports",
    badge: "Sports Edition",
    description: "Engineered for intramural tournaments and the Samar inter-college sports festival. Ultra-breathable honeycomb moisture-wicking poly-mesh with vibrant dye-sublimated graphics.",
    colorways: [
      { name: "Flame Red", hex: "#dc2626" },
      { name: "Royal Blue", hex: "#2563eb" },
      { name: "Emerald Green", hex: "#059669" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "100% Quick-Dry Micro-Poly Mesh",
      "Anti-Odor & Sweat-Wicking Technology",
      "Sublimated Non-Fading Colors",
      "Lightweight Athletic Cut"
    ],
    customizable: true,
  },
  {
    id: "nitrrfie-8",
    slug: "aavartan-technocracia-edition",
    sku: "NITRRFIE-AV-08",
    name: "Aavartan Science & Tech Fest Commemorative Tee",
    tagline: "Vigyanam Anantam • Central India's Premier Tech Fest",
    price: 420,
    originalPrice: 550,
    image: "/images/merchandise/innovation-cell-mercedes-tee.jpg",
    category: "Event Specials",
    club: "Technocracy - Tech Committee, NIT Raipur",
    clubShort: "Aavartan",
    badge: "Fest Edition",
    description: "Official commemorative t-shirt for Aavartan, the annual central India techno-management fest of NIT Raipur. Features celestial and quantum cyber graphics with phosphorescent glow elements.",
    colorways: [
      { name: "Obsidian Black", hex: "#09090b" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "220 GSM Pure Cotton",
      "Luminescent Print Accents",
      "Comfort Daily Fit",
      "Official Technocracy Hologram Seal"
    ],
    customizable: false,
  },
  // Legacy aliases to preserve backward compatibility for old test routes
  {
    id: "legacy-1",
    slug: "404-not-found-tee",
    sku: "NITRRFIE-LEGACY-01",
    name: "E-Cell Official Varsity Bomber Jacket",
    tagline: "Hold The Vision • Premium Full-Zip Varsity Outerwear",
    price: 600,
    image: "/images/merchandise/e-cell-bomber-jacket.jpg",
    category: "Outerwear",
    description: "The official collegiate bomber jacket engineered for E-Cell NIT Raipur.",
  },
  {
    id: "legacy-2",
    slug: "passed-engineering-drawing-hoodie",
    sku: "NITRRFIE-LEGACY-02",
    name: "Makerspace NIT Raipur Heavyweight Technical Hoodie",
    tagline: "Build. Hack. Ship. • Workshop & FabLab Series",
    price: 750,
    image: "/images/merchandise/e-cell-bomber-jacket.jpg",
    category: "Outerwear",
    description: "Engineered for long night shifts in the fablab, computer center, and hackathons.",
  },
];