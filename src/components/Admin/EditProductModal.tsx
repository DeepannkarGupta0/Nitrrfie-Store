import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Product, Colorway } from '../../types/store';
import { calculateDiscountPercent, formatINR } from '../../utils/cartLogic';
import {
  X,
  Save,
  Check,
  Upload,
  Trash2,
  Sparkles,
  DollarSign,
  Palette,
  Shirt,
  Layers,
  Image,
  Eye,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onUpdated?: () => void;
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
    url: '/images/catalog/normalized/ecell-varsity-jacket.png',
  },
  {
    label: 'Heritage Collegiate Hoodie',
    url: '/images/catalog/normalized/nitrr-varsity-black-hoodie.jpg',
  },
  {
    label: 'Robotix Cyberpunk Hoodie',
    url: '/images/catalog/normalized/robotix-cyberpunk-hoodie-front.jpg',
  },
  {
    label: 'Campus Heavyweight Oversized Tee',
    url: '/images/catalog/normalized/nitrr-sand-pocket-oversized-tee.jpg',
  },
  {
    label: 'TCP CodeUtsava Pixel Coder Tee',
    url: '/images/catalog/normalized/tcp-pixel-coder-tee.png',
  },
  {
    label: 'Architecture 01 White Tee',
    url: '/images/catalog/normalized/nitrr-white-architecture-01-tee.jpg',
  },
  {
    label: 'NITRR Smart LED Thermal Flask',
    url: '/images/catalog/normalized/nitrr-temp-smart-bottle.jpg',
  },
  {
    label: 'Executive 3-Piece Gifting Set',
    url: '/images/catalog/normalized/nitrr-executive-gifting-set.jpg',
  },
  {
    label: 'Embroidered Collegiate Cap',
    url: '/images/catalog/normalized/nitrr-collegiate-cap.jpg',
  },
  {
    label: 'Think India Executive Tee',
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

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  onClose,
  onUpdated,
}) => {
  const { updateProduct } = useCart();

  // Core Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [badge, setBadge] = useState('');
  const [category, setCategory] = useState('Outerwear');
  const [club, setClub] = useState('');
  const [clubShort, setClubShort] = useState('');

  // Pricing & Stock
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(50);
  const [inStock, setInStock] = useState<boolean>(true);

  // Photos
  const [image, setImage] = useState(product?.image || PRESET_IMAGES[0].url);
  const [secondaryImage, setSecondaryImage] = useState(product?.secondaryImage || '');
  const [imageTab, setImageTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Variants & Details
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [selectedColorways, setSelectedColorways] = useState<Colorway[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#fc4c02');

  // Bullet Features
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Specs
  const [material, setMaterial] = useState('');
  const [gsm, setGsm] = useState('');
  const [fit, setFit] = useState('');
  const [print, setPrint] = useState('');

  // Flags & Narrative
  const [customizable, setCustomizable] = useState<boolean>(false);
  const [featured, setFeatured] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when product opens
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setTagline(product.tagline || '');
      setBadge(product.badge || '');
      setCategory(product.category || 'Outerwear');
      setClub(product.club || 'National Institute of Technology Raipur');
      setClubShort(product.clubShort || 'NIT Raipur');
      setPrice(product.price || 0);
      setOriginalPrice(product.originalPrice || product.price || 0);
      setStock(product.stock ?? 50);
      setInStock(product.inStock ?? true);
      setImage(product.image || PRESET_IMAGES[0].url);
      setSecondaryImage(product.secondaryImage || '');
      setSelectedSizes(product.sizes || ['S', 'M', 'L', 'XL']);
      setSelectedColorways(product.colorways || [DEFAULT_COLORWAYS[0]]);
      setFeatures(product.features || []);
      setMaterial(product.specs?.material || '100% Super-Combed Bio-Washed Cotton');
      setGsm(product.specs?.gsm || '380 GSM Heavyweight Fleece');
      setFit(product.specs?.fit || 'Regular Collegiate Fit (Unisex)');
      setPrint(product.specs?.print || 'High-Density 3D Embroidery');
      setCustomizable(product.customizable ?? false);
      setFeatured(product.featured ?? false);
      setDescription(product.description || '');
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [product]);

  if (!product) return null;

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

  const togglePresetColor = (cw: Colorway) => {
    setSelectedColorways((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === cw.name.toLowerCase());
      if (exists) {
        if (prev.length <= 1) return prev;
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
    if (selectedColorways.length <= 1) return;
    setSelectedColorways((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecondary = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setFormError('Image exceeds the 1MB server upload limit. Choose a compressed JPG, PNG, or WebP.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isSecondary) {
            setSecondaryImage(reader.result);
          } else {
            setImage(reader.result);
          }
          setFormError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await updateProduct(product.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        badge: badge.trim(),
        category,
        club,
        clubShort,
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        stock: Number(stock),
        inStock: inStock && Number(stock) > 0,
        image: image.trim() || product.image,
        secondaryImage: secondaryImage.trim() || undefined,
        sizes: selectedSizes.length > 0 ? selectedSizes : product.sizes,
        colorways: selectedColorways.length > 0 ? selectedColorways : product.colorways,
        features: features.length > 0 ? features : product.features,
        specs: {
          material,
          gsm,
          fit,
          print,
        },
        customizable,
        featured,
        description: description.trim(),
      });

      if (!res.success) {
        setFormError(
          res.error || 'Unable to save product changes to central store database.'
        );
        return;
      }
      if (onUpdated) onUpdated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = calculateDiscountPercent(originalPrice, price);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--paper)] rounded-[var(--r)] max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-[var(--line)] flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[var(--ink-paper)] text-white flex items-center justify-between border-b border-[var(--on-ink-line)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--r-in)] overflow-hidden border border-[var(--on-ink-line)] bg-white shrink-0">
              {(image || product.image) ? (
                <img src={image || product.image} alt={name || 'Product'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[9px] text-white">NITRR</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--accent)] block">
                  Edit Campus Drop
                </span>
                <span className="text-xs font-mono text-[var(--on-ink-muted)]">#{product.id}</span>
              </div>
              <h2 className="text-sm sm:text-base font-brand font-bold text-white truncate max-w-sm sm:max-w-lg">
                {product.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[var(--on-ink-muted)] hover:text-white hover:bg-white/10 rounded-[var(--r-in)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6 text-xs font-mono">
          {/* 1. PHOTO & VISUALS */}
          <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Image className="w-4 h-4 text-[var(--accent)]" />
                <span>Primary &amp; Alternate Product Photo</span>
              </span>
              <div className="flex gap-1">
                {(['preset', 'upload', 'url'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setImageTab(t)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded cursor-pointer transition-colors ${
                      imageTab === t
                        ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                        : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-28 bg-white dark:bg-zinc-900 rounded border border-[var(--line)] overflow-hidden shrink-0 shadow-xs">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-[10px]">No Photo</div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                {imageTab === 'preset' && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-1 bg-[var(--paper)] rounded border border-[var(--line)]">
                    {PRESET_IMAGES.map((p) => (
                      <div
                        key={p.label}
                        onClick={() => setImage(p.url)}
                        className={`aspect-square rounded overflow-hidden border cursor-pointer hover:border-[var(--accent)] ${
                          image === p.url ? 'ring-2 ring-[var(--accent)]' : 'border-[var(--line)]'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {imageTab === 'upload' && (
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 bg-[var(--ink)] text-[var(--on-ink)] rounded text-xs font-bold cursor-pointer hover:bg-[var(--accent-solid)] hover:text-white transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[var(--muted)]">Supports JPG, PNG, WebP up to 1MB</span>
                  </div>
                )}

                {imageTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Paste image HTTPS link..."
                      className="flex-1 px-3 py-1.5 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customImageUrl.trim()) setImage(customImageUrl.trim());
                      }}
                      className="px-3 py-1.5 bg-[var(--ink)] text-[var(--on-ink)] rounded font-bold cursor-pointer hover:bg-[var(--accent-solid)] hover:text-white transition-colors"
                    >
                      Set
                    </button>
                  </div>
                )}

                {/* Secondary Image Uploader */}
                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[var(--line)]">
                  <span className="text-[var(--muted)]">Secondary / Back View:</span>
                  <label className="text-[var(--accent)] hover:underline cursor-pointer">
                    <span>{secondaryImage ? 'Replace Back View' : '+ Upload Back View'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                  {secondaryImage && (
                    <button
                      type="button"
                      onClick={() => setSecondaryImage('')}
                      className="text-[var(--bad)] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PRODUCT NAME, TAGLINE & BADGE */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Product Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[var(--ink)] block mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--ink)] block mb-1">Badge</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* 3. CATEGORY & SOCIETY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Store Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              >
                {[...(category && !PRESET_CATEGORIES.includes(category) ? [category] : []), ...PRESET_CATEGORIES].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Collegiate Society</label>
              <select
                value={clubShort}
                onChange={(e) => {
                  const match = PRESET_CLUBS.find((p) => p.short === e.target.value);
                  if (match) {
                    setClubShort(match.short);
                    setClub(match.name);
                  } else {
                    setClubShort(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              >
                {clubShort && !PRESET_CLUBS.some((p) => p.short === clubShort) && (
                  <option value={clubShort}>{clubShort}</option>
                )}
                {PRESET_CLUBS.map((c) => (
                  <option key={c.short} value={c.short}>
                    {c.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. PRICING & STOCK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Selling Price (₹)</label>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">MRP Price (₹)</label>
              <input
                type="number"
                min="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
              {discount > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {discount}% Student Discount
                </span>
              )}
            </div>

            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Stock Target Units</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* 5. SIZES & COLORWAYS */}
          <div className="space-y-4 pt-2 border-t border-[var(--line)]">
            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[var(--ink)]">Garment Sizes</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    placeholder="Custom size..."
                    className="w-28 px-2 py-0.5 bg-[var(--paper-2)] border border-[var(--line)] rounded text-[10px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="text-[10px] text-[var(--accent)] font-bold hover:underline cursor-pointer"
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STANDARD_SIZES.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--ink)] text-[var(--on-ink)] border-[var(--ink)] shadow-xs'
                          : 'bg-[var(--paper-2)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colorways */}
            <div className="space-y-2">
              <label className="font-bold text-[var(--ink)] block">
                Active Colorways ({selectedColorways.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedColorways.map((cw, i) => (
                  <div
                    key={`${cw.name}-${i}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/25"
                      style={{ backgroundColor: cw.hex }}
                    />
                    <span>{cw.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(i)}
                      className="text-[var(--muted)] hover:text-[var(--bad)] ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-7 h-7 rounded border border-[var(--line)] cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="New color name..."
                  className="w-36 px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className="px-3 py-1 bg-[var(--ink)] text-[var(--on-ink)] rounded font-bold hover:bg-[var(--accent-solid)] hover:text-white cursor-pointer transition-colors"
                >
                  + Add Swatch
                </button>
              </div>
            </div>
          </div>

          {/* 6. TECHNICAL SPECS & BULLETS */}
          <div className="space-y-3 pt-2 border-t border-[var(--line)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-[var(--muted)] uppercase block">Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-2 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] uppercase block">GSM</label>
                <input
                  type="text"
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                  className="w-full px-2 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] uppercase block">Fit</label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="w-full px-2 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] uppercase block">Print/Embr</label>
                <input
                  type="text"
                  value={print}
                  onChange={(e) => setPrint(e.target.value)}
                  className="w-full px-2 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Bullet features */}
            <div>
              <label className="font-bold text-[var(--ink)] block mb-1">Highlights</label>
              <div className="space-y-1 mb-2">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 bg-[var(--paper-2)] rounded border border-[var(--line)] text-[var(--ink)]"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(i)}
                      className="text-[var(--muted)] hover:text-[var(--bad)] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Add bullet highlight..."
                  className="flex-1 px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
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
                  className="px-3 py-1 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--line)] rounded font-bold cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* 7. FLAGS & NARRATIVE */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[var(--line)]">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 text-[var(--ok)] rounded border-[var(--line)] accent-[var(--accent)]"
              />
              <span className="font-bold text-[var(--ink)]">In Stock / Available</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={customizable}
                onChange={(e) => setCustomizable(e.target.checked)}
                className="w-4 h-4 text-[var(--accent)] rounded border-[var(--line)] accent-[var(--accent)]"
              />
              <span className="font-bold text-[var(--ink)]">Custom Lettering Studio</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-[var(--accent)] rounded border-[var(--line)] accent-[var(--accent)]"
              />
              <span className="font-bold text-[var(--ink)]">Featured on Hero</span>
            </label>
          </div>

          <div>
            <label className="font-bold text-[var(--ink)] block mb-1">Product Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {formError && (
            <div className="p-3 bg-[var(--bad-soft)] border border-[var(--bad-border)] text-[var(--bad)] rounded-[var(--r-in)] flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded cursor-pointer font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-sm active:translate-y-px"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
