"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Camera, TrendingUp, ArrowRight, Sparkles, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { generateOfferSchema } from "@/lib/schema-markup";

interface Offer {
  id: string;
  title: string;
  description: string;
  category: "CCTV" | "DIGITAL_MARKETING";
  image?: string;
  discount?: number;
  originalPrice?: number;
  offerPrice?: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  featured: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export function Offers() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [cctvOffers, setCctvOffers] = useState<Offer[]>([]);
  const [digitalMarketingOffers, setDigitalMarketingOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const [cctvResponse, dmResponse] = await Promise.all([
        fetch("/api/offers?category=CCTV&active=true"),
        fetch("/api/offers?category=DIGITAL_MARKETING&active=true"),
      ]);

      const cctvData = await cctvResponse.json();
      const dmData = await dmResponse.json();

      setCctvOffers(cctvData.offers || []);
      setDigitalMarketingOffers(dmData.offers || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const OfferCard = ({ offer, index }: { offer: Offer; index: number }) => {
    const isExpired =
      offer.validUntil && new Date(offer.validUntil) < new Date();
    const isValid =
      offer.active &&
      !isExpired &&
      (!offer.validFrom || new Date(offer.validFrom) <= new Date());

    if (!isValid) return null;

    const isHovered = hoveredCard === offer.id;

    return (
      <div
        onMouseEnter={() => setHoveredCard(offer.id)}
        onMouseLeave={() => setHoveredCard(null)}
        className="group relative flex-shrink-0 w-[280px] sm:w-80"
      >
        {/* Card Container - Compact Classical Design */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-300 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col"
        >
          {/* Featured Badge - Compact */}
          {offer.featured && (
            <div className="absolute top-2 right-2 z-20">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-yellow-400 text-gray-900 text-[10px] font-serif font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Featured
              </motion.div>
            </div>
          )}

          {/* Discount Badge - Compact */}
          {offer.discount && (
            <div className="absolute top-2 left-2 z-20">
              <motion.div
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-red-600 text-white text-xs font-serif font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1"
              >
                <Percent className="w-3 h-3" />
                {offer.discount}%
              </motion.div>
            </div>
          )}

          {/* Image Section - Compact (Smaller on Mobile) */}
          {offer.image && (
            <div className="relative w-full h-32 sm:h-40 overflow-hidden bg-gray-100">
              <motion.div
                animate={{
                  scale: isHovered ? 1.08 : 1,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full h-full"
              >
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 280px, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
            </div>
          )}

          {/* Content Section - Compact (Smaller on Mobile) */}
          <div className="relative z-10 p-3 sm:p-4 flex flex-col flex-1">
            {/* Title - Compact Classical Font (Smaller on Mobile) */}
            <h3 className="text-sm sm:text-base md:text-lg font-serif font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2 leading-tight">
              {offer.title}
            </h3>

            {/* Price Section - Compact (Smaller on Mobile) */}
            {(offer.originalPrice || offer.offerPrice) && (
              <div className="mb-2 sm:mb-3">
                {offer.originalPrice && offer.offerPrice ? (
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900">
                      {formatPrice(offer.offerPrice)}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base text-gray-400 line-through font-serif">
                      {formatPrice(offer.originalPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900">
                    {formatPrice(offer.originalPrice || offer.offerPrice || 0)}
                  </span>
                )}
              </div>
            )}

            {/* CTA Button - Compact Classical (Smaller on Mobile) */}
            {offer.ctaLink && (
              <div className="mt-auto pt-1.5 sm:pt-2">
                <Button
                  asChild
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-serif text-xs sm:text-sm font-medium py-2 sm:py-2.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Link href={offer.ctaLink} className="flex items-center justify-center gap-1 sm:gap-1.5">
                    <span>{offer.ctaText || "Get Offer"}</span>
                    <motion.div
                      animate={{
                        x: isHovered ? 3 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </motion.div>
                  </Link>
                </Button>
              </div>
            )}

            {/* Classical Border on Hover */}
            <div className="absolute inset-0 rounded-lg border border-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center font-serif text-sm text-gray-600">Loading offers...</div>
        </div>
      </section>
    );
  }

  // Generate schema markup for SEO
  const allOffers = [...cctvOffers, ...digitalMarketingOffers];
  const schemaMarkup = allOffers.map((offer) => generateOfferSchema(offer));

  return (
    <section ref={ref} className="py-8 md:py-12 bg-white relative overflow-hidden min-h-screen flex flex-col">
      {/* Schema Markup for SEO */}
      {schemaMarkup.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaMarkup),
          }}
        />
      )}

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.01]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-center">
        {/* CCTV Offers Section */}
        {cctvOffers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8 md:mb-12"
          >
            {/* Section Header - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-4 md:mb-6"
            >
              <motion.div
                animate={{
                  rotate: [0, 8, -8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full mb-4 border border-gray-300"
              >
                <Camera className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
                Smart Security Deals You'll Love
              </h2>
              <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
            </motion.div>

            {/* Offers - Horizontal Scroll on Mobile, Grid on Desktop */}
            <div className="sm:hidden overflow-hidden -mx-4 px-4">
              {/* Mobile: Horizontal Scrolling Carousel - Right to Left */}
              <motion.div
                className="flex gap-4"
                style={{
                  width: `${(280 + 16) * cctvOffers.length * 2}px`,
                }}
                animate={{
                  x: [0, -((280 + 16) * cctvOffers.length)],
                }}
                transition={{
                  duration: cctvOffers.length * 8,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              >
                {/* First set */}
                {cctvOffers.map((offer, index) => (
                  <div key={offer.id} className="flex-shrink-0">
                    <OfferCard offer={offer} index={index} />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {cctvOffers.map((offer, index) => (
                  <div key={`duplicate-${offer.id}`} className="flex-shrink-0">
                    <OfferCard offer={offer} index={index} />
                  </div>
                ))}
              </motion.div>
            </div>
            
            {/* Desktop: Horizontal Scroll - Right to Left */}
            <div className="hidden sm:block overflow-hidden -mx-4 px-4">
              <motion.div
                className="flex gap-4"
                style={{
                  width: `${(320 + 16) * cctvOffers.length * 2}px`,
                }}
                animate={{
                  x: [0, -((320 + 16) * cctvOffers.length)],
                }}
                transition={{
                  duration: cctvOffers.length * 10,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              >
                {/* First set */}
                {cctvOffers.map((offer, index) => (
                  <div key={offer.id} className="flex-shrink-0 w-80">
                    <OfferCard offer={offer} index={index} />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {cctvOffers.map((offer, index) => (
                  <div key={`duplicate-${offer.id}`} className="flex-shrink-0 w-80">
                    <OfferCard offer={offer} index={index} />
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Digital Marketing Offers Section */}
        {digitalMarketingOffers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Section Header - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center mb-4 md:mb-6"
            >
              <motion.div
                animate={{
                  rotate: [0, -8, 8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full mb-4 border border-gray-300"
              >
                <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
                Special Offers to Boost Your Digital Presence
              </h2>
              <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
            </motion.div>

            {/* Offers - Horizontal Scroll on Mobile, Grid on Desktop */}
            <div className="sm:hidden overflow-hidden -mx-4 px-4">
              {/* Mobile: Horizontal Scrolling Carousel - Left to Right */}
              <motion.div
                className="flex gap-4"
                style={{
                  width: `${(280 + 16) * digitalMarketingOffers.length * 2}px`,
                }}
                animate={{
                  x: [-((280 + 16) * digitalMarketingOffers.length), 0],
                }}
                transition={{
                  duration: digitalMarketingOffers.length * 8,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              >
                {/* First set */}
                {digitalMarketingOffers.map((offer, index) => (
                  <div key={offer.id} className="flex-shrink-0">
                    <OfferCard offer={offer} index={cctvOffers.length + index} />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {digitalMarketingOffers.map((offer, index) => (
                  <div key={`duplicate-${offer.id}`} className="flex-shrink-0">
                    <OfferCard offer={offer} index={cctvOffers.length + index} />
                  </div>
                ))}
              </motion.div>
            </div>
            
            {/* Desktop: Horizontal Scroll - Left to Right */}
            <div className="hidden sm:block overflow-hidden -mx-4 px-4">
              <motion.div
                className="flex gap-4"
                style={{
                  width: `${(320 + 16) * digitalMarketingOffers.length * 2}px`,
                }}
                animate={{
                  x: [-((320 + 16) * digitalMarketingOffers.length), 0],
                }}
                transition={{
                  duration: digitalMarketingOffers.length * 10,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              >
                {/* First set */}
                {digitalMarketingOffers.map((offer, index) => (
                  <div key={offer.id} className="flex-shrink-0 w-80">
                    <OfferCard offer={offer} index={cctvOffers.length + index} />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {digitalMarketingOffers.map((offer, index) => (
                  <div key={`duplicate-${offer.id}`} className="flex-shrink-0 w-80">
                    <OfferCard offer={offer} index={cctvOffers.length + index} />
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {cctvOffers.length === 0 && digitalMarketingOffers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-center py-12"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4"
            >
              <Camera className="w-8 h-8 text-gray-400" />
            </motion.div>
            <p className="text-sm text-gray-600 font-serif">
              No offers available at the moment. Check back soon!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
