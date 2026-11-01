import type { Product } from "@/types";
import { netrifyProducts, type NetrifyProduct } from "./netrifyProducts";

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

export const products: CampusProduct[] = netrifyProducts.map((p, idx) => ({
  id: p.id,
  slug: p.slug,
  sku: `NITRRFIE-${p.slug.toUpperCase().slice(0, 8)}-${idx + 1}`,
  name: p.name,
  tagline: p.tagline,
  price: p.price,
  originalPrice: p.originalPrice,
  image: p.image,
  category: p.category,
  club: p.club,
  clubShort: p.clubShort,
  badge: p.badge,
  description: p.description,
  colorways: p.colorways,
  sizes: p.sizes,
  features: p.features,
  customizable: p.customizable,
  featured: p.featured,
}));