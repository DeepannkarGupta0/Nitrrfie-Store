"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { accountNav, futureNav } from "@/config/navigation";

const NAV_ITEMS = [...accountNav, ...futureNav].filter(item => item.enabled);

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Account navigation"
      className="bg-cream border-r-brutal border-r-3 border-brutal-black p-4 md:w-64"
    >
      <button
        type="button"
        className="md:hidden mb-4 font-sans text-sm font-semibold tracking-wide border-brutal border-3 p-2"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="dashboard-sidebar-links"
      >
        {open ? "Close" : "Menu"}
      </button>
      <ul
        id="dashboard-sidebar-links"
        className={`${open ? "block" : "hidden"} md:block space-y-2`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block font-sans text-sm font-semibold tracking-wide py-2 px-3 border-brutal border-3 hover:bg-accent hover:text-cream transition-colors ${isActive ? "bg-accent text-cream" : "bg-cream text-brutal-black"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
