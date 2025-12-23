"use client";

import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  MessageCircle,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Globe,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const auditFeatures = [
  {
    icon: Globe,
    text: "Website Performance Audit"
  },
  {
    icon: BarChart3,
    text: "GMB & Social Media Analysis"
  },
  {
    icon: MessageSquare,
    text: "30-Day Marketing Strategy"
  },
  {
    icon: TrendingUp,
    text: "Competitor Analysis & Recommendations"
  },
];

export function MarketingAudit() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="relative py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* AI Helper Style Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            exit={{ opacity: 0, y: 10 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex-shrink-0">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Heading */}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
                    Get a Free Marketing Audit
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm md:text-base text-gray-700 mb-4 leading-relaxed">
                  Wondering how your business is performing online? Get a comprehensive marketing audit with insights on your website, Google My Business, social media presence, and receive a personalized 30-day marketing strategy — all for free.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {auditFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <motion.div
                        key={feature.text}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="text-center p-3 rounded-lg bg-white/60 border border-blue-200"
                      >
                        {IconComponent && (
                          <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mx-auto mb-2" />
                        )}
                        <p className="text-xs md:text-sm font-serif font-medium text-gray-700 leading-tight">
                          {feature.text}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-serif font-semibold w-full sm:w-auto group"
                >
                  <Link href="/services/digital-marketing" className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Ask Honey for Free Audit
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}













