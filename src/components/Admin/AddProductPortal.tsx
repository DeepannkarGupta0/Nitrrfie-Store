import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Product, Colorway } from '../../types/store';
import { calculateDiscountPercent, formatINR } from '../../utils/cartLogic';
import {
  Package,
  Plus,
  Sparkles,
  Upload,
  Check,
  Tag,
  DollarSign,
  Layers,
  Trash2,
  AlertCircle,
  Eye,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Palette,
  Scissors,
  FileText,
  Sliders,
  ExternalLink,
  Shirt,
  Info,
} from 'lucide-react';

interface AddProductPortalProps {
  onShowNotification: (msg: string) => void;
  onNavigateToCatalog: () => void;
  onNavigateToProduct?: (slug: string) => void;
}

const PRESET_CLUBS = [
  { name: 'National Institute of Technology Raipur', short: 'NIT Raipur Heritage' },
  { name: 'The Entrepreneurship Cell (E-Cell), NIT Raipur', short: 'E-Cell NITRR' },
  { name: 'Innovation Cell & Makerspace (NITRRFIE)', short: 'NITRRFIE Tech' },
  { name: 'Turing Club of Programmers (TCP), NIT Raipur', short: 'TCP NITRR' },
  { name: 'Robotix Club, NIT Raipur', short: 'Robotix NITRR' },
  { name: 'Think India, NIT Raipur Chapter', short: 'Think India' },
  { name: 'NIT Raipur Sports Committee (Samar)', short: 'Samar Sports' },
  { name: 'Cultural Committee (Eclectika)', short: 'Eclectika NITRR' },
  { name: 'Raaga Music Club, NIT Raipur', short: 'Raaga NITRR' },
  { name: 'IEEE Student Branch NIT Raipur', short: 'IEEE NITRR' },
  { name: 'Alumni Association NIT Raipur', short: 'Alumni NITRR' },
];

const PRESET_CATEGORIES = [
  'Outerwear',
  'Campus Essentials',
  'Technical Societies',
  'Club Drops',
  'Accessories',
  'Stationery & Gifts',
];

const PRESET_IMAGES = [
  {
    label: 'Varsity Bomber Jacket',
    category: 'Outerwear',
    url: '/images/catalog/normalized/ecell-varsity-jacket.png',
  },
  {
    label: 'Heritage Collegiate Hoodie',
    category: 'Outerwear',
    url: '/images/catalog/normalized/nitrr-varsity-black-hoodie.jpg',
  },
  {
    label: 'Robotix Cyberpunk Hoodie',
    category: 'Technical Societies',
    url: '/images/catalog/normalized/robotix-cyberpunk-hoodie-front.jpg',
  },
  {
    label: 'Campus Heavyweight Oversized Tee',
    category: 'Campus Essentials',
    url: '/images/catalog/normalized/nitrr-sand-pocket-oversized-tee.jpg',
  },
  {
    label: 'TCP CodeUtsava Pixel Coder Tee',
    category: 'Technical Societies',
    url: '/images/catalog/normalized/tcp-pixel-coder-tee.png',
  },
  {
    label: 'Architecture 01 White Tee',
    category: 'Campus Essentials',
    url: '/images/catalog/normalized/nitrr-white-architecture-01-tee.jpg',
  },
  {
    label: 'NITRR Smart LED Thermal Flask',
    category: 'Accessories',
    url: '/images/catalog/normalized/nitrr-temp-smart-bottle.jpg',
  },
  {
    label: 'Executive 3-Piece Gifting Set',
    category: 'Stationery & Gifts',
    url: '/images/catalog/normalized/nitrr-executive-gifting-set.jpg',
  },
  {
    label: 'Embroidered Collegiate Cap',
    category: 'Accessories',
    url: '/images/catalog/normalized/nitrr-collegiate-cap.jpg',
  },
  {
    label: 'Think India Executive Tee',
    category: 'Club Drops',
    url: '/images/catalog/normalized/think-india-mocha-tee.png',
  },
];

