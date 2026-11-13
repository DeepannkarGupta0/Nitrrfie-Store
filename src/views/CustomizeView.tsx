import React, { useState, useEffect, useRef } from 'react';
import { ActiveView, Colorway, Product } from '../types/store';
import { useCart } from '../context/CartContext';
import { useSafeClerkAuth } from '../context/SafeClerkContext';
import { useToast } from '../context/ToastContext';
import { COORDINATOR_PHONE } from '../checkout/checkoutLogic';
import {
  Sparkles,
  ArrowLeft,
  RotateCw,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

interface CustomizeViewProps {
  initialSlug?: string;
  onNavigate: (view: ActiveView) => void;
}

const FALLBACK_COLORWAY: Colorway = { name: 'Standard', hex: '#18181b' };

export const CustomizeView: React.FC<CustomizeViewProps> = ({ initialSlug, onNavigate }) => {
  const { products } = useCart();
  const { isSignedIn, user } = useSafeClerkAuth();
  const { showToast } = useToast();

  // Products available as reference silhouettes for custom studio inquiries
  const customizableProducts = products.filter(
    (p) => p.customizable || p.slug === 'ecell-varsity-bomber-jacket'
  );
  const defaultProduct =
    customizableProducts.find((p) => p.slug === initialSlug) ||
    customizableProducts[0] ||
    products[0];

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(defaultProduct);
  const [selectedColor, setSelectedColor] = useState<Colorway>(
    defaultProduct?.colorways?.[0] || FALLBACK_COLORWAY
  );
  const [selectedSize, setSelectedSize] = useState<string>(defaultProduct?.sizes?.[0] || 'L');
  const lastInitialSlugRef = useRef<string | undefined>(initialSlug);

  useEffect(() => {
    if (!selectedProduct && defaultProduct) {
      setSelectedProduct(defaultProduct);
      setSelectedColor(defaultProduct.colorways?.[0] || FALLBACK_COLORWAY);
      setSelectedSize(defaultProduct.sizes?.[0] || 'L');
      return;
    }
    if (initialSlug !== lastInitialSlugRef.current) {
      lastInitialSlugRef.current = initialSlug;
      const target =
        products.find((p) => p.slug === initialSlug) || defaultProduct;
      if (target) {
        setSelectedProduct(target);
        setSelectedColor(target.colorways?.[0] || FALLBACK_COLORWAY);
        setSelectedSize(target.sizes?.[0] || 'L');
      }
    }
  }, [initialSlug, products, defaultProduct, selectedProduct]);
  const [viewSide, setViewSide] = useState<'front' | 'back'>('back');
  const [customText, setCustomText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [threadColor, setThreadColor] = useState<'#f59e0b' | '#ffffff' | '#e11d48' | '#0f172a'>('#ffffff');
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const threadColors = [
    { label: 'Gold Metallic', hex: '#f59e0b' as const },
    { label: 'Crisp White', hex: '#ffffff' as const },
    { label: 'Campus Crimson', hex: '#e11d48' as const },
    { label: 'Midnight Black', hex: '#0f172a' as const },
  ];

  const cleanCoordinatorPhone = COORDINATOR_PHONE.replace(/\D/g, '');
  const hasCoordinatorContact = cleanCoordinatorPhone.length >= 10;

  const customerDisplayName =
    isSignedIn && user
      ? user.fullName ||
        (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
        user.username ||
        ''
      : '';

  const selectedThreadLabel =
    threadColors.find((t) => t.hex === threadColor)?.label || 'Crisp White';

  const buildCustomizationMessage = (): string => {
    const baseLines = [
      customerDisplayName
        ? `Hello! My name is ${customerDisplayName}. I am interested in getting a custom design through your Customizer Studio. I would like to discuss my requirements and understand the customization process. Please let me know how we can proceed.`
        : `Hello! I am interested in getting a custom design through your Customizer Studio. I would like to discuss my requirements and understand the customization process. Please let me know how we can proceed.`,
      '',
      'Reference concept explored in Customizer Studio (for discussion):',
      `• Base Silhouette: ${selectedProduct?.name || 'Custom Campus Silhouette'}`,
      `• Preferred Colorway: ${selectedColor.name}`,
      `• Size Reference: ${selectedSize}`,
      `• Thread Preference: ${selectedThreadLabel}`,
    ];

    if (customText.trim()) {
      baseLines.push(`• Lettering Idea: ${customText.trim()}`);
    }
    if (secondaryText.trim()) {
      baseLines.push(`• Secondary Line / Batch: ${secondaryText.trim()}`);
    }

    return baseLines.join('\n');
  };

  const handleProductChange = (p: Product) => {
    setSelectedProduct(p);
    setSelectedColor(p.colorways?.[0] || FALLBACK_COLORWAY);
    setSelectedSize(p.sizes?.[0] || 'L');
  };

  const customizationMessage = buildCustomizationMessage();
  const whatsappUrl = hasCoordinatorContact
    ? `https://wa.me/${cleanCoordinatorPhone}?text=${encodeURIComponent(customizationMessage)}`
    : '#';

  const handleRequestCustomization = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasCoordinatorContact) {
      e.preventDefault();
      showToast(
        'Coordinator contact is not configured. Please set VITE_COORDINATOR_PHONE.',
        'error'
      );
      return;
    }

    setWhatsappOpened(true);
    showToast('WhatsApp message prepared for our customization coordinator.', 'info');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(buildCustomizationMessage());
      setCopiedMessage(true);
      showToast('Customization inquiry message copied to clipboard.', 'success');
      window.setTimeout(() => setCopiedMessage(false), 2200);
    } catch {
      showToast('Unable to copy automatically. Please select and copy the text.', 'error');
    }
  };

  const processSteps = [
    {
      step: '01',
      title: 'Explore Your Concept',
      desc: 'Use the studio canvas to preview base silhouettes, lettering ideas, and thread colors.',
    },
    {
      step: '02',
      title: 'Contact Our Coordinator',
      desc: 'Click "Request Customization" to send a pre-filled WhatsApp inquiry with no sign-up required.',
    },
    {
      step: '03',
      title: 'Design & Feasibility Review',
      desc: 'Share reference artwork or batch details directly in chat so our team can assess stitching feasibility.',
    },
    {
      step: '04',
      title: 'Quote, Timeline & Next Steps',
      desc: 'Our team confirms custom pricing, estimated production timeline, and payment steps before production starts.',
    },
  ];

  if (!selectedProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-20 text-center space-y-4">
        <p className="text-sm font-mono text-[var(--muted)]">
          Loading Customizer Studio silhouettes...
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ type: 'shop' })}
          className="px-4 py-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper)] text-xs font-mono font-semibold text-[var(--ink)] cursor-pointer"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tracking-wider uppercase text-[var(--accent)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coordinator-Led Custom Design Service</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-brand font-black text-[var(--ink)] tracking-tight mt-2">
            Customizer Studio
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
            Custom garments, society batches, and bespoke embroidery are handled directly with our NIT Raipur Store coordinator. Preview your concept below and message our team to discuss requirements, feasibility, pricing, and timelines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate({ type: 'shop' })}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Step-by-Step Service Process */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {processSteps.map((item) => (
          <div
            key={item.step}
            className="p-4 rounded-[var(--r)] bg-[var(--paper)] dark:bg-zinc-900/40 border border-[var(--line)] space-y-1.5"
          >
            <span className="font-mono text-[11px] font-bold text-[var(--accent)] block">
              STEP {item.step}
            </span>
            <h2 className="font-brand text-sm font-bold text-[var(--ink)]">{item.title}</h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Live Concept Preview */}
        <div className="lg:col-span-7 bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[var(--muted)] uppercase">
              Concept Preview: {viewSide === 'back' ? 'Back View (Embroidery Zone)' : 'Front View'}
            </span>
            <button
              type="button"
              onClick={() => setViewSide(viewSide === 'back' ? 'front' : 'back')}
              className="flex items-center gap-1.5 min-h-[38px] text-xs font-mono font-semibold px-3 py-1.5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] hover:bg-[var(--paper-3)] text-[var(--ink)] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip to {viewSide === 'back' ? 'Front' : 'Back'}</span>
            </button>
          </div>

          {/* Visual Canvas Area */}
          <div className="relative aspect-square max-w-lg mx-auto bg-[var(--paper-2)] rounded-[var(--r-in)] overflow-hidden border border-[var(--line)] flex items-center justify-center p-6">
            <img
              src={selectedProduct.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
              alt={selectedProduct.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                }
              }}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                viewSide === 'back' ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Custom Embroidery Overlay */}
            {viewSide === 'back' && customText && (
              <div className="absolute top-[28%] inset-x-8 text-center pointer-events-none select-none flex flex-col items-center">
                <div
                  className="font-mono font-black tracking-widest uppercase transition-all duration-200 px-4 py-1.5 rounded-md drop-shadow-md text-lg sm:text-2xl"
                  style={{
                    color: threadColor,
                    textShadow:
                      threadColor === '#ffffff'
                        ? '0 2px 4px rgba(0,0,0,0.8), 0 0 2px #000'
                        : '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  {customText}
                </div>

                {secondaryText && (
                  <div
                    className="font-mono font-bold tracking-wider text-[10px] sm:text-xs uppercase mt-1 opacity-90 drop-shadow-sm"
                    style={{ color: threadColor }}
                  >
                    {secondaryText}
                  </div>
                )}

                <div className="mt-2 text-[9px] font-mono tracking-widest text-[var(--on-ink)] bg-[var(--ink)] px-2 py-0.5 rounded-[var(--r-in)]">
                  ★ NIT RAIPUR ★
                </div>
              </div>
            )}

            <span className="absolute bottom-3 left-3 font-sans text-[11px] font-medium bg-[var(--ink-paper)]/90 text-white px-2.5 py-1 rounded-[var(--r-sm)] border border-[var(--on-ink-line)]">
              Concept Mockup · Not Final Proof
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs border-t border-[var(--line)] pt-4">
            <div>
              <span className="font-mono font-bold text-[var(--ink)] block">Direct Coordination</span>
              <span className="text-[11px] text-[var(--muted)]">Share artwork &amp; ideas in chat</span>
            </div>
            <div>
              <span className="font-mono font-bold text-[var(--ink)] block">Custom Quote</span>
              <span className="text-[11px] text-[var(--muted)]">Pricing confirmed after review</span>
            </div>
            <div>
              <span className="font-mono font-bold text-[var(--ink)] block">Timeline Clarity</span>
              <span className="text-[11px] text-[var(--muted)]">Scheduled with production desk</span>
            </div>
          </div>
        </div>

        {/* Right: Concept Preferences & Request Customization Action */}
        <div className="lg:col-span-5 bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-6">
          {/* Step 1: Base Apparel Choice */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-[var(--ink)] block">
              1. Reference Base Silhouette
            </label>
            <div className="space-y-2">
              {customizableProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProductChange(p)}
                  className={`w-full text-left p-3 rounded-[var(--r-in)] border flex items-center justify-between cursor-pointer transition-all ${
                    selectedProduct.id === p.id
                      ? 'border-[var(--ink)] bg-[var(--paper-2)] ring-1 ring-[var(--ink)]'
                      : 'border-[var(--line)] hover:border-[var(--line-2)] bg-[var(--paper)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                      alt={p.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                        }
                      }}
                      className="w-10 h-10 object-cover rounded-[var(--r-in)] border border-[var(--line)] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs text-[var(--ink)] block font-brand font-bold truncate">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-mono">{p.clubShort}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] shrink-0 ml-2">
                    Quote on Request
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Colorway Preference */}
          {selectedProduct.colorways?.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[var(--ink)] block">
                2. Garment Colorway Reference:{' '}
                <span className="text-[var(--accent)]">{selectedColor.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.colorways.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-[var(--r-in)] border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                      selectedColor.name === c.name
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)] font-semibold'
                        : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Custom Text / Student Name */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-[var(--ink)] block">
              3. Lettering / Custom Concept Notes
            </label>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-mono text-[var(--muted)] block mb-1">
                  Name / Handle Idea (Max 16 chars):
                </span>
                <input
                  type="text"
                  maxLength={16}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                  placeholder="e.g. VIKRAMADITYA"
                  className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] font-mono font-bold text-sm tracking-wider uppercase focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                />
              </div>

              <div>
                <span className="text-xs font-mono text-[var(--muted)] block mb-1">
                  Motto / Roll / Batch Note:
                </span>
                <input
                  type="text"
                  maxLength={24}
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value.toUpperCase())}
                  placeholder="e.g. HOLD THE VISION or 2022-2026"
                  className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] font-mono text-xs tracking-wider uppercase focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Thread Colorway & Size Reference */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-[var(--ink)] block">
              4. Thread Color Preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {threadColors.map((t) => (
                <button
                  key={t.hex}
                  type="button"
                  onClick={() => setThreadColor(t.hex)}
                  className={`min-h-[40px] p-2.5 rounded-[var(--r-in)] border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    threadColor === t.hex
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                      : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                    style={{ backgroundColor: t.hex }}
                  />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold uppercase text-[var(--ink)]">
                5. Size Reference
              </label>
              <span className="text-xs font-mono text-[var(--muted)]">Unisex Fit</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(selectedProduct.sizes || []).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-10 h-10 px-3 rounded-[var(--r-in)] border text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedSize === s
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinator Request CTA (No Direct Purchase / No Auto-Charge) */}
          <div className="pt-4 border-t border-[var(--line)] space-y-4">
            <div className="p-3.5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-mono font-bold text-[var(--ink)]">
                <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span>Consultation Required Before Ordering</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Customizer Studio designs are not sold via instant checkout. Our coordinator reviews your requirements first and confirms feasibility, pricing, and delivery timelines with you directly.
              </p>
            </div>

            {hasCoordinatorContact ? (
              <>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleRequestCustomization}
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-[var(--r-in)] bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-sans font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:translate-y-px"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Request Customization</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-85" />
                </a>

                <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-[var(--muted)]">
                  <span>
                    Coordinator WhatsApp:{' '}
                    <strong className="text-[var(--ink)]">+{cleanCoordinatorPhone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                {whatsappOpened && (
                  <div className="p-3.5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line-2)] text-xs space-y-1 animate-fade-in">
                    <span className="font-mono font-bold text-[var(--ink)] block">
                      WhatsApp chat prepared
                    </span>
                    <p className="text-[var(--muted)] leading-relaxed">
                      Send the pre-filled message in WhatsApp to start your discussion. Opening the chat does not place or confirm an order—our coordinator will share feasibility, pricing, and next steps with you directly.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-mono font-bold text-[var(--bad)]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Coordinator Contact Not Configured</span>
                </div>
                <p className="text-[var(--ink-2)] leading-relaxed">
                  Set <code className="font-mono text-[var(--accent)]">VITE_COORDINATOR_PHONE</code> in your environment configuration so customers can send customization requests directly to your coordinator.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
