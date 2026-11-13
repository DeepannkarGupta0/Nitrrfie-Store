import React from 'react';
import { motion } from 'motion/react';
import { ActiveView } from '../types/store';
import {
  ShieldCheck,
  UserCheck,
  Database,
  CreditCard,
  Globe,
  Cookie,
  Scale,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { COORDINATOR_PHONE } from '../checkout/checkoutLogic';

interface PrivacyPolicyViewProps {
  onNavigate: (view: ActiveView) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onNavigate }) => {
  const cleanCoordinatorPhone = COORDINATOR_PHONE.replace(/\D/g, '');
  const formattedCoordinatorPhone =
    cleanCoordinatorPhone.startsWith('91') && cleanCoordinatorPhone.length === 12
      ? `+91 ${cleanCoordinatorPhone.slice(2)}`
      : cleanCoordinatorPhone
      ? `+${cleanCoordinatorPhone}`
      : 'Not configured (owner must set VITE_COORDINATOR_PHONE)';

  const sections = [
    {
      id: 'information-collected',
      icon: UserCheck,
      title: '1. Information We Collect',
      content: [
        'Information you provide at checkout: full name, optional NIT Raipur roll number or batch ID, email address, 10-digit mobile phone number, delivery method (campus pickup or delivery address with city, state, PIN code, and optional landmark), and items in your order.',
        'Payment reference details: when paying via UPI, you may enter a 12-digit transaction reference (UTR) and optionally attach a payment receipt image for manual verification.',
        'Customizer Studio & support inquiries: if you contact our coordinator via WhatsApp or submit a bulk society inquiry form on the Shipping & Help page, we receive the details you choose to include in that message or form.',
      ],
    },
    {
      id: 'accounts-authentication',
      icon: ShieldCheck,
      title: '2. Account & Authentication Information',
      content: [
        'Account sign-in and registration on this website are powered by Clerk (a third-party authentication service) when Clerk is enabled for the deployment.',
        'If you choose to create an account or sign in, Clerk handles your sign-in credentials, verification codes (OTPs), and basic profile details (such as your name, email address, and profile image).',
        'You are not required to sign in to browse the store, place an order, or request customization through the Customizer Studio. If you are signed in, your name and email are automatically filled into the checkout form (and your name is added to Customizer Studio WhatsApp messages) for convenience.',
        'We do not have access to your password, and no separate customer profile database (such as Firebase or Supabase) is created during sign-up.',
      ],
    },
    {
      id: 'orders-transactions',
      icon: CreditCard,
      title: '3. Order & Transaction Information',
      content: [
        'When you submit an order, the store generates an Order ID and Clearance Pass containing your contact details, selected items, fulfillment preference, payment method, and any UPI UTR reference or receipt image you provided.',
        'This store does not process credit cards, debit cards, or net-banking credentials directly inside the website, and it does not collect your UPI PIN or bank login details.',
        'Manual UPI verification works by opening a pre-filled WhatsApp message to our store coordinator so the team can cross-check your UTR or screenshot against store receipts.',
      ],
    },
    {
      id: 'how-we-use-info',
      icon: Globe,
      title: '4. How Your Information Is Used',
      content: [
        'To prepare, verify, and fulfill merchandise orders for campus pickup or courier delivery.',
        'To let you look up your order status in the Order Tracker using your Order ID, roll number, or phone number.',
        'To communicate with you regarding payment verification, delivery coordination, size exchanges, or Customizer Studio design requests.',
        'To determine whether a signed-in Clerk account has staff access to the Store Operations Portal (based on authorized staff roles or email addresses configured by the store administrator).',
      ],
    },
    {
      id: 'third-party-services',
      icon: Globe,
      title: '5. Third-Party Services & Integrations',
      content: [
        'Clerk (@clerk/clerk-react): used for optional customer and staff sign-in, sign-up, and session management. Data handled by Clerk is governed by Clerk’s own privacy policy and terms.',
        'Brevo (Transactional Email API): used strictly to send a confirmation email when you opt in to our Restock & Release Updates newsletter, using your submitted email address.',
        'WhatsApp (wa.me links): used when you click "Verify on WhatsApp" during checkout or "Request Customization" in the Customizer Studio. Clicking those buttons opens WhatsApp on your device with a pre-filled message addressed to the store coordinator; messages sent in WhatsApp are governed by WhatsApp’s privacy policy.',
        'Google Fonts: font stylesheets and font files are loaded from Google Fonts (fonts.googleapis.com / fonts.gstatic.com) to render the site typography.',
        'We do not run third-party advertising networks or commercial analytics trackers on this storefront.',
      ],
    },
    {
      id: 'storage-security',
      icon: Database,
      title: '6. Data Storage & Security',
      content: [
        'Guest browser localStorage: when browsing without signing in, your shopping bag, wishlist, theme preference, and currency setting are temporarily stored in your browser’s localStorage.',
        'Authenticated Account Cart & Server Database: when you sign in or create a Clerk account, any items in your guest bag are automatically merged and saved in the store’s backend database linked to your verified account ID so your bag stays synchronized across devices and remains intact when you sign out and sign back in.',
        'Newsletter Subscribers: if you opt in through the Restock & Release Updates form, your email address, consent status, subscription timestamp, and unsubscribe token are stored in our backend database strictly for sending store release updates. Account sign-up or checkout does not automatically subscribe you to the newsletter.',
        'Server API (/api/orders, /api/cart & /api/newsletter): checkout orders, authenticated cart contents, and newsletter subscriber records are stored in the server database, with subscriber lists restricted exclusively to authenticated store administrators.',
      ],
    },
    {
      id: 'cookies-local-storage',
      icon: Cookie,
      title: '7. Cookies & Browser Storage',
      content: [
        'Clerk sets essential authentication cookies or session tokens in your browser when you sign in so you stay logged in without re-entering credentials on every page.',
        'The storefront uses browser localStorage keys (such as cart items, wishlist items, theme choice, and local order records) strictly to make core shopping and order-tracking features work.',
        'No advertising or cross-site behavioral tracking cookies are set by this application.',
      ],
    },
    {
      id: 'privacy-rights',
      icon: Scale,
      title: '8. Your Choices & Privacy Rights',
      content: [
        'Guest access: you can browse all merchandise, shop, and request Customizer Studio quotes without creating an account.',
        'Newsletter opt-out: you can unsubscribe from newsletter updates at any time using the Unsubscribe link in your confirmation email or via the /unsubscribe page.',
        'Managing local data: you can clear your cart, local order history, and preferences at any time by clearing site data / localStorage in your browser settings.',
        'Account & order requests: if you created a Clerk account, you can manage or delete your profile through your account menu. You may also contact the store team to request correction or deletion of your order details.',
      ],
    },
    {
      id: 'contact',
      icon: Mail,
      title: '9. Contact Information',
      content: [
        'Storefront: NIT Raipur Store (NITRRFIE Merchandise & Operations).',
        'On-Campus Pickup Desk (listed on storefront): Innovation Cell & Makerspace Desk, Ground Floor, Main Building, NIT Raipur, Chhattisgarh – 492010.',
        `Configured WhatsApp Coordinator Phone: ${formattedCoordinatorPhone}`,
        'Listed Portal / Inquiry Email (found in Support page): contact@nitrrfie.in',
      ],
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[var(--paper)] text-[var(--ink)] transition-colors duration-200">
      {/* Breadcrumb Navigation Bar */}
      <div className="w-full border-b border-[var(--line)] dark:border-zinc-800 bg-[var(--paper-2)] dark:bg-[#0c0c0e]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between text-xs font-mono">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'home' })}
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink)] dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>RETURN TO STORE</span>
          </button>
          <span className="text-[var(--accent)] font-semibold">PRIVACY POLICY</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative border-b border-[var(--line)] dark:border-zinc-800 bg-gradient-to-b from-[var(--paper)] to-[var(--paper-2)] dark:from-[#09090B] dark:to-[#121214] py-12 sm:py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Plain-Language Privacy Notice</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal text-[var(--ink)] tracking-tight text-balance">
            Privacy Policy
          </h1>
          <p className="font-sans text-sm sm:text-base text-[var(--ink-2)] max-w-2xl leading-relaxed">
            This page explains in plain language what information the NIT Raipur Store collects, how your account and order details work, which third-party services are connected, and how your data is stored.
          </p>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 sm:py-16 space-y-12">
        {/* Data Governance & Retention Summary */}
        <div className="p-5 sm:p-6 rounded-[var(--r)] bg-[var(--paper-2)] dark:bg-zinc-900/60 border border-[var(--line-2)] dark:border-zinc-700 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Data Governance &amp; Institutional Oversight</span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
            Operated under the National Institute of Technology Raipur Foundation for Innovation &amp; Entrepreneurship (NITRRFIE) Store Operations Desk. Customer order records, payment verification receipts, and newsletter preferences are processed strictly for official merchandise fulfillment, order tracking, and institutional communications.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.25 }}
                className="space-y-4 border-b border-[var(--line)] dark:border-zinc-800 pb-8 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[var(--r-in)] bg-[var(--paper-2)] dark:bg-zinc-800 border border-[var(--line)] dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-normal text-[var(--ink)]">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-2.5 pl-12 text-xs sm:text-sm text-[var(--ink-2)] font-sans leading-relaxed">
                  {section.content.map((p, i) => (
                    <p key={i} className="text-[var(--ink-2)] dark:text-zinc-300">
                      {p}
                    </p>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Support & Contact Action */}
        <div className="rounded-[var(--r)] border border-[var(--line)] dark:border-zinc-800 bg-[var(--paper-2)] dark:bg-[#0c0c0e] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-brand text-lg font-bold text-[var(--ink)]">
              Questions About Your Order or Privacy?
            </h3>
            <p className="text-xs text-[var(--muted)] font-sans">
              Reach out to our team through the Shipping &amp; Help desk or browse the store catalog.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'support' })}
              className="min-h-[42px] px-5 py-2.5 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] font-sans text-xs sm:text-sm font-semibold hover:bg-[var(--accent-solid)] hover:text-white transition-colors cursor-pointer"
            >
              Shipping &amp; Help
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'shop' })}
              className="min-h-[42px] px-5 py-2.5 rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-sans text-xs sm:text-sm font-medium text-[var(--ink)] transition-colors cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
