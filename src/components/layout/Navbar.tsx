
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  MapPin,
  ShieldCheck,
  Settings,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import SearchModal from "@/components/netrify/SearchModal";
import type { NetrifyProduct } from "@/data/netrifyProducts";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const userRole = (
    user?.publicMetadata?.role as string | undefined
  )?.toLowerCase();

  const isAdmin =
    isSignedIn &&
    (userRole === "admin" || userRole === "super_admin");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    setMobileOpen(false);

    try {
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("Unable to sign out:", error);
      setSigningOut(false);
    }
  };

  const handleSelectProduct = (product: NetrifyProduct) => {
    setSearchOpen(false);
    router.push(`/product/${product.slug}`);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="z-50 border-b border-[#e05b12]/40 bg-[#ff782e] font-sans text-xs tracking-wide text-white">
        <div className="mx-auto flex h-9 w-full max-w-[1800px] min-w-0 items-center justify-between gap-3 px-4 sm:px-6 2xl:px-8">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              NIT Raipur • Official Store
            </span>

            <span className="hidden whitespace-nowrap font-normal text-white/90 md:inline-block">
              National Institute of Technology Raipur
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center text-center text-xs font-medium">
            <span className="max-w-[280px] truncate sm:max-w-md lg:max-w-xl">
              Official Campus Drops Live: Hoodies, Varsity Jackets, T-Shirts & Accessories
            </span>
          </div>

          <div className="hidden shrink-0 items-center gap-4 text-[11px] font-medium text-white/90 lg:flex">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Campus Handover Desk
            </span>
            <span className="text-white/40">|</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Official Merchandise
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 border-b bg-white transition-all duration-200 ${
          scrolled
            ? "border-slate-200 shadow-md shadow-slate-900/5"
            : "border-slate-100"
        }`}
      >
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 2xl:px-8">
          <div className="flex min-h-[88px] flex-nowrap items-center justify-between gap-5">

            {/* Brand Identity */}
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="group flex shrink-0 items-center gap-2.5"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                  <Image
                    src="/images/logo/nit-raipur-logo.png"
                    alt="NIT Raipur Store"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <div>
                  <span className="whitespace-nowrap font-sans text-2xl font-black tracking-tight text-slate-900 xl:text-[27px]">
                    NIT RAIPUR{" "}
                    <span className="text-[#ff782e]">STORE</span>
                  </span>

                  <div className="mt-0.5 hidden items-center gap-1 whitespace-nowrap text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 min-[1600px]:flex">
                    National Institute of Technology Raipur
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap min-[1440px]:flex">
              <Link
                href="/"
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive("/")
                    ? "bg-orange-50/70 font-bold text-[#ff782e]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#ff782e]"
                }`}
              >
                Home
              </Link>

              <Link
                href="/shop"
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive("/shop")
                    ? "bg-orange-50/70 font-bold text-[#ff782e]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#ff782e]"
                }`}
              >
                All Campus Drops
              </Link>

              <Link
                href="/support"
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive("/support")
                    ? "bg-orange-50/70 font-bold text-[#ff782e]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#ff782e]"
                }`}
              >
                Student Helpdesk & Pickup
              </Link>

              {isSignedIn && (
                <Link
                  href="/account/orders"
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive("/account")
                      ? "bg-orange-50/70 font-bold text-[#ff782e]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#ff782e]"
                  }`}
                >
                  My Orders
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                    isActive("/admin")
                      ? "bg-orange-50/70 text-[#ff782e]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#ff782e]"
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex shrink-0 items-center gap-3">

              {/* Search */}
              <button
                type="button"
                aria-label="Search campus merchandise"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen(true)}
                className="flex h-11 w-11 min-w-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-0 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200/70 min-[1600px]:h-11 min-[1600px]:w-auto min-[1600px]:min-w-[210px] min-[1600px]:px-4"
                title="Search campus merchandise"
              >
                <Search className="h-4 w-4 shrink-0 text-slate-400" />

                <span className="hidden whitespace-nowrap font-sans min-[1600px]:inline">
                  Search campus drops...
                </span>

                <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 min-[1600px]:inline">
                  /
                </kbd>
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative shrink-0 rounded-full border border-slate-200 p-3 text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#ff782e]"
                aria-label="View shopping cart"
              >
                <ShoppingBag className="h-5 w-5" />

                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff782e] font-sans text-[10px] font-extrabold text-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Clerk Authentication */}
              <div className="hidden shrink-0 items-center border-l border-slate-200 pl-1 min-[1440px]:flex">
                {!isSignedIn ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/sign-in"
                      className="px-3 py-2 text-xs font-bold text-slate-800 hover:text-[#ff782e]"
                    >
                      Login
                    </Link>

                    <Link
                      href="/sign-up"
                      className="rounded-lg bg-[#ff782e] px-3 py-2 text-xs font-bold text-white"
                    >
                      Sign up
                    </Link>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2 whitespace-nowrap pl-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox:
                            "h-8 w-8 rounded-full border border-slate-200",
                        },
                      }}
                    >
                      <UserButton.MenuItems>
                        <UserButton.Link
                          label="Account Settings"
                          labelIcon={<Settings className="h-4 w-4" />}
                          href="/account"
                        />
                        <UserButton.Link
                          label="My Orders"
                          labelIcon={<Package className="h-4 w-4" />}
                          href="/account/orders"
                        />
                      </UserButton.MenuItems>
                    </UserButton>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-[#e05b12] disabled:cursor-wait disabled:opacity-60"
                    >
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 min-[1440px]:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="space-y-2 border-t border-slate-100 bg-white px-4 pb-6 pt-3 min-[1440px]:hidden">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Home
            </Link>

            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              All Campus Drops
            </Link>

            <Link
              href="/support"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Student Helpdesk & Pickup
            </Link>

            {isSignedIn && (
              <Link
                href="/account/orders"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                My Orders
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50"
              >
                Admin Panel
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Search className="h-4 w-4" />
              Search campus merchandise
            </button>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              {!isSignedIn ? (
                <div className="flex w-full gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center text-xs font-bold text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl bg-[#ff782e] py-2.5 text-center text-xs font-bold text-white"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex shrink-0 items-center gap-1.5">
                    <UserButton>
                      <UserButton.MenuItems>
                        <UserButton.Link
                          label="Account Settings"
                          labelIcon={<Settings className="h-4 w-4" />}
                          href="/account"
                        />
                        <UserButton.Link
                          label="My Orders"
                          labelIcon={<Package className="h-4 w-4" />}
                          href="/account/orders"
                        />
                      </UserButton.MenuItems>
                    </UserButton>

                    <span className="text-xs font-medium text-slate-600">
                      Logged in to NITRRFIE Store
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-[#e05b12] disabled:cursor-wait disabled:opacity-60"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
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
