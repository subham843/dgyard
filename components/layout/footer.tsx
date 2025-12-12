"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Heart, ArrowUp } from "lucide-react";
import { useSettings } from "@/lib/hooks/use-settings";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={ref} className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-t-2 border-gray-200">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center sm:text-left"
            >
              <Link href="/" className="inline-block mb-4 sm:mb-6 group">
                <span className="font-serif font-bold text-xl sm:text-2xl text-gray-900 group-hover:text-gray-700 transition-colors">
                  {settings?.siteName || "D.G.Yard"}
                </span>
              </Link>
              
              {/* Minimal Description */}
              <p className="text-gray-600 font-serif text-xs sm:text-sm mb-4 sm:mb-6 max-w-xs mx-auto sm:mx-0">
                {settings?.siteTagline || "Security & Technology Solutions"}
              </p>

              {/* Social Icons */}
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                {settings?.facebookUrl && (
                  <motion.a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </motion.a>
                )}
                {settings?.instagramUrl && (
                  <motion.a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </motion.a>
                )}
                {settings?.linkedinUrl && (
                  <motion.a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </motion.a>
                )}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center sm:text-left"
            >
              <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 mb-4 sm:mb-6 relative inline-block">
                Quick Links
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"
                />
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <motion.li
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href="/shop"
                    className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400 group-hover:bg-gray-900 transition-colors" />
                    Products
                  </Link>
                </motion.li>
                <motion.li
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href="/solutions"
                    className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400 group-hover:bg-gray-900 transition-colors" />
                    Solutions
                  </Link>
                </motion.li>
                <motion.li
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href="/about"
                    className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400 group-hover:bg-gray-900 transition-colors" />
                    About
                  </Link>
                </motion.li>
                <motion.li
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Link
                    href="/contact"
                    className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400 group-hover:bg-gray-900 transition-colors" />
                    Contact
                  </Link>
                </motion.li>
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center sm:text-left sm:col-span-2 lg:col-span-1"
            >
              <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900 mb-4 sm:mb-6 relative inline-block">
                Get In Touch
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"
                />
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                {settings?.phone && (
                  <motion.li
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center flex-shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                    </motion.div>
                    <a
                      href={`tel:${settings.phone}`}
                      className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm"
                    >
                      {settings.phone}
                    </a>
                  </motion.li>
                )}
                {settings?.email && (
                  <motion.li
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center flex-shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                    </motion.div>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-gray-600 font-serif hover:text-gray-900 transition-colors text-xs sm:text-sm break-all"
                    >
                      {settings.email}
                    </a>
                  </motion.li>
                )}
                {settings?.address && (
                  <motion.li
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-start justify-center sm:justify-start gap-2 sm:gap-3"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mt-0.5 flex-shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                    </motion.div>
                    <div className="text-gray-600 font-serif text-xs sm:text-sm leading-relaxed">
                      {settings.address}
                      {settings.city && `, ${settings.city}`}
                      {settings.state && `, ${settings.state}`}
                      {settings.pincode && ` - ${settings.pincode}`}
                    </div>
                  </motion.li>
                )}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="pt-6 sm:pt-8 border-t-2 border-gray-200"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Copyright */}
              <motion.p
                whileHover={{ scale: 1.05 }}
                className="text-gray-600 font-serif text-xs sm:text-sm flex items-center gap-2 text-center sm:text-left"
              >
                &copy; {currentYear} {settings?.siteName || "D.G.Yard"}. All rights reserved.
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-flex text-red-500"
                >
                  <Heart className="w-3 h-3 fill-current" />
                </motion.span>
              </motion.p>

              {/* Scroll to Top Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={showScrollTop ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToTop}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-white border-2 border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
