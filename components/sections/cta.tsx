"use client";

import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, Shield, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export function CTA() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="relative py-20 md:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="absolute top-10 left-10 opacity-[0.05] hidden lg:block"
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
          <Shield className="w-32 h-32 text-white" />
        </motion.div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm font-serif font-semibold text-white">
              Get Started Today
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-6"
          >
            Ready to Secure Your Property?
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-serif"
          >
            Get a free consultation and quote today. Our experts are ready to help you 
            choose the perfect security solution.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-semibold text-lg px-8 py-6 rounded-md shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/contact" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call Now
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-serif font-semibold rounded-md backdrop-blur-sm transition-all"
            >
              <Link href="/quotation" className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Get Free Quote
              </Link>
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
              <Phone className="w-8 h-8 mb-3 mx-auto text-white" />
              <div className="font-serif font-semibold mb-1 text-lg">24/7 Support</div>
              <div className="text-sm text-white/80 font-serif">Always Available</div>
            </div>
            <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
              <MessageCircle className="w-8 h-8 mb-3 mx-auto text-white" />
              <div className="font-serif font-semibold mb-1 text-lg">Free Consultation</div>
              <div className="text-sm text-white/80 font-serif">Expert Advice</div>
            </div>
            <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
              <Mail className="w-8 h-8 mb-3 mx-auto text-white" />
              <div className="font-serif font-semibold mb-1 text-lg">Quick Response</div>
              <div className="text-sm text-white/80 font-serif">Within 24 Hours</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
