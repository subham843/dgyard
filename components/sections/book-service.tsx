"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Wrench, 
  Network, 
  TrendingUp, 
  Settings, 
  Monitor,
  GraduationCap,
  FileText,
  Zap,
  Phone,
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const serviceTypes = [
  { 
    value: "INSTALLATION", 
    label: "Installation Services", 
    icon: Wrench, 
    description: "CCTV, networking, AV systems installation",
    color: "blue"
  },
  { 
    value: "REPAIR", 
    label: "Repair Services", 
    icon: Settings, 
    description: "Equipment repair and troubleshooting",
    color: "red"
  },
  { 
    value: "NETWORKING", 
    label: "Networking Solutions", 
    icon: Network, 
    description: "Wi-Fi, LAN, fiber setup",
    color: "purple"
  },
  { 
    value: "DIGITAL_MARKETING", 
    label: "Digital Marketing", 
    icon: TrendingUp, 
    description: "SEO, social media, branding",
    color: "green"
  },
  { 
    value: "MAINTENANCE", 
    label: "Maintenance & Support", 
    icon: Settings, 
    description: "Regular maintenance and support",
    color: "orange"
  },
  { 
    value: "CONSULTATION", 
    label: "Consultation", 
    icon: Phone, 
    description: "Expert consultation and advice",
    color: "indigo"
  },
  { 
    value: "DEMO", 
    label: "Product Demo", 
    icon: Monitor, 
    description: "Live product demonstration",
    color: "pink"
  },
  { 
    value: "UPGRADE", 
    label: "Upgrade Services", 
    icon: Zap, 
    description: "System upgrades and enhancements",
    color: "yellow"
  },
  { 
    value: "AUDIT", 
    label: "System Audit", 
    icon: FileText, 
    description: "Security and system audits",
    color: "teal"
  },
  { 
    value: "TRAINING", 
    label: "Training", 
    icon: GraduationCap, 
    description: "Staff training and workshops",
    color: "cyan"
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", hover: "hover:bg-blue-100" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", hover: "hover:bg-purple-100" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", hover: "hover:bg-green-100" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", hover: "hover:bg-orange-100" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", hover: "hover:bg-indigo-100" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", hover: "hover:bg-pink-100" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", hover: "hover:bg-red-100" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", hover: "hover:bg-yellow-100" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", hover: "hover:bg-teal-100" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", hover: "hover:bg-cyan-100" },
};

export function BookService() {
  const router = useRouter();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const handleServiceClick = (serviceType: string) => {
    router.push(`/services/book?type=${serviceType}`);
  };

  return (
    <section ref={ref} className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Classical Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full mb-4 border-2 border-gray-300"
          >
            <Calendar className="w-6 h-6 md:w-7 md:h-7 text-gray-700" />
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            <span className="relative inline-block">
              Book a Service
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200"
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 font-serif">
            Schedule professional services for installation, maintenance, consultation, and more. Our expert team is ready to assist you.
          </p>
        </motion.div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-10">
          {serviceTypes.map((service, index) => {
            const Icon = service.icon;
            const colors = colorClasses[service.color];
            
            return (
              <motion.button
                key={service.value}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleServiceClick(service.value)}
                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 md:p-6 text-left transition-all duration-300 ${colors.hover} shadow-sm hover:shadow-md group`}
              >
                <div className="flex flex-col items-start space-y-3">
                  <div className={`p-3 ${colors.bg} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    {Icon && <Icon className={`w-6 h-6 md:w-8 md:h-8 ${colors.text}`} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-serif font-bold text-base md:text-lg ${colors.text} mb-1`}>
                      {service.label}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${colors.text} text-sm font-semibold group-hover:gap-3 transition-all`}>
                    <span>Book Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 md:p-8 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <Sparkles className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-3">
              Need Help Choosing?
            </h3>
            <p className="text-gray-600 mb-6 font-serif">
              Not sure which service you need? Our team is here to help you find the perfect solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-serif"
              >
                <Link href="/services/book">
                  <Calendar className="w-5 h-5 mr-2" />
                  View All Services
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:bg-gray-50 font-serif"
              >
                <Link href="/contact">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

