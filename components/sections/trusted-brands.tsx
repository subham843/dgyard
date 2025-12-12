"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Tag, Shield, Sparkles, Award } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export function TrustedBrands() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isUserScrollingRef = useRef(false);
  const touchStartXRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch("/api/brands");
        const data = await response.json();
        if (data.brands) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Auto-scroll functionality with seamless infinite loop
  useEffect(() => {
    if (!scrollContainerRef.current || brands.length === 0) return;

    const container = scrollContainerRef.current;
    let animationId: number | null = null;
    
    // Detect if mobile
    const isMobile = window.innerWidth < 768;
    
    // Only auto-scroll on desktop, disable on mobile
    if (isMobile) {
      return;
    }
    
    const scrollSpeed = 0.8; // pixels per frame

    const scroll = () => {
      if (!container || isPaused || isUserScrollingRef.current) {
        animationId = requestAnimationFrame(scroll);
        return;
      }

      // Get current scroll position
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const halfScroll = maxScroll / 2; // Since we duplicated items

      // If we've scrolled past half (first set of items), reset to beginning
      if (currentScroll >= halfScroll - 1) {
        container.scrollLeft = currentScroll - halfScroll;
      } else {
        // Continue scrolling
        container.scrollLeft = currentScroll + scrollSpeed;
      }

      animationId = requestAnimationFrame(scroll);
    };

    // Start scrolling
    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [brands.length, isPaused]);

  // Handle touch events for mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      isUserScrollingRef.current = true;
      setIsPaused(true);
      touchStartXRef.current = e.touches[0].clientX;
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleTouchMove = () => {
      isUserScrollingRef.current = true;
      setIsPaused(true);
      
      // Clear timeout and set new one
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleTouchEnd = () => {
      // Wait a bit before allowing auto-scroll again
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        setIsPaused(false);
      }, 2000); // 2 seconds delay after touch ends
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section ref={ref} className="relative py-20 md:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Classical Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="absolute top-10 right-10 opacity-[0.05] hidden lg:block"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Tag className="w-32 h-32 text-gray-800" />
        </motion.div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section - Classical */}
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
              <Award className="w-4 h-4 text-gray-700" />
            </motion.div>
            <span className="text-sm font-serif font-semibold text-gray-800">
              Premium Brands
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
            <span className="relative z-10">Trusted Brands</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              We Offer
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
            Quality products from the brands you rely on.
          </motion.p>
        </motion.div>

        {/* Brands Horizontal Scroll */}
        {loading ? (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-serif">No brands available</p>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Duplicate items for seamless infinite scroll */}
            {[...brands, ...brands].map((brand, index) => {
              return (
                <motion.div
                  key={`${brand.id}-${index}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: Math.min(0.5 + (index % brands.length) * 0.05, 2) }}
                  className="group relative flex-shrink-0 w-32 sm:w-40 md:w-48 snap-start"
                >
                  {/* Brand Card - Classical */}
                  <Link href={`/shop?brand=${brand.slug}`}>
                    <div className="relative bg-white rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 shadow-md hover:shadow-xl transition-all duration-500 h-full flex flex-col items-center justify-center hover:-translate-y-1 cursor-pointer min-h-[140px] sm:min-h-[160px] p-4 md:p-6">
                      {/* Top Accent Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />

                      {/* Brand Logo */}
                      <div className="relative w-full h-24 md:h-28 flex items-center justify-center mb-3">
                        {brand.logo ? (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="relative w-full h-full"
                          >
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              fill
                              className="object-contain"
                              loading="lazy"
                              sizes="(max-width: 768px) 120px, 150px"
                            />
                          </motion.div>
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                            <Tag className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Brand Name */}
                      <h3 className="text-sm md:text-base font-serif font-bold text-gray-900 text-center group-hover:text-gray-700 transition-colors line-clamp-2">
                        {brand.name}
                      </h3>

                      {/* Decorative Corner */}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full -mr-6 -mt-6" />
                      
                      {/* Border on Hover */}
                      <div className="absolute inset-0 border-2 border-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 text-center"
        >
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-gray-400 hover:border-gray-600 hover:text-gray-900 hover:bg-gray-100 font-serif rounded-md transition-all bg-white"
          >
            <Link href="/shop" className="flex items-center gap-2">
              Explore All Brands
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

