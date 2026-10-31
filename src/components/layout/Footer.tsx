"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Marquee from "../ui/Marquee";
import { footerNav } from "@/config/navigation";

export default function Footer() {
  const pathname = usePathname();

  // On the homepage, Netrify uses its dedicated NetrifyFooter
  if (pathname === "/") {
    return null;
  }
  return (
    <footer className="bg-cream border-t-brutal border-t-3 border-brutal mt-auto">
      <div className="border-b-brutal border-b-3">
        <Marquee text="UNWEARABLE — FASHION IS DEAD — WEAR THE VOID — " />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-mono text-xl font-bold uppercase mb-4">Unwearable</h3>
          <p className="font-sans text-sm leading-relaxed max-w-md">
            Fashion for the digitally exhausted. Clothes for people who&apos;d rather not exist than pick an outfit.
            Zero trends. Maximum regret.
          </p>
        </div>

        <div>
          <h4 className="font-mono text-sm font-bold uppercase mb-4">Links</h4>
          <ul className="space-y-2">
            {footerNav.filter(item => item.enabled).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="font-sans text-sm hover:text-accent transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-sm font-bold uppercase mb-4">Connect</h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="font-sans text-sm hover:text-accent transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="font-sans text-sm hover:text-accent transition-colors">
                TikTok
              </a>
            </li>
            <li>
              <a href="#" className="font-sans text-sm hover:text-accent transition-colors">
                Discord
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-brutal border-t-3 border-brutal px-4 py-4">
        <p className="font-mono text-xs text-center uppercase">
          © 2026 Unwearable. All rights reserved. Nothing matters anyway.
        </p>
      </div>
    </footer>
  );
}