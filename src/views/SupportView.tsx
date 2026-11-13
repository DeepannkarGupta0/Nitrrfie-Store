import React, { useState } from 'react';
import { ActiveView } from '../types/store';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { apiSubmitSupportInquiry } from '../api/client';
import {
  Building,
  Home,
  RefreshCw,
  Mail,
  Clock,
  ExternalLink,
  ChevronDown,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface SupportViewProps {
  onNavigate: (view: ActiveView) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onNavigate }) => {
  const { setIsTrackOpen } = useCart();
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Bulk inquiry form state
  const [clubName, setClubName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [quantityReq, setQuantityReq] = useState('25-50');
  const [itemType, setItemType] = useState('Varsity Jackets & Hoodies');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);

  const faqs = [
    {
      q: '1. Do you ship Pan-India to alumni across the country?',
      a: 'Yes, absolutely! The official NIT Raipur Store delivers across all 28 states and union territories in India to alumni, patrons, and supporters. Select "Pan-India Express Delivery" at checkout, enter your postal address and 6-digit PIN code, and your parcel will be dispatched via insured express courier (Blue Dart / Delhivery / India Post) with live tracking.',
    },
    {
      q: '2. How long does Pan-India delivery take to reach alumni?',
      a: 'All orders are processed and inspected within 24 to 48 hours. Metro areas (Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Kolkata, Chennai) typically arrive in 3–5 business days. Other cities and towns across India arrive within 5–7 business days.',
    },
    {
      q: '3. Is an Institute Roll Number required to purchase merchandise?',
      a: 'No. Roll number or graduating batch is completely optional. Alumni, former scholars, faculty, parents, and friends of NIT Raipur can leave it blank or enter their graduation year (e.g. "Batch 2018").',
    },
    {
      q: '4. How do on-campus students and faculty collect their orders?',
      a: 'Campus orders can be collected directly from the official NITRRFIE Innovation Cell / Makerspace Desk (Ground Floor, Main Building, beside Architecture Dept) during regular handover hours (4:00 PM – 7:30 PM, Monday through Saturday).',
    },
    {
      q: '5. What is your size exchange policy for nationwide alumni orders?',
      a: 'We want your merchandise to fit comfortably. If you need a size exchange, contact our coordinator via WhatsApp or email within 7 days of delivery. For on-campus pickups, instant desk swaps are provided at the Makerspace counter.',
    },
    {
      q: '6. Can alumni chapters, batches, or committees place custom bulk orders?',
      a: 'Yes! NITRRFIE specializes in custom alumni batch hoodies, reunion jackets, departmental editions, and silver/golden jubilee apparel featuring high-precision embroidery and official institutional insignia.',
    },
  ];

  const parseEstimatedQuantity = (range: string): number => {
    const match = range.match(/\d+/);
    const parsed = match ? Number(match[0]) : 25;
    return Number.isFinite(parsed) && parsed >= 15 ? parsed : 25;
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;
    if (!clubName.trim() || !contactEmail.trim() || !contactEmail.includes('@')) {
      showToast('Please enter a valid Club / Society Name and Contact Email.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedNotes = `Category: ${itemType}${notes.trim() ? ` — ${notes.trim()}` : ' — Requesting bulk quotation and timeline.'}`;
      const res = await apiSubmitSupportInquiry({
        organization: clubName.trim(),
        contactEmail: contactEmail.trim(),
        estimatedQuantity: parseEstimatedQuantity(quantityReq),
        notes: combinedNotes,
      });

      if (!res.success || !res.inquiry) {
        showToast(res.error || 'Unable to submit bulk inquiry right now.', 'error');
        return;
      }

      setSubmittedInquiryId(res.inquiry.id);
      setSubmitted(true);
      showToast(`Bulk inquiry ${res.inquiry.id} saved with NITRRFIE Operations.`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-[var(--line)] pb-8 text-center max-w-3xl mx-auto space-y-2">
        <span className="font-mono text-xs font-semibold text-[var(--accent)] uppercase tracking-wider block">
          NITRRFIE Nationwide Logistics &amp; Fulfillment
        </span>
        <h1 className="text-3xl sm:text-4xl font-brand font-black text-[var(--ink)] tracking-tight">
          Pan-India Shipping &amp; Campus Fulfillment Desk
        </h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Delivering nationwide to alumni, former scholars, and supporters across all Indian states and union territories,
          alongside our on-campus collection desk at NIT Raipur.
        </p>
      </div>

      {/* 3 Core Logistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--paper)] p-6 rounded-[var(--r)] border border-[var(--line)] space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold">
            <Truck className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-brand font-bold text-[var(--ink)]">Pan-India Express Courier</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Direct door delivery to <strong>alumni, homes, and offices nationwide</strong> across 19,000+ PIN codes via Blue Dart, Delhivery &amp; Speed Post with live tracking.
          </p>
          <div className="pt-2 text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--ok)] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>3 – 5 Days Express Nationwide</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--paper)] p-6 rounded-[var(--r)] border border-[var(--line)] space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold">
            <Building className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-brand font-bold text-[var(--ink)]">NIT Raipur Campus Pickup</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Located at the <strong>Ground Floor, Main Building</strong> (adjacent to Innovation Cell). Instant collection for campus students and faculty.
          </p>
          <div className="pt-2 text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--ink-2)] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>4:00 PM – 7:30 PM (Mon – Sat)</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--paper)] p-6 rounded-[var(--r)] border border-[var(--line)] space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center font-bold">
            <RefreshCw className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-brand font-bold text-[var(--ink)]">Hassle-Free Size Exchange</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Need a different fit? Reverse courier support for nationwide alumni orders, and instant desk swap for campus collections.
          </p>
          <div className="pt-2 text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--ok)] font-semibold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>100% Fit Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alumni Chapter & Committee Bulk Order Form */}
      <div className="bg-[var(--ink-paper)] text-white rounded-[var(--r)] p-8 sm:p-12 border border-[var(--line)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase tracking-wider block">
              Pan-India Alumni Chapters &amp; Committees
            </span>
            <h2 className="text-2xl sm:text-3xl font-brand font-bold tracking-tight text-white">
              Alumni Reunion Batches &amp; Society Custom Merchandise
            </h2>
            <p className="text-sm text-[var(--on-ink-muted)] leading-relaxed">
              NITRRFIE partners directly with alumni chapters across Bengaluru, Delhi, Mumbai, Hyderabad, overseas networks, graduating batches, and registered technical societies for official bulk manufacturing, premium embroidery, and institutional proofing delivered anywhere in India.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="mailto:contact@nitrrfie.in?subject=[Bulk%20Order%20Inquiry]%20Alumni%20Batch%20or%20Society"
                className="px-5 py-3 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white rounded-[var(--r-in)] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm active:translate-y-px"
              >
                <Mail className="w-4 h-4" />
                <span>Submit Bulk Inquiry</span>
              </a>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'shop' })}
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-[var(--r-in)] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer border border-white/15"
              >
                <span>Browse Current Drops</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#1A1A18] p-6 rounded-[var(--r-in)] border border-[var(--on-ink-line)]">
            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-[var(--ok-soft)] border border-[var(--ok-border)] text-[var(--ok)] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-brand font-bold text-white">
                  Inquiry Recorded{submittedInquiryId ? ` (${submittedInquiryId})` : ''}
                </h3>
                <p className="text-xs text-[var(--on-ink-muted)]">
                  Our NITRRFIE production coordinator will follow up with your representative via email within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSubmittedInquiryId(null);
                    setClubName('');
                    setContactEmail('');
                    setNotes('');
                  }}
                  className="mt-2 px-4 py-2 rounded-[var(--r-in)] border border-[var(--on-ink-line)] text-xs font-mono text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleBulkSubmit} className="space-y-3 text-xs">
                <h3 className="text-sm font-brand font-bold text-white uppercase mb-2">
                  Fast Society Request Form
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--on-ink-muted)] block mb-1 font-mono text-[11px]">Club / Society Name *</label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="e.g. Robotix Club / Alumni Batch"
                      className="w-full px-3 py-2 bg-[var(--ink-paper)] border border-[var(--on-ink-line)] rounded-[var(--r-in)] text-white focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[var(--on-ink-muted)] block mb-1 font-mono text-[11px]">Contact Email *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="coordinator@nitrr.ac.in"
                      className="w-full px-3 py-2 bg-[var(--ink-paper)] border border-[var(--on-ink-line)] rounded-[var(--r-in)] text-white focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--on-ink-muted)] block mb-1 font-mono text-[11px]">Estimated Quantity</label>
                    <select
                      value={quantityReq}
                      onChange={(e) => setQuantityReq(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--ink-paper)] border border-[var(--on-ink-line)] rounded-[var(--r-in)] text-white focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option className="bg-[#09090B] text-white" value="25-50">25 – 50 Units</option>
                      <option className="bg-[#09090B] text-white" value="50-100">50 – 100 Units</option>
                      <option className="bg-[#09090B] text-white" value="100-250">100 – 250 Units</option>
                      <option className="bg-[#09090B] text-white" value="250+">250+ Units (Fest Scale)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--on-ink-muted)] block mb-1 font-mono text-[11px]">Merchandise Category</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--ink-paper)] border border-[var(--on-ink-line)] rounded-[var(--r-in)] text-white focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option className="bg-[#09090B] text-white">Varsity Jackets &amp; Hoodies</option>
                      <option className="bg-[#09090B] text-white">Heavyweight Oversized Tees</option>
                      <option className="bg-[#09090B] text-white">Fest Hackathon Editions</option>
                      <option className="bg-[#09090B] text-white">Executive Dignitary Gift Sets</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[var(--on-ink-muted)] block mb-1 font-mono text-[11px]">Design Specs / Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief description of colorways, embroidery, or required deadline..."
                    className="w-full px-3 py-2 bg-[var(--ink-paper)] border border-[var(--on-ink-line)] rounded-[var(--r-in)] text-white focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[42px] py-2.5 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer mt-1"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Bulk Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Campus FAQ Accordion */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <span className="font-mono text-xs font-semibold text-[var(--accent)] uppercase tracking-wider block">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-brand font-bold text-[var(--ink)] tracking-tight">
            Campus Logistics &amp; Order Details
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[var(--paper)] rounded-[var(--r-in)] border border-[var(--line)] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-brand font-bold text-[var(--ink)] text-sm sm:text-base flex items-center justify-between gap-4 cursor-pointer hover:text-[var(--accent)]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--line)] font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Office & Portal Banner */}
      <div className="bg-[var(--paper)] rounded-[var(--r)] p-6 sm:p-8 border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[var(--ink-paper)] border border-[var(--line-2)] text-[var(--accent)] font-mono font-bold text-sm flex items-center justify-center rounded-[var(--r-in)] shrink-0">
            NIT
          </div>
          <div>
            <h4 className="text-base font-brand font-bold text-[var(--ink)]">NITRRFIE Official Store Office</h4>
            <p className="text-xs text-[var(--muted)]">
              National Institute of Technology Raipur, G.E. Road, Raipur, Chhattisgarh — 492010
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'privacy' })}
            className="px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Privacy Policy</span>
          </button>
          <a
            href="https://nitrrfie.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>NITRRFIE Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setIsTrackOpen(true)}
            className="px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
