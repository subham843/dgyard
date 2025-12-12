"use client";

import { Star, Quote, Shield, Sparkles, CheckCircle2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface Review {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  image?: string;
  source?: string;
  verified: boolean;
  featured: boolean;
}

interface TestimonialsProps {
  customHeading?: string;
  customSubtitle?: string;
}

export function Testimonials({ customHeading, customSubtitle }: TestimonialsProps = {}) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("/api/reviews");
        const data = await response.json();
        if (data.reviews) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || isPaused || reviews.length === 0) return;

    const scrollContainer = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame

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

    const interval = setInterval(scroll, 16); // ~60fps
    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  return (
    <section ref={ref} className="relative py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Classical Background Pattern */}
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
        {/* Header Section - Compact */}
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
              Customer Reviews
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
            <span className="relative z-10">{customHeading || "What Our"}</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              Customers Say
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
            {customSubtitle || "Real feedback from people who trust our services."}
          </motion.p>
        </motion.div>

        {/* Reviews Horizontal Scroll */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[300px] bg-gray-100 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-serif text-sm">No reviews available</p>
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
            {reviews.slice(0, 8).map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                className="group relative flex-shrink-0 w-[280px] md:w-[300px] snap-start"
              >
                {/* Compact Review Card - Unique Design */}
                <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  {/* Top Accent Line */}
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

                  {/* Card Content - Compact */}
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    {/* Top Section: Quote Icon + Stars */}
                    <div className="flex items-start justify-between mb-3">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={inView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ delay: 0.6 + index * 0.05, type: "spring" }}
                      >
                        <Quote className="w-6 h-6 text-gray-300" />
                      </motion.div>
                      
                      {/* Stars - Compact */}
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Content - Compact */}
                    <p className="text-gray-700 mb-4 leading-snug font-serif text-sm flex-1 line-clamp-4">
                      "{review.content}"
                    </p>

                    {/* Author Section - Compact */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {/* Avatar - Smaller */}
                      <div className="relative">
                        {review.image ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                            <Image
                              src={review.image}
                              alt={review.name}
                              width={32}
                              height={32}
                              className="object-cover"
                              loading="lazy"
                              sizes="(max-width: 768px) 80px, 100px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border border-gray-300 flex items-center justify-center">
                            <span className="text-gray-700 font-serif font-bold text-xs">
                              {review.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Verified Badge - Smaller */}
                        {review.verified && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={inView ? { scale: 1 } : {}}
                            transition={{ delay: 0.7 + index * 0.05, type: "spring" }}
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border border-white"
                          >
                            <CheckCircle2 className="w-2 h-2 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Name and Role - Compact */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-semibold text-gray-900 text-sm truncate">
                          {review.name}
                        </h4>
                        {review.role && (
                          <p className="text-xs text-gray-500 font-serif truncate">
                            {review.role}
                          </p>
                        )}
                        {review.source && (
                          <p className="text-xs text-gray-400 font-serif">
                            {review.source}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Featured Badge - Compact */}
                    {review.featured && (
                      <div className="absolute top-2 right-2">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                          className="bg-yellow-400 text-gray-900 text-xs font-serif font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>Featured</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Unique Decorative Corner */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tl-full" />
                  </div>

                  {/* Bottom Accent Line on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
