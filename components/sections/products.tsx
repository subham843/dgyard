"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Eye, Camera, Lock, ArrowRight, Sparkles, Star, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  featured: boolean;
}

// Simple Animated Lock Component
const AnimatedLock = () => {
  return (
    <motion.div
      animate={{
        y: [0, -4, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative"
    >
      <Lock className="w-4 h-4 text-gray-700" />
    </motion.div>
  );
};

// Product Image Component with error handling
const ProductImage = ({ src, alt, inView, name }: { src: string; alt: string; inView: boolean; name: string }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false); // Reset error when src changes
  }, [src]);

  if (!src || imageError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <Camera className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-110 transition-transform duration-300"
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      unoptimized={src.startsWith('/uploads')} // Skip optimization for local uploads to prevent 404 errors during optimization
      onError={() => {
        // Silently handle image load errors - fallback UI will be shown
        setImageError(true);
      }}
    />
  );
};

export function Products() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?featured=true&limit=6");
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || isPaused || products.length === 0) return;

    const scrollContainer = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition += scrollSpeed;
        if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollPosition = 0;
        }
        scrollContainer.scrollTo({
          left: scrollPosition,
          behavior: "auto",
        });
      }
    };

    const interval = setInterval(scroll, 16);
    return () => clearInterval(interval);
  }, [isPaused, products.length]);

  return (
    <section ref={ref} className="relative py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 border-2 border-gray-300 shadow-sm mb-6 relative"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Shield className="w-4 h-4 text-gray-700" />
            </motion.div>
            <span className="text-sm font-serif font-semibold text-gray-800">
              Featured Products
            </span>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Sparkles className="w-4 h-4 text-gray-600" />
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 relative inline-block"
          >
            <span className="relative z-10">Smart</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              Solutions
              <motion.span
                initial={{ width: 0 }}
                animate={inView ? { width: "100%" } : {}}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-0 left-0 h-0.5 bg-gray-400"
              />
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 font-serif"
          >
            Built for Real Needs
          </motion.p>
        </motion.div>

        {/* Products Horizontal Scroll */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] bg-gray-100 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-serif text-sm">No featured products available</p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                className="group relative flex-shrink-0 w-[260px] md:w-[280px] snap-start"
              >
                {/* Compact Product Card - Unique Design */}
                <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  {/* Top Gradient Bar */}
                  <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: index * 0.2,
                      }}
                    />
                  </div>

                  {/* Featured Badge - Compact */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-yellow-400 text-gray-900 text-xs font-serif font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Featured</span>
                    </div>
                  </div>

                  {/* Discount Badge - Compact */}
                  {product.comparePrice && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-serif font-bold shadow-sm">
                        {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                      </div>
                    </div>
                  )}

                  {/* Image - Compact */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <ProductImage src={product.images[0]} alt={product.name} inView={inView} name={product.name} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Hover Overlay - Compact */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button size="icon" variant="secondary" className="rounded-full bg-white/90 h-8 w-8">
                        <Eye className="w-3.5 h-3.5 text-gray-900" />
                      </Button>
                      <Button size="icon" className="rounded-full bg-gray-900 hover:bg-gray-800 h-8 w-8">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content - Compact */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Category */}
                    <p className="text-xs text-gray-500 mb-1.5 font-serif uppercase tracking-wide">
                      {product.category}
                    </p>

                    {/* Product Name */}
                    <h3 className="text-base font-serif font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Price - Compact */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-serif font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-400 line-through font-serif">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button - Compact */}
                    <Button
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-serif font-semibold text-sm rounded-md mt-auto h-9"
                      asChild
                    >
                      <Link href={`/products/${product.slug}`} className="flex items-center justify-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Decorative Corner */}
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tl-full" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center mt-10"
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-gray-400 hover:border-gray-600 font-serif"
          >
            <Link href="/shop" className="flex items-center gap-2">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
