"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = product.image && !imgError;

  return (
    <motion.div
      className="group relative bg-cream border-brutal border-3 border-brutal-black p-4"
      style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
      whileHover={{ 
        x: -8, 
        y: -8, 
        rotate: -2,
        boxShadow: "12px 12px 0 #0A0A0A" 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="aspect-square bg-brutal-black/5 mb-4 overflow-hidden relative">
        <div className="absolute top-2 left-2 z-10 bg-accent text-cream font-mono text-xs px-2 py-1 uppercase -rotate-12">
          {product.category}
        </div>
        {hasImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brutal-black/30 font-mono text-4xl">
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-lg font-bold uppercase leading-tight">
          {product.name}
        </h3>
        <p className="font-sans text-sm text-brutal-black/70 line-clamp-1">
          {product.tagline}
        </p>
        <p className="font-mono text-[10px] tracking-wider text-brutal-black/50">
          ITEM NO. {product.sku}
        </p>
        <p className="font-mono text-xl font-bold text-accent">
          {formatPrice(product.price)}
        </p>
      </div>

      <Link href={`/product/${product.slug}`} className="absolute inset-0" />
    </motion.div>
  );
}