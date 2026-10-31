"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, Sparkles, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

interface NetrifyNavbarProps {
  onOpenSearch: () => void;
}

export default function NetrifyNavbar({ onOpenSearch }: NetrifyNavbarProps) {
  const { totalItems } = useCart();
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-all duration-200 border-b ${
        scrolled ? "border-slate-200 shadow-md shadow-slate-900/5" : "border-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff782e] to-[#ff9457] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#ff782e]/25 group-hover:scale-105 transition-transform font-sans">
                N
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-2xl font-black tracking-tight text-slate-900">
                    NETRIFY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#ff782e]" />
                </div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 -mt-1 flex items-center gap-1">
                  <span>NITRRFIE</span>
                  <span className="text-slate-300">•</span>
                  <span>NIT Raipur</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#ff782e]">Store</span>
                </div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 pl-4">
              <Link
                href="/"
                className="px-3.5 py-2 text-xs font-bold text-[#ff782e] rounded-lg bg-orange-50/70"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff782e] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Shop
              </Link>
              <a
                href="#collections"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff782e] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Collections
              </a>
              <a
                href="#committees"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff782e] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Committees & Clubs
              </a>
              <a
                href="#campus-heritage"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff782e] rounded-lg hover:bg-slate-50 transition-colors"
              >
                About
              </a>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-100/90 rounded-full border border-slate-200 transition-colors cursor-pointer"
              title="Search products"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline font-sans">Search campus drops...</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                /
              </kbd>
            </button>

            {/* Cart Link with Badge */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full text-slate-700 hover:text-[#ff782e] hover:bg-slate-50 border border-slate-200 transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff782e] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center font-sans shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Clerk Authentication */}
            <div className="hidden sm:flex items-center pl-1 border-l border-slate-200">
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="px-3.5 py-2 text-xs font-bold font-sans text-slate-800 hover:text-[#ff782e] transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <div className="pl-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 rounded-full border border-slate-200",
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-bold text-[#ff782e] bg-orange-50/70"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Shop All
          </Link>
          <a
            href="#collections"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Browse Collections
          </a>
          <a
            href="#committees"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Committees & Clubs
          </a>
          <a
            href="#campus-heritage"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            About Netrify
          </a>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold font-sans">
                  Student Sign In
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton />
                <span className="text-xs text-slate-600 font-medium">Logged in to Netrify</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
