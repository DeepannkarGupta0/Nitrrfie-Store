import type { Metadata } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NIT Raipur Store — Official Campus Merchandise | NIT Raipur",
  description: "Official campus merchandise store of National Institute of Technology Raipur. Authentic varsity hoodies, collegiate t-shirts, jackets, and accessories.",
};

import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceMono.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased" suppressHydrationWarning>
          <CartProvider>
            <Navbar />
            <LayoutWrapper>{children}</LayoutWrapper>
            <Footer />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
