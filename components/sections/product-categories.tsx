"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Layers, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef } from "react";
import { IconRenderer } from "@/components/ui/icon-renderer";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  subCategories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function ProductCategories() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isUserScrollingRef = useRef(false);
  const touchStartXRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories); // Show all categories
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Auto-scroll functionality with seamless infinite loop
  useEffect(() => {
    if (!scrollContainerRef.current || categories.length === 0) return;

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
  }, [categories.length, isPaused]);

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
    <section ref={ref} className="relative py-20 md:py-24 bg-white overflow-hidden">
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
          <Layers className="w-32 h-32 text-gray-800" />
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
              <Shield className="w-4 h-4 text-gray-700" />
            </motion.div>
            <span className="text-sm font-serif font-semibold text-gray-800">
              Product Categories
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
            <span className="relative z-10">Explore by</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              Category
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
            Find the right products faster, without the guesswork.
          </motion.p>
        </motion.div>

        {/* Categories Horizontal Scroll */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 bg-gray-100 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-serif">No categories available</p>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Duplicate items for seamless infinite scroll */}
            {[...categories, ...categories].map((category, index) => {
              return (
                <motion.div
                  key={`${category.id}-${index}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: Math.min(0.5 + (index % categories.length) * 0.05, 2) }}
                  className="group relative flex-shrink-0 w-[280px] sm:w-[300px] md:w-72 snap-start"
                >
                  {/* Category Card - Small Compact */}
                  <Link href={`/shop?category=${category.slug}`}>
                    <div className="relative bg-white rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 shadow-md hover:shadow-xl transition-all duration-500 h-full flex flex-col hover:-translate-y-1 cursor-pointer min-h-[240px] sm:min-h-[280px]">
                      {/* Top Accent Bar */}
                      <div className="h-1.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 relative overflow-hidden">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent"
                          animate={{
                            x: ["-100%", "200%"],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: index * 0.3,
                          }}
                        />
                      </div>

                      {/* Card Content */}
                      <div className="p-4 md:p-5 flex-1 flex flex-col">
                        {/* Icon Section */}
                        <div className="mb-4">
                          <motion.div
                            animate={{
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1],
                            }}
                            whileHover={{ 
                              rotate: [0, -10, 10, -10, 0], 
                              scale: 1.1,
                              transition: { duration: 0.5 }
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: index * 0.2,
                            }}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center relative group-hover:bg-gray-200 group-hover:border-gray-400 transition-colors"
                          >
                            <IconRenderer 
                              iconName={category.icon || undefined} 
                              fallback={Layers}
                              className="w-6 h-6 md:w-7 md:h-7 text-gray-700" 
                            />
                            {/* Corner Badge */}
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={inView ? { scale: 1, rotate: 0 } : {}}
                              transition={{ delay: 0.7 + index * 0.05, type: "spring" }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ArrowRight className="w-2.5 h-2.5 text-gray-700" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg md:text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
                          {category.name}
                        </h3>

                        {/* Description */}
                        {category.description && (
                          <p className="text-gray-600 mb-3 leading-relaxed font-serif text-xs md:text-sm flex-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}

                        {/* Subcategories Count */}
                        {category.subCategories && category.subCategories.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 font-serif">
                              {category.subCategories.length} {category.subCategories.length === 1 ? 'subcategory' : 'subcategories'}
                            </p>
                          </div>
                        )}

                        {/* CTA */}
                        <div className="flex items-center gap-2 text-gray-700 font-serif font-semibold text-sm group-hover:text-gray-900 transition-colors">
                          <span>Explore</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Decorative Corner */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-full -mr-8 -mt-8" />
                      
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
              View All Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

