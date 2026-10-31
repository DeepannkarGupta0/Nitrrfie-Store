"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { mainNav, accountNav, adminNav, NavConfigItem } from "@/config/navigation";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();

  const adminRole = "admin"; // role is static and defined server‑side
  const userRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
  const isAdmin = isSignedIn && userRole === adminRole;

  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  // On the homepage, Netrify uses its dedicated NetrifyNavbar
  if (pathname === "/") {
    return null;
  }

  // Helper to render a link, applying active and enabled styles
  const renderLink = (item: NavConfigItem, extraClass = "") => {
    if (!item.enabled) return null;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`font-mono text-sm uppercase hover:text-accent transition-colors ${extraClass} ${isActive(item.href) ? "underline font-bold" : ""}`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream border-b-brutal border-brutal border-b-3">
      <nav aria-label="Primary Navigation" className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link href="/" className="font-mono text-2xl font-bold uppercase tracking-tight hover:text-accent transition-colors">
          Unwearable
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          {/* Main navigation */}
          {mainNav.map((item) => renderLink(item))}

          {/* Account navigation (signed-in only) */}
          {isSignedIn && accountNav.map((item) => renderLink(item))}

          {/* Admin navigation */}
          {isAdmin && adminNav.map((item) => renderLink(item))}

          {/* Cart link */}
          <Link
            href="/cart"
            className="font-mono text-sm uppercase flex items-center gap-2 hover:text-accent transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="bg-accent text-cream px-2 py-0.5 text-xs font-bold">{totalItems}</span>
            )}
          </Link>

          {/* Notifications Link (signed in only) */}
          {isSignedIn && (
            <Link
              href="/notifications"
              className="hover:text-accent transition-colors flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
          )}

          {/* Auth buttons */}
          <div className="border-l-brutal border-l-2 pl-8 flex items-center">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button type="button" className="font-mono text-sm uppercase hover:text-accent transition-colors">Sign In</button>
              </SignInButton>
            ) : (
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "border-brutal border-2 hover:scale-105 transition-transform",
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden border-brutal border-3 p-2 bg-cream"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <div className="w-6 h-0.5 bg-brutal-black mb-1.5 transition-all" />
          <div className="w-6 h-0.5 bg-brutal-black mb-1.5 transition-all" />
          <div className="w-6 h-0.5 bg-brutal-black transition-all" />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            id="mobile-menu"
            className="md:hidden bg-cream border-b-brutal border-b-3 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              {/* Main */}
              {mainNav.filter(i => i.enabled).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors ${isActive(item.href) ? "font-bold bg-accent text-cream" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Account */}
              {isSignedIn &&
                accountNav.filter(i => i.enabled).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors ${isActive(item.href) ? "font-bold bg-accent text-cream" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

              {/* Admin */}
              {isAdmin &&
                adminNav.filter(i => i.enabled).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-accent text-cream hover:bg-brutal-black transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

              {/* Cart */}
              <Link
                href="/cart"
                className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors flex justify-center items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                Cart
                {totalItems > 0 && (
                  <span className="bg-accent text-cream px-2 py-1 text-sm font-bold">{totalItems}</span>
                )}
              </Link>

              {/* Auth */}
              <div className="pt-4 border-t-brutal border-t-3">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="w-full font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-accent text-cream hover:bg-brutal-black transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                ) : (
                  <div className="flex items-center justify-center p-4 border-brutal border-3 bg-cream">
                    <UserButton showName />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}