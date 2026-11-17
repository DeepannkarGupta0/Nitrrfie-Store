import type { Metadata } from "next";
import {
  Space_Mono,
  Playfair_Display,
  Roboto,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { InventoryProvider } from "@/context/InventoryContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
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
      <html lang="en" className={`${spaceMono.variable} ${playfair.variable} ${roboto.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased" suppressHydrationWarning>
          <CartProvider>
            <InventoryProvider>
              <Navbar />
              <LayoutWrapper>{children}</LayoutWrapper>
              <Footer />
            </InventoryProvider>
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
