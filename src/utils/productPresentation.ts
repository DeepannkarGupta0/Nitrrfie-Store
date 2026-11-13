import type { Product } from '../types/store';

/**
 * Formats product tagline for customer-facing cards and summaries by stripping
 * technical GSM numbers and manufacturing jargon while leaving useful info intact.
 * Technical specs remain stored on the product record and shown inside Product Details.
 */
export function simplifyTagline(tagline: string, fallbackCategory?: string): string {
  if (!tagline) return fallbackCategory || '';

  const cleanedParts = tagline
    .split('•')
    .map((part) => part.trim())
    .map((part) =>
      part
        .replace(/\b\d{2,3}\s*\+?\s*GSM\b/gi, '')
        .replace(/\bBio-Washed\b/gi, 'Soft Combed')
        .replace(/\bDual-Sided\s+8-Pass\s+Screen\s+Print\b/gi, 'Full-Color Back Graphic')
        .replace(/\bMicro-Ripstop\s+Membrane\b/gi, 'Weather-Resistant Shell')
        .replace(/\bDouble-Wall\s+Vacuum\b/gi, 'Insulated Steel')
        .replace(/\bPlastisol\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter((part) => {
      if (!part || part.length < 3) return false;
      // Drop pure fabric-weight stubs left behind after GSM removal
      if (/^(heavyweight|brushed\s+heavyweight\s+fleece|ultra-soft\s+fleece|heavyweight\s+cotton|combed\s+cotton)$/i.test(part)) {
        return false;
      }
      return true;
    });

  if (cleanedParts.length === 0) {
    return fallbackCategory ? `Official ${fallbackCategory} Edition` : 'Official NIT Raipur Edition';
  }

  return cleanedParts.slice(0, 2).join(' · ');
}

/**
 * Simplifies feature bullets for primary purchase view by removing raw GSM/production pass jargon,
 * while preserving decision-making details (embroidery, pockets, fit, insulation, washability).
 */
export function getCustomerHighlights(features: string[] = []): string[] {
  return features
    .map((feat) =>
      feat
        .replace(/\b\d{2,3}\s*\+?\s*GSM\s*/gi, '')
        .replace(/\bBio-Washed\s*/gi, 'Soft ')
        .replace(/\bPlastisol\s*/gi, '')
        .replace(/\bMulti-Pass\s+High-Resolution\s+8-Color\b/gi, 'Vibrant Full-Color')
        .replace(/\b8-Color\s*/gi, 'Full-Color ')
        .replace(/\bPre-shrunk\s+Fabric\s+with\s+Anti-Pilling\s+Finish\b/gi, 'Pre-shrunk, Anti-Pilling Cotton')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

/**
 * Extracts structured technical specifications for the secondary collapsible
 * "Product Details & Specifications" section on ProductDetailView.
 */
export function getTechnicalSpecs(product: Product): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  if (product.specs?.material) {
    rows.push({ label: 'Material', value: product.specs.material });
  }
  if (product.specs?.gsm) {
    rows.push({ label: 'Fabric Weight / Grade', value: product.specs.gsm });
  }
  if (product.specs?.fit) {
    rows.push({ label: 'Fit & Sizing', value: product.specs.fit });
  }
  if (product.specs?.print) {
    rows.push({ label: 'Artwork & Finish', value: product.specs.print });
  }
  if (product.club) {
    rows.push({ label: 'Issued By', value: product.club });
  }
  if (product.id) {
    rows.push({ label: 'Catalog Reference', value: product.id.toUpperCase() });
  }

  return rows;
}
