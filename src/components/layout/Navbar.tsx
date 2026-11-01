"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, Sparkles, MapPin, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import SearchModal from "@/components/netrify/SearchModal";
import type { NetrifyProduct } from "@/data/netrifyProducts";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const adminRole = "admin";
  const userRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
  const isAdmin = isSignedIn && userRole === adminRole;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleSelectProduct = (product: NetrifyProduct) => {
    setSearchOpen(false);
    router.push(`/product/${product.slug}`);
  };

  return (
    <>
      {/* ── Top Announcement Bar ── */}
      <div className="bg-[#ff782e] text-white text-xs font-sans tracking-wide z-50 border-b border-[#e05b12]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white">
              <Sparkles className="w-3 h-3 text-white" />
              NITRRFIE • Official Store
            </span>
            <span className="hidden md:inline-block text-white/90 font-normal">
              NIT Raipur Foundation for Innovation and Entrepreneurship
            </span>
          </div>

          <div className="flex items-center gap-2 text-center text-xs font-medium">
            <span className="truncate max-w-[280px] sm:max-w-md lg:max-w-xl">
              Official Campus Drops Live: <strong className="font-bold underline decoration-white/40">E-Cell Bomber</strong>, <strong className="font-bold underline decoration-white/40">TCP Tech Tees</strong> & <strong className="font-bold underline decoration-white/40">I-Cell F1</strong>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] font-medium text-white/90">
            <span className="inline-flex items-center gap-1 text-white/95">
              <MapPin className="w-3 h-3" />
              Campus Handover Desk
            </span>
            <span className="text-white/40">|</span>
            <span className="inline-flex items-center gap-1 text-white/95">
              <ShieldCheck className="w-3 h-3" />
              100% Verified Merchandise
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Sticky Header ── */}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff782e] to-[#ff9457] flex items-center justify-center text-white font-black text-xs tracking-tight shadow-md shadow-[#ff782e]/25 group-hover:scale-105 transition-transform font-sans">
                  NIT
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      NITRRFIE <span className="text-[#ff782e]">STORE</span>
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 -mt-0.5 flex items-center gap-1">
                    <span>NIT Raipur Foundation for Innovation & Entrepreneurship</span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 pl-4">
                <Link
                  href="/"
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isActive("/") && pathname === "/"
                      ? "text-[#ff782e] font-bold bg-orange-50/70"
                      : "text-slate-700 hover:text-[#ff782e] hover:bg-slate-50"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/shop"
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isActive("/shop")
                      ? "text-[#ff782e] font-bold bg-orange-50/70"
                      : "text-slate-700 hover:text-[#ff782e] hover:bg-slate-50"
                  }`}
                >
                  All Campus Drops
                </Link>
                <Link
                  href="/support"
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isActive("/support")
                      ? "text-[#ff782e] font-bold bg-orange-50/70"
                      : "text-slate-700 hover:text-[#ff782e] hover:bg-slate-50"
                  }`}
                >
                  Student Helpdesk & Pickup
                </Link>
                {isSignedIn && (
                  <Link
                    href="/account/orders"
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isActive("/account")
                        ? "text-[#ff782e] font-bold bg-orange-50/70"
                        : "text-slate-700 hover:text-[#ff782e] hover:bg-slate-50"
                    }`}
                  >
                    My Orders
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 text-xs font-bold text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-100/90 rounded-full border border-slate-200 transition-colors cursor-pointer"
                title="Search campus merchandise"
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
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              All Campus Drops
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Student Helpdesk & Pickup
            </Link>
            {isSignedIn && (
              <Link
                href="/account/orders"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                My Orders
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-600 hover:bg-amber-50"
              >
                Admin Panel
              </Link>
            )}

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
                  <span className="text-xs text-slate-600 font-medium">Logged in to NITRRFIE Store</span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
      />
    </>
  );
}