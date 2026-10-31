export interface NetrifyProduct {
  id: string;
  slug: string;
  name: string;
  club: string;
  clubShort: string;
  category: "Outerwear" | "Club Drops" | "Campus Essentials" | "Technical Societies" | "Event Specials";
  price: number;
  originalPrice?: number;
  tagline: string;
  description: string;
  image: string;
  badge?: string;
  colorways: { name: string; hex: string }[];
  sizes: string[];
  features: string[];
  customizable: boolean;
  featured: boolean;
}

export interface NetrifyCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
  itemCount: number;
  accentColor: string;
  featuredClub: string;
}

export const netrifyProducts: NetrifyProduct[] = [
  {
    id: "netrify-1",
    slug: "ecell-varsity-bomber-jacket",
    name: "E-Cell Official Varsity Bomber Jacket",
    club: "The Entrepreneurship Cell (E-Cell), NIT Raipur",
    clubShort: "E-Cell NITRR",
    category: "Outerwear",
    price: 600,
    originalPrice: 799,
    tagline: "Hold The Vision • Premium Full-Zip Varsity Outerwear",
    description: "The official collegiate bomber jacket engineered for E-Cell NIT Raipur. Features custom student name lettering on the back, the iconic 'Hold the Vision' motto, and minimal left-chest embroidery. Built with a wind-resistant shell and insulated fleece lining.",
    image: "/images/merchandise/e-cell-bomber-jacket.jpg",
    badge: "Signature Outerwear",
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
    featured: true
  },
  {
    id: "netrify-2",
    slug: "think-india-executive-tee",
    name: "Think India NIT Raipur Executive Oversized Tee",
    club: "Think India, NIT Raipur Chapter",
    clubShort: "Think India",
    category: "Campus Essentials",
    price: 499,
    originalPrice: 650,
    tagline: "Think. Unite. Lead. Transform. • Official Coordinator Series",
    description: "Official oversized collegiate tee carrying the authentic National Institute of Technology Raipur institutional crest alongside Think India's sun emblem. Features an inspirational expedition back graphic with customizable name and designation print.",
    image: "/images/merchandise/think-india-nit-raipur-tees.jpg",
    badge: "Institutional Edition",
    colorways: [
      { name: "Mocha Brown", hex: "#4a3728" },
      { name: "Crisp White", hex: "#f8fafc" },
      { name: "Midnight Black", hex: "#18181b" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Official NIT Raipur Institutional Crest",
      "Customizable Student Name & Batch",
      "220 GSM Bio-Washed Combed Cotton",
      "Relaxed Drop-Shoulder Silhouette"
    ],
    customizable: true,
    featured: true
  },
  {
    id: "netrify-3",
    slug: "innovation-cell-mclaren-f1-tee",
    name: "I-Cell F1 Drop: McLaren Papaya Edition",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Papaya Racing Heritage • Club Exclusive Oversized Fit",
    description: "Crafted by the Innovation Cell in collaboration with NIT Raipur Makerspace. High-octane motorsport aesthetic pairing iconic McLaren Formula 1 typography with number 01 back lettering and front Innovation Cell lightbulb crest.",
    image: "/images/merchandise/innovation-cell-mclaren-tee.jpg",
    badge: "Motorsport Drop",
    colorways: [
      { name: "Pitch Black & Papaya", hex: "#18181b" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    features: [
      "Official Makerspace Collaboration",
      "240 GSM Heavyweight French Terry",
      "Vibrant Papaya Orange Screenprint",
      "Club Exclusive Limited Batch"
    ],
    customizable: false,
    featured: true
  },
  {
    id: "netrify-4",
    slug: "tcp-codeutsava-podium-tees",
    name: "TCP CodeUtsava X.0 Official Tech Tee",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    category: "Technical Societies",
    price: 450,
    originalPrice: 599,
    tagline: "Code. Innovate. Celebrate. • Flagship Hackathon Merch",
    description: "Commemorative apparel for CodeUtsava X.0 — Central India's premier hackathon organized by TCP NIT Raipur. Minimalist cyber typography with optional personalized handle print on back and signature neon color options.",
    image: "/images/merchandise/tcp-codeutsava-podium-tees.jpg",
    badge: "Hackathon Edition",
    colorways: [
      { name: "Cyber Cyan", hex: "#06b6d4" },
      { name: "Solar Orange", hex: "#f97316" },
      { name: "Acid Lime", hex: "#84cc16" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    features: [
      "Official CodeUtsava X.0 Hackathon Merch",
      "Customizable Programmer Tag",
      "Breathable All-Night Hackathon Cotton",
      "High-Contrast Neon Lettering"
    ],
    customizable: true,
    featured: true
  },
  {
    id: "netrify-5",
    slug: "innovation-cell-ferrari-f1-tee",
    name: "I-Cell F1 Drop: Scuderia Ferrari #44 Tee",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Rosso Corsa #44 • Prancing Horse Racing Aesthetic",
    description: "Scuderia Ferrari racing tribute from the Innovation Cell & Makerspace. Striking yellow-rimmed number 44 back graphics with the Prancing Horse emblem and Innovation Cell lightbulb crest on front chest.",
    image: "/images/merchandise/innovation-cell-ferrari-tee.jpg",
    badge: "Motorsport Drop",
    colorways: [
      { name: "Rosso Corsa & Black", hex: "#18181b" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    features: [
      "Official Innovation Cell & Makerspace Drop",
      "High-Density Screenprint",
      "Reinforced Ribbed Crewneck",
      "Boxy Streetwear Fit"
    ],
    customizable: false,
    featured: true
  },
  {
    id: "netrify-6",
    slug: "tcp-codeutsava-graphic-series",
    name: "TCP CodeUtsava Cyber Graphic Edition",
    club: "Turing Club of Programmers (TCP), NIT Raipur",
    clubShort: "TCP NITRR",
    category: "Technical Societies",
    price: 499,
    originalPrice: 650,
    tagline: "Holo-Glitch & Pixel Art • Developer Culture Series",
    description: "Collector's edition graphic tees from Turing Club of Programmers. Showcases 'BORN TO HACK' holographic skull art, the pixel-art 8-bit coffee developer ghost, and Edgerunners hacker aesthetics.",
    image: "/images/merchandise/tcp-codeutsava-graphic-tees.jpg",
    badge: "Art & Graphic Drop",
    colorways: [
      { name: "Born to Hack (Holo)", hex: "#27272a" },
      { name: "Pixel Ghost (8-Bit)", hex: "#3f3f46" },
      { name: "Cyber Hacker (Anime)", hex: "#18181b" }
    ],
    sizes: ["S", "M", "L", "XL"],
    features: [
      "Detailed Multi-Color Halftone Screenprint",
      "100% Ring-Spun Combed Cotton",
      "Zero-Feel Ink Printing",
      "Limited Edition Release"
    ],
    customizable: false,
    featured: true
  },
  {
    id: "netrify-7",
    slug: "innovation-cell-mercedes-f1-tee",
    name: "I-Cell F1 Drop: Mercedes-AMG Petronas #63 Tee",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Petronas Teal #63 • Silver Arrows Engineering Spirit",
    description: "Motorsport oversized tee celebrating Mercedes-AMG Petronas with dual-tone teal back print, racing number 63, and the Innovation Cell lightbulb crest on the front left chest.",
    image: "/images/merchandise/innovation-cell-mercedes-tee.jpg",
    badge: "Motorsport Drop",
    colorways: [
      { name: "Petronas Teal & Black", hex: "#18181b" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    features: [
      "Makerspace Engineering Partnership",
      "Dual-Tone Cyan & Teal Print",
      "240 GSM Premium Cotton",
      "Oversized Streetwear Silhouette"
    ],
    customizable: false,
    featured: false
  },
  {
    id: "netrify-8",
    slug: "innovation-cell-redbull-f1-tee",
    name: "I-Cell F1 Drop: Red Bull Racing #03 Tee",
    club: "Innovation Cell & Makerspace, NIT Raipur",
    clubShort: "Innovation Cell",
    category: "Club Drops",
    price: 450,
    originalPrice: 599,
    tagline: "Racing Bulls Heritage • High-Voltage Red & Yellow Print",
    description: "High-energy Red Bull Racing edition oversized t-shirt with signature red and yellow racing typography, number 03 back print, and Innovation Cell chest badge.",
    image: "/images/merchandise/innovation-cell-redbull-tee.jpg",
    badge: "Motorsport Drop",
    colorways: [
      { name: "Racing Red & Black", hex: "#18181b" }
    ],
    sizes: ["M", "L", "XL", "XXL"],
    features: [
      "Official Innovation Cell & Makerspace Drop",
      "High-Density Plastisol Print",
      "Heavyweight Drop Shoulder Cut",
      "Fade-Resistant Inks"
    ],
    customizable: false,
    featured: false
  }
];

export const netrifyCollections: NetrifyCollection[] = [
  {
    id: "col-essentials",
    title: "NIT Raipur Essentials",
    subtitle: "Heritage & Collegiate Wear",
    description: "Core institutional merchandise featuring official college insignias, varsity hoodies, and everyday campus wear.",
    badge: "Core Line",
    image: "/images/merchandise/think-india-nit-raipur-tees.jpg",
    itemCount: 12,
    accentColor: "#ff782e",
    featuredClub: "NIT Raipur Campus"
  },
  {
    id: "col-committees",
    title: "Committee & Cell Drops",
    subtitle: "Student Leadership Apparel",
    description: "Official releases from student governing bodies including E-Cell, Innovation Cell, Makerspace, and Placement Committee.",
    badge: "Official Cells",
    image: "/images/merchandise/e-cell-bomber-jacket.jpg",
    itemCount: 8,
    accentColor: "#e05b12",
    featuredClub: "E-Cell & Innovation Cell"
  },
  {
    id: "col-technical",
    title: "Technical Societies",
    subtitle: "Hackathon & Developer Editions",
    description: "Specialized drops for Turing Club of Programmers (TCP), Robotics, Coding clubs, and flagship hackathons like CodeUtsava.",
    badge: "Tech & Code",
    image: "/images/merchandise/tcp-codeutsava-podium-tees.jpg",
    itemCount: 9,
    accentColor: "#0284c7",
    featuredClub: "TCP NIT Raipur"
  },
  {
    id: "col-cultural",
    title: "Cultural & Fest Merchandise",
    subtitle: "Eclectika & Samar Commemoratives",
    description: "Limited festival releases, cultural committee gear, inter-NIT tournament jerseys, and annual fest commemorative collections.",
    badge: "Campus Events",
    image: "/images/merchandise/tcp-codeutsava-graphic-tees.jpg",
    itemCount: 6,
    accentColor: "#ea580c",
    featuredClub: "Fest Committees"
  }
];

export const campusStats = [
  { label: "Student Clubs & Cells", value: "24+" },
  { label: "Verified Campus Drops", value: "100%" },
  { label: "Campus Delivery Points", value: "6 Locations" },
  { label: "Student Community", value: "5,000+" }
];
