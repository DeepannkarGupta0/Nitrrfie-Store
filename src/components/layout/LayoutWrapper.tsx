"use client";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 w-full">
      {children}
    </main>
  );
}
