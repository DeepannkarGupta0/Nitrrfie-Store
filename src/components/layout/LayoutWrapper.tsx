"use client";

import { usePathname } from "next/navigation";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main className={`flex-1 ${isHome ? "pt-0" : "pt-[72px]"}`}>
      {children}
    </main>
  );
}
