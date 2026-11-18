
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer modern formats; Next.js serves the best supported format per browser.
    formats: ["image/avif", "image/webp"],
    // Responsive widths reduce unnecessary image bytes on mobile devices.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ryceqgtaoxktcvbdpdmu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
