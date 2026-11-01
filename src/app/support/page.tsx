import React from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
  HelpCircle,
  Truck,
  Users,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Helpdesk & Campus Logistics | NITRRFIE Store — NIT Raipur",
  description:
    "Official student support and logistics desk for NITRRFIE Store. Campus handover timings, size exchanges, hostel deliveries, and committee bulk order inquiries at NIT Raipur.",
};

export default function SupportPage() {
  const faqs = [
    {
      q: "How do I collect my order on campus?",
      a: "Once your order is confirmed, you will receive an Order ID. Orders can be collected from the official NITRRFIE Innovation Cell / Makerspace desk (Ground Floor, Main Building) during regular handover hours (4:00 PM – 7:30 PM, Monday through Saturday). Simply present your Order ID and Institute ID card.",
    },
    {
      q: "Can orders be delivered directly to campus hostels?",
      a: "Yes! For residents staying in NIT Raipur campus hostels (Boys Hostels H1–H10, Girls Hostels, and PG Hostels), our student logistics team conducts evening delivery handovers between 7:00 PM – 9:00 PM. Our coordinator will contact you via WhatsApp or phone call prior to arrival at your hostel gate.",
    },
    {
      q: "What is your size exchange policy?",
      a: "We want your campus merchandise to fit perfectly. If your garment size does not fit, bring the unwashed item with tags intact to the NITRRFIE handover desk within 48 hours of collection for an instant size swap, subject to size inventory availability.",
    },
    {
      q: "Which payment methods are accepted?",
      a: "All payments are processed securely through our official Razorpay payment gateway. We accept UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit & Debit cards (Visa, MasterCard, RuPay), and NetBanking from 50+ Indian banks.",
    },
    {
      q: "Can our student club or committee order custom bulk merchandise?",
      a: "Yes! NITRRFIE partners directly with registered NIT Raipur student committees, tech societies, and fests (such as E-Cell, Innovation Cell, TCP, Samar, Aavartan, CodeUtsava, and Departmental Societies) for official bulk manufacturing, design proofing, and collegiate branding.",
    },
    {
      q: "What is the quality standard of official merchandise?",
      a: "All NITRRFIE apparel is manufactured with high-density premium materials: 240+ GSM combed heavyweight cotton for t-shirts, 380+ GSM fleece for varsity jackets, high-precision collegiate embroidery, and fade-resistant screen printing built to last your entire college tenure.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-b from-white via-orange-50/20 to-[#f8fafc] border-b border-slate-200/70 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/70 text-[#ff782e] text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Official Student Helpdesk & Logistics
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            How can our campus team assist you?
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Direct student support for NIT Raipur official merchandise orders, campus collection points, hostel delivery coordination, and committee drops.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* ── 3 Key Support Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Campus Handover Point */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff782e] flex items-center justify-center mb-5">
              <MapPin className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Campus Handover Desk</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              NITRRFIE Innovation Cell / Makerspace, Ground Floor, Main Building, NIT Raipur, GE Road, Raipur — 492010.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-[#ff782e] shrink-0" />
              <span>Mon – Sat: 4:00 PM – 7:30 PM</span>
            </div>
          </div>

          {/* Card 2: Email & Official Helpdesk */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff782e] flex items-center justify-center mb-5">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Email Desk Inquiries</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              For order status, invoice requests, or institutional verification, write to our official store inbox.
            </p>
            <a
              href="mailto:contact@nitrrfie.in?subject=NITRRFIE%20Store%20Inquiry"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#ff782e] hover:text-[#e05b12] group"
            >
              contact@nitrrfie.in
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 3: Hostel Delivery Handover */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff782e] flex items-center justify-center mb-5">
              <Truck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Hostel Delivery Window</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Evening dispatch to campus hostels (Boys Hostels H1–H10, Girls Hostels, and PG residences) upon coordinator notice.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-[#ff782e] shrink-0" />
              <span>Evenings: 7:00 PM – 9:00 PM</span>
            </div>
          </div>
        </div>

        {/* ── Committee & Society Bulk Drop Callout ── */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1a2233] to-slate-900 text-white rounded-3xl p-8 sm:p-10 mb-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff782e]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Users className="w-3.5 h-3.5" />
                Committees & Societies
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white">
                Designing exclusive merchandise for your club or tech society?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                NITRRFIE facilitates official design prototyping, sample proofing, and centralized pre-order campaigns for campus fests (Samar, Aavartan, CodeUtsava, E-Summit), departmental batches, and cultural clubs.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:contact@nitrrfie.in?subject=[Bulk%20Order%20Inquiry]%20Society%20Name"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#ff782e] hover:bg-[#e05b12] text-white text-sm font-bold shadow-lg shadow-[#ff782e]/25 transition-all"
              >
                Submit Society Inquiry
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
              >
                Browse Current Drops
              </Link>
            </div>
          </div>
        </div>

        {/* ── Frequently Asked Questions ── */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff782e] uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Campus Logistics & Order Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-orange-200 transition-colors"
              >
                <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ff782e] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed pl-7.5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Helpdesk Footer Quick Links ── */}
        <div className="bg-orange-50/60 rounded-2xl p-6 sm:p-8 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff782e] text-white flex items-center justify-center font-bold text-sm shrink-0">
              NIT
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">NITRRFIE Official Store Office</h4>
              <p className="text-xs text-slate-500">
                National Institute of Technology Raipur, G.E. Road, Raipur, Chhattisgarh — 492010
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://nitrrfie.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#ff782e] bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs"
            >
              NITRRFIE Foundation Portal
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#ff782e] hover:bg-[#e05b12] px-3.5 py-2 rounded-lg shadow-xs"
            >
              Track Order in Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