const DEFAULT_COLORWAYS: Colorway[] = [
  { name: 'Classic Black', hex: '#18181b' },
  { name: 'Collegiate Navy', hex: '#1e3a8a' },
  { name: 'Crimson Maroon', hex: '#881337' },
  { name: 'Forest Green', hex: '#14532d' },
  { name: 'Heather Grey', hex: '#64748b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Golden Ochre', hex: '#d97706' },
  { name: 'Royal Blue', hex: '#2563eb' },
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const AddProductPortal: React.FC<AddProductPortalProps> = ({
  onShowNotification,
  onNavigateToCatalog,
  onNavigateToProduct,
}) => {
  const { addProduct } = useCart();

  // Basic Information
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<string>('Outerwear');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [clubIndex, setClubIndex] = useState<number>(0);
  const [customClub, setCustomClub] = useState('');
  const [isCustomClub, setIsCustomClub] = useState(false);
  const [badge, setBadge] = useState('New Campus Drop');
  const [description, setDescription] = useState('');

  // Pricing & Inventory
  const [price, setPrice] = useState<number>(899);
  const [originalPrice, setOriginalPrice] = useState<number>(1299);
  const [stock, setStock] = useState<number>(50);
  const [inStock, setInStock] = useState<boolean>(true);

  // Photos & Media
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('preset');
  const [primaryImage, setPrimaryImage] = useState<string>(PRESET_IMAGES[0].url);
  const [secondaryImage, setSecondaryImage] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Sizing & Colorways
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [selectedColorways, setSelectedColorways] = useState<Colorway[]>([
    DEFAULT_COLORWAYS[0],
    DEFAULT_COLORWAYS[1],
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#fc4c02');

  // Bullet Features
  const [features, setFeatures] = useState<string[]>([
    'Heavyweight 380 GSM Bio-Washed Pre-Shrunk Fleece',
    'Official High-Density NIT Raipur Embroidered Crest',
    'Reinforced Double-Stitched Collar, Cuffs & Hem',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Technical Specifications
  const [material, setMaterial] = useState('100% Super-Combed Bio-Washed Cotton');
  const [gsm, setGsm] = useState('380 GSM Heavyweight Terry Fleece');
  const [fit, setFit] = useState('Regular Collegiate Fit (Unisex)');
  const [print, setPrint] = useState('High-Density 3D Embroidery');

  // Flags
  const [customizable, setCustomizable] = useState(true);
  const [featured, setFeatured] = useState(false);

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  // Preview interactive state
  const [previewColorIndex, setPreviewColorIndex] = useState(0);
  const [previewSize, setPreviewSize] = useState('M');

  // Size toggle
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput('');
  };

  // Colorway toggle / add / remove
  const togglePresetColor = (cw: Colorway) => {
    setSelectedColorways((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === cw.name.toLowerCase());
      if (exists) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((c) => c.name.toLowerCase() !== cw.name.toLowerCase());
      }
      return [...prev, cw];
    });
  };

  const handleAddCustomColor = () => {
    if (!newColorName.trim()) return;
    const exists = selectedColorways.some(
      (c) => c.name.toLowerCase() === newColorName.trim().toLowerCase()
    );
    if (!exists) {
      setSelectedColorways((prev) => [
        ...prev,
        { name: newColorName.trim(), hex: newColorHex },
      ]);
    }
    setNewColorName('');
  };

  const handleRemoveColor = (index: number) => {
    if (selectedColorways.length <= 1) {
      setErrorMsg('At least one colorway is required.');
      return;
    }
    setSelectedColorways((prev) => prev.filter((_, i) => i !== index));
  };

  // Feature actions
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSuggestedFeature = (text: string) => {
    if (!features.includes(text)) {
      setFeatures((prev) => [...prev, text]);
    }
  };

  // File Upload Handler (FileReader -> base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecondary = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setErrorMsg('Image exceeds 1MB server upload limit. Choose a smaller JPG, PNG, or WebP.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isSecondary) {
            setSecondaryImage(reader.result);
          } else {
            setPrimaryImage(reader.result);
          }
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-fill Template
  const handleApplyDescriptionTemplate = () => {
    const club = isCustomClub ? customClub : PRESET_CLUBS[clubIndex].name;
    const generated = `Official collegiate drop designed in collaboration with ${club || 'NIT Raipur'}. Engineered with high-grade breathable textiles, precision needlework, and custom student personalization options. Built to withstand active campus life, academic sessions, and institutional festivals.`;
    setDescription(generated);
  };

  // Form Reset
  const handleResetForm = () => {
    setName('');
    setTagline('');
    setCategory('Outerwear');
    setIsCustomCategory(false);
    setCustomCategory('');
    setClubIndex(0);
    setIsCustomClub(false);
    setCustomClub('');
    setBadge('New Campus Drop');
    setDescription('');
    setPrice(899);
    setOriginalPrice(1299);
    setStock(50);
    setInStock(true);
    setPrimaryImage(PRESET_IMAGES[0].url);
    setSecondaryImage('');
    setCustomImageUrl('');
    setSelectedSizes(['S', 'M', 'L', 'XL']);
    setSelectedColorways([DEFAULT_COLORWAYS[0], DEFAULT_COLORWAYS[1]]);
    setFeatures([
      'Heavyweight 380 GSM Bio-Washed Pre-Shrunk Fleece',
      'Official High-Density NIT Raipur Embroidered Crest',
      'Reinforced Double-Stitched Collar, Cuffs & Hem',
    ]);
    setMaterial('100% Super-Combed Bio-Washed Cotton');
    setGsm('380 GSM Heavyweight Terry Fleece');
    setFit('Regular Collegiate Fit (Unisex)');
    setPrint('High-Density 3D Embroidery');
    setCustomizable(true);
    setFeatured(false);
    setErrorMsg(null);
    setCreatedProduct(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name / title is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!price || price <= 0) {
      setErrorMsg('Please specify a valid price in INR.');
      return;
    }

    if (selectedSizes.length === 0) {
      setErrorMsg('Please select at least one garment size.');
      return;
    }

    if (selectedColorways.length === 0) {
      setErrorMsg('Please select at least one colorway.');
      return;
    }

    if (!primaryImage) {
      setErrorMsg('Please provide a primary product image.');
      return;
    }

    setIsSubmitting(true);

    const club = isCustomClub
      ? { name: customClub.trim() || 'NIT Raipur Collegiate', short: customClub.trim() || 'NITRR' }
      : PRESET_CLUBS[clubIndex];

    const finalCategory = isCustomCategory ? customCategory.trim() || 'Club Drops' : category;

    try {
      const res = await addProduct({
        name: name.trim(),
        club: club.name,
        clubShort: club.short,
        category: finalCategory,
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        tagline:
          tagline.trim() ||
          `${badge} • Official ${club.short} Collegiate Apparel`,
        description:
          description.trim() ||
          `Official collegiate merchandise designed for ${club.name}. Engineered with premium textiles and authentic institute branding for students, staff, and alumni.`,
        image: primaryImage,
        secondaryImage: secondaryImage.trim() || undefined,
        badge: badge.trim() || 'Campus Drop',
        colorways: selectedColorways,
        sizes: selectedSizes,
        features: features.length > 0 ? features : ['Official NIT Raipur Merchandise'],
        customizable,
        featured,
        stock:
          stock === undefined || stock === null || !Number.isFinite(Number(stock))
            ? 50
            : Math.max(0, Math.floor(Number(stock))),
        inStock:
          inStock &&
          (stock === undefined || stock === null || !Number.isFinite(Number(stock))
            ? 50
            : Math.max(0, Math.floor(Number(stock)))) > 0,
        specs: {
          material: material.trim(),
          gsm: gsm.trim(),
          fit: fit.trim(),
          print: print.trim(),
        },
      });

      if (!res.success || !res.product) {
        setErrorMsg(res.error || 'Failed to publish product to central database.');
        return;
      }

      setCreatedProduct(res.product);
      onShowNotification(`Successfully published "${res.product.name}" to store catalog!`);
    } catch {
      setErrorMsg('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const discountPercent = calculateDiscountPercent(originalPrice, price);

  // If successfully created, show confirmation portal view
  if (createdProduct) {
    return (
      <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] p-6 sm:p-10 shadow-sm animate-in fade-in zoom-in-95 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] font-bold block">
            PUBLISHED TO STORE CATALOG
          </span>
          <h2 className="text-2xl sm:text-3xl font-brand font-bold text-[var(--ink)]">
            {createdProduct.name}
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
            This piece is now live across the NIT Raipur Store catalog, instant search, and available for student orders!
          </p>
        </div>

        {/* Product Snapshot Card */}
        <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-28 rounded-xs overflow-hidden bg-white dark:bg-zinc-900 border border-[var(--line)] shrink-0">
            <img
              src={createdProduct.image}
              alt={createdProduct.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[var(--accent-solid)] text-white rounded-xs">
                {createdProduct.badge}
              </span>
              <span className="text-xs font-mono text-[var(--muted)]">
                {createdProduct.clubShort} • {createdProduct.category}
              </span>
            </div>
            <div className="text-sm font-bold text-[var(--ink)]">
              {formatINR(createdProduct.price)}
              {createdProduct.originalPrice > createdProduct.price && (
                <span className="ml-2 text-xs text-[var(--muted)] line-through">
                  {formatINR(createdProduct.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] font-mono">
              Sizes: {createdProduct.sizes.join(', ')} • Stock: {createdProduct.stock} units
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[var(--line)]">
          {onNavigateToProduct && (
            <button
              type="button"
              onClick={() => onNavigateToProduct(createdProduct.slug)}
              className="w-full sm:w-auto px-5 py-3 bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-mono text-xs uppercase tracking-wider font-bold rounded-[var(--r-in)] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View In Live Store</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="w-full sm:w-auto px-5 py-3 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] font-mono text-xs uppercase tracking-wider font-bold rounded-[var(--r-in)] border border-[var(--line)] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Manage In Store Catalog</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-5 py-3 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-[var(--r-in)] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Product</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portal Top Bar */}
      <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[var(--accent-solid)] text-white rounded-xs uppercase tracking-wider">
              NITRR ADMIN STUDIO
            </span>
            <span className="font-mono text-xs text-[var(--muted)]">• New Drop Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-brand font-bold text-[var(--ink)]">
            Create &amp; Publish Campus Product
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Fill in apparel specifications, upload high-res photography, configure size curves, and publish directly to the live student store.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-2 text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] rounded-[var(--r-in)] cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Reset form fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Draft</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="px-3.5 py-2 text-xs font-mono font-bold text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] rounded-[var(--r-in)] cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Back to Catalog</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-[var(--r)] flex items-start gap-3 text-xs font-mono animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Required Details Missing</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout: Form (Left) & Sticky Live Preview (Right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PRODUCT CONFIGURATION SECTIONS */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: ESSENTIAL DETAILS */}
          <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  1. Product Identity &amp; Branding
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                Core Information
              </span>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                Product Title / Name <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NIT Raipur E-Cell Flagship Varsity Jacket"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                required
              />
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                Tagline / Key Highlight
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. 380 GSM Brushed Terry • Custom Back Embroidery"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Category & Society Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                    Store Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {isCustomCategory ? 'Choose Preset' : '+ Custom Category'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Collegiate Body / Society */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                    Club / Department
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomClub(!isCustomClub)}
                    className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {isCustomClub ? 'Select Club' : '+ Custom Society'}
                  </button>
                </div>

                {isCustomClub ? (
                  <input
                    type="text"
                    value={customClub}
                    onChange={(e) => setCustomClub(e.target.value)}
                    placeholder="Enter club/society name..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                ) : (
                  <select
                    value={clubIndex}
                    onChange={(e) => setClubIndex(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {PRESET_CLUBS.map((c, i) => (
                      <option key={c.short} value={i}>
                        {c.short} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Badge & Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Promotional Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. New Drop, Bestseller"
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-5">
                <input
                  type="checkbox"
                  id="customizable"
                  checked={customizable}
                  onChange={(e) => setCustomizable(e.target.checked)}
                  className="w-4 h-4 text-[var(--accent)] rounded cursor-pointer accent-[var(--accent)]"
                />
                <label htmlFor="customizable" className="text-xs font-mono text-[var(--ink)] cursor-pointer">
                  Customizer Studio (Back Name)
                </label>
              </div>

              <div className="flex items-center gap-2.5 pt-5">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-[var(--accent)] rounded cursor-pointer accent-[var(--accent)]"
                />
                <label htmlFor="featured" className="text-xs font-mono text-[var(--ink)] cursor-pointer">
                  Featured on Hero
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Product Narrative &amp; Description
                </label>
                <button
                  type="button"
                  onClick={handleApplyDescriptionTemplate}
                  className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>Insert NITRR Template</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe fabric handfeel, varsity motifs, zipper accents, and collegiate styling..."
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* SECTION 2: PHOTOS & MEDIA */}
          <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  2. Product Photography &amp; Visuals
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                Photos
              </span>
            </div>

            {/* Photo Selection Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-3">
              <button
                type="button"
                onClick={() => setImageTab('preset')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-[var(--r-in)] cursor-pointer transition-colors ${
                  imageTab === 'preset'
                    ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                    : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]'
                }`}
              >
                Preset Campus Library
              </button>

              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-[var(--r-in)] cursor-pointer transition-colors flex items-center gap-1.5 ${
                  imageTab === 'upload'
                    ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                    : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>

              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-[var(--r-in)] cursor-pointer transition-colors ${
                  imageTab === 'url'
                    ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                    : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]'
                }`}
              >
                Web Image URL
              </button>
            </div>

            {/* Tab 1: Preset Library */}
            {imageTab === 'preset' && (
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-[var(--muted)]">
                  Select an authentic high-resolution merchandise mockup from the campus asset vault:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {PRESET_IMAGES.map((preset) => (
                    <div
                      key={preset.label}
                      onClick={() => setPrimaryImage(preset.url)}
                      className={`group relative rounded-[var(--r-in)] overflow-hidden border cursor-pointer transition-all ${
                        primaryImage === preset.url
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-[1.02]'
                          : 'border-[var(--line)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <div className="aspect-square bg-white dark:bg-zinc-900">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-1.5 bg-[var(--paper-2)] text-[9px] font-mono text-[var(--ink)] truncate">
                        {preset.label}
                      </div>
                      {primaryImage === preset.url && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent-solid)] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Upload From Device */}
            {imageTab === 'upload' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-[var(--r)] p-6 text-center transition-colors">
                  <Upload className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" />
                  <p className="text-xs font-mono font-bold text-[var(--ink)]">
                    Drag and drop product photograph, or browse files
                  </p>
                  <p className="text-[10px] font-mono text-[var(--muted)] mt-1">
                    Supports JPG, PNG, WebP up to 1MB (saved to central catalog database).
                  </p>
                  <label className="mt-3 inline-block px-4 py-2 bg-[var(--ink)] text-[var(--on-ink)] text-xs font-mono font-bold rounded-[var(--r-in)] hover:bg-[var(--accent-solid)] hover:text-white cursor-pointer transition-colors shadow-xs">
                    <span>Select File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 3: Web Image URL */}
            {imageTab === 'url' && (
              <div className="space-y-2">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Image Direct URL (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="/images/catalog/normalized/nitrr-varsity-black-hoodie.jpg or https://..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customImageUrl.trim()) {
                        setPrimaryImage(customImageUrl.trim());
                        onShowNotification('Primary image updated from URL.');
                      }
                    }}
                    className="px-3.5 py-2 bg-[var(--ink)] text-[var(--on-ink)] text-xs font-mono font-bold rounded-[var(--r-in)] hover:bg-[var(--accent-solid)] hover:text-white cursor-pointer transition-colors"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            )}

            {/* Secondary Image Row (Back View) */}
            <div className="pt-3 border-t border-[var(--line)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--ink)] block">
                    Secondary Image / Back View (Optional)
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    Used for alternate angle or hover preview on shop catalog
                  </span>
                </div>
                <label className="px-3 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] cursor-pointer transition-colors">
                  <span>Upload Back View</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>

              {secondaryImage && (
                <div className="mt-2.5 flex items-center gap-3 p-2 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
                  <div className="w-12 h-14 bg-white rounded overflow-hidden shrink-0 border border-[var(--line)]">
                    <img src={secondaryImage} alt="Secondary" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[var(--ink)] truncate font-semibold">
                      Secondary photo loaded
                    </p>
                    <p className="text-[10px] font-mono text-[var(--muted)]">Back/Detail view configured</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecondaryImage('')}
                    className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                    title="Remove secondary image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: PRICING & INVENTORY */}
          <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  3. Pricing &amp; Stock Inventory
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                Financials
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Selling Price (₹ INR) <span className="text-[var(--accent)]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>
              </div>

              {/* MRP / Original Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Original MRP (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                {discountPercent > 0 && (
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {discountPercent}% OFF student discount
                  </p>
                )}
              </div>

              {/* Stock Units */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-semibold text-[var(--ink)]">
                  Stock Units Available
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="inStockToggle"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 text-[var(--accent)] rounded cursor-pointer accent-[var(--accent)]"
              />
              <label htmlFor="inStockToggle" className="text-xs font-mono text-[var(--ink)] cursor-pointer">
                Product is In-Stock &amp; ready for hostel delivery or Makerspace pickup
              </label>
            </div>
          </div>

          {/* SECTION 4: SIZES & COLORWAYS */}
          <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  4. Collegiate Sizing &amp; Colorways
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                Variants
              </span>
            </div>

            {/* SIZES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-[var(--ink)]">
                  Available Sizes ({selectedSizes.length} Selected)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSizes(STANDARD_SIZES)}
                    className="text-[10px] font-mono text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[var(--muted)]">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSizes(['M', 'L'])}
                    className="text-[10px] font-mono text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    Standard (M, L)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {STANDARD_SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-[var(--r-in)] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs scale-105'
                          : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}

                {/* Additional custom sizes */}
                {selectedSizes
                  .filter((s) => !STANDARD_SIZES.includes(s))
                  .map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-[var(--r-in)] bg-[var(--accent-solid)] text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>{size}</span>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  ))}
              </div>

              {/* Add Custom Size */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  placeholder="Custom size (e.g. Free Size, 4XL)"
                  className="w-48 px-2.5 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-[var(--ink)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                >
                  + Add Size
                </button>
              </div>
            </div>

            {/* COLORWAYS */}
            <div className="space-y-3 pt-3 border-t border-[var(--line)]">
              <label className="text-xs font-mono font-semibold text-[var(--ink)] block">
                Collegiate Colorways ({selectedColorways.length} Active)
              </label>

              {/* Active Colorways Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedColorways.map((cw, i) => (
                  <div
                    key={`${cw.name}-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                      style={{ backgroundColor: cw.hex }}
                    />
                    <span className="font-semibold">{cw.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(i)}
                      className="text-[var(--muted)] hover:text-[var(--bad)] cursor-pointer ml-1"
                      title="Remove colorway"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Preset Colors Palette */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                  Quick-Add Campus Palette:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_COLORWAYS.map((cw) => {
                    const isSelected = selectedColorways.some(
                      (c) => c.name.toLowerCase() === cw.name.toLowerCase()
                    );
                    return (
                      <button
                        key={cw.name}
                        type="button"
                        onClick={() => togglePresetColor(cw)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-[var(--r-in)] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold'
                            : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--line-2)]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/25"
                          style={{ backgroundColor: cw.hex }}
                        />
                        <span>{cw.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Colorway */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-8 h-8 rounded border border-[var(--line)] cursor-pointer p-0 bg-transparent"
                  title="Pick color"
                />
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Custom color name (e.g. Steel Grey)"
                  className="w-48 px-2.5 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white rounded-[var(--r-in)] cursor-pointer transition-colors"
                >
                  + Add Color
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: FEATURES & TECHNICAL SPECS */}
          <div className="bg-[var(--paper)] p-5 sm:p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  5. Materials &amp; Bullet Highlights
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                Specs
              </span>
            </div>

            {/* Bullet features list */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-[var(--ink)] block">
                Garment Highlights ({features.length} Bullets)
              </label>

              <div className="space-y-1.5">
                {features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      <span className="text-[var(--ink)]">{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(i)}
                      className="text-[var(--muted)] hover:text-red-500 cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add feature row */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="e.g. Quilted satin diamond lining inside"
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-xs font-mono font-bold text-[var(--ink)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                >
                  Add Bullet
                </button>
              </div>

              {/* Suggested quick chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  '380 GSM Heavyweight Terry Fleece',
                  'Official High-Density Embroidery',
                  'Heavy 2x2 Cotton Ribbed Cuffs',
                  'Hidden Kangaroo Phone Pocket',
                  'Pre-Shrunk Bio-Washed Finish',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddSuggestedFeature(chip)}
                    className="text-[10px] font-mono px-2 py-0.5 bg-[var(--paper-2)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] text-[var(--muted)] border border-[var(--line)] rounded cursor-pointer transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--line)]">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold text-[var(--muted)] uppercase">
                  Fabric Composition
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold text-[var(--muted)] uppercase">
                  GSM Weight
                </label>
                <input
                  type="text"
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold text-[var(--muted)] uppercase">
                  Cut &amp; Fit
                </label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold text-[var(--muted)] uppercase">
                  Embroidery / Print Method
                </label>
                <input
                  type="text"
                  value={print}
                  onChange={(e) => setPrint(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON BAR */}
          <div className="bg-[var(--paper)] p-5 rounded-[var(--r)] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs font-mono text-[var(--muted)]">
              Review details in the live preview before publishing.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-[var(--r-in)] shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Publishing Drop...' : 'Publish Product to Store'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY LIVE STORE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="bg-[var(--paper)] p-4 sm:p-5 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="font-brand text-sm font-bold text-[var(--ink)]">
                    Live Store Simulation
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Interactive Mockup
                </span>
              </div>

              {/* SIMULATED PRODUCT CARD AS RENDERED ON CATALOG */}
              <div className="bg-white dark:bg-[#121215] rounded-[var(--r-in)] border border-[var(--line)] overflow-hidden shadow-md group">
                {/* Image Container with Badge */}
                <div className="relative aspect-4/5 bg-neutral-100 dark:bg-zinc-900 overflow-hidden">
                  <img
                    src={primaryImage}
                    alt={name || 'Product Preview'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-solid)] text-white rounded-xs shadow-xs">
                      {badge || 'Campus Drop'}
                    </span>
                  </div>

                  {/* Discount chip */}
                  {discountPercent > 0 && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-600 text-white rounded-xs shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}

                  {/* Customizer Tag */}
                  {customizable && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-black/80 text-amber-300 backdrop-blur-xs rounded-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Custom Lettering
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Information */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[var(--accent)] font-bold">
                      {isCustomClub ? customClub || 'NIT Raipur' : PRESET_CLUBS[clubIndex].short}
                    </span>
                    <span className="text-[var(--muted)]">
                      {isCustomCategory ? customCategory || 'Apparel' : category}
                    </span>
                  </div>

                  <h4 className="font-brand text-sm font-bold text-[var(--ink)] leading-snug line-clamp-2">
                    {name || 'NIT Raipur Collegiate Piece Name'}
                  </h4>

                  <p className="text-[11px] font-mono text-[var(--muted)] line-clamp-1">
                    {tagline || 'Heavyweight garment specifications'}
                  </p>

                  {/* Colorways dots */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {selectedColorways.map((cw, i) => (
                      <button
                        key={`${cw.name}-${i}`}
                        type="button"
                        onClick={() => setPreviewColorIndex(i)}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          previewColorIndex === i
                            ? 'ring-2 ring-[var(--accent)] border-white/40 scale-110'
                            : 'border-black/20 dark:border-white/25'
                        }`}
                        style={{ backgroundColor: cw.hex }}
                        title={cw.name}
                      />
                    ))}
                    <span className="text-[9px] font-mono text-[var(--muted)] ml-1">
                      {selectedColorways[previewColorIndex]?.name}
                    </span>
                  </div>

                  {/* Price & Sizes */}
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-base font-bold text-[var(--ink)]">
                          {formatINR(price || 0)}
                        </span>
                        {originalPrice > price && (
                          <span className="font-mono text-xs text-[var(--muted)] line-through">
                            {formatINR(originalPrice)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[var(--muted)] block">
                        Inclusive of campus handover taxes
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {selectedSizes.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)] rounded-xs"
                        >
                          {s}
                        </span>
                      ))}
                      {selectedSizes.length > 3 && (
                        <span className="text-[9px] font-mono text-[var(--muted)]">
                          +{selectedSizes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs & Assurance Checklist */}
              <div className="p-3 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] space-y-1.5 text-[11px] font-mono text-[var(--muted)]">
                <div className="flex items-center justify-between text-[var(--ink)] font-semibold">
                  <span>Store Visibility</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {inStock ? 'Ready for Instant Publishing' : 'Pre-Order / Sold Out'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fabric</span>
                  <span className="text-[var(--ink)] truncate max-w-[180px]">{material}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Weight</span>
                  <span className="text-[var(--ink)]">{gsm}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stock Target</span>
                  <span className="text-[var(--ink)]">{stock} Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
