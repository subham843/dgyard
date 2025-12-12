"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { 
  Calculator, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Shield, 
  Star, 
  Phone, 
  MessageCircle, 
  HelpCircle,
  ArrowRight,
  Package,
  Camera,
  HardDrive,
  Cable,
  Settings,
  Smartphone,
  Award,
  TrendingUp,
  Users,
  Home,
  Building2,
  Factory,
  Store,
  Zap,
  Check
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { QuotationForm } from "./quotation-form";
import { Testimonials } from "@/components/sections/testimonials";

export function QuotationPageNew() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [packagesRef, packagesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [includedRef, includedInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [trustRef, trustInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [whyChooseRef, whyChooseInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const handleOpenHoneyChat = () => {
    const event = new CustomEvent("openHoneyChat");
    window.dispatchEvent(event);
  };

  const suggestedPackages = [
    {
      name: "Basic Package",
      cameras: "2-4 cameras",
      price: "Starting from ₹XX,XXX",
      features: ["HD Cameras", "Basic DVR", "500GB Storage", "Basic Installation"],
      icon: Home,
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Home Package",
      cameras: "4-8 cameras",
      price: "Starting from ₹XX,XXX",
      features: ["Full HD Cameras", "4-Channel DVR", "1TB Storage", "Professional Installation"],
      icon: Building2,
      color: "from-purple-400 to-purple-600"
    },
    {
      name: "Office Package",
      cameras: "8-16 cameras",
      price: "Starting from ₹XX,XXX",
      features: ["4MP Cameras", "16-Channel NVR", "2TB Storage", "Advanced Setup"],
      icon: Factory,
      color: "from-green-400 to-green-600"
    },
    {
      name: "Industrial Package",
      cameras: "16+ cameras",
      price: "Starting from ₹XX,XXX",
      features: ["5MP+ Cameras", "32-Channel NVR", "4TB+ Storage", "Enterprise Installation"],
      icon: Store,
      color: "from-orange-400 to-orange-600"
    },
  ];

  const includedItems = [
    { icon: Camera, text: "Camera" },
    { icon: HardDrive, text: "DVR/NVR" },
    { icon: HardDrive, text: "Hard disk" },
    { icon: Cable, text: "Wiring" },
    { icon: Settings, text: "Installation" },
    { icon: Settings, text: "Configuration" },
    { icon: Smartphone, text: "Mobile app setup" },
    { icon: Award, text: "Warranty info" },
  ];

  const addOns = [
    { id: "ups", label: "UPS / Power Supply", checked: false },
    { id: "extra_storage", label: "Extra Storage", checked: false },
    { id: "door_phone", label: "Video Door Phone", checked: false },
    { id: "router", label: "Router (for networking)", checked: false },
    { id: "display_monitor", label: "Display Monitor or TV", checked: false },
    { id: "remote_support", label: "Remote support package", checked: false },
  ];

  const whyChoosePoints = [
    {
      icon: Shield,
      title: "Clean installation",
      description: "Professional setup with neat wiring and organized installation."
    },
    {
      icon: TrendingUp,
      title: "Honest pricing",
      description: "Transparent pricing with no hidden costs or unnecessary add-ons."
    },
    {
      icon: Users,
      title: "Expert support",
      description: "24/7 support and expert guidance throughout your journey."
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* 1. Hero Header */}
        <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
              >
                <Calculator className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-serif font-semibold text-white">Quick Estimate</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6"
              >
                Get Your Custom CCTV Quotation
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-gray-200 font-serif mb-4"
              >
                Quick, accurate, and personalized — designed for your space.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="text-base text-gray-300 font-serif"
              >
                AI-assisted suggestions available via Honey.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* 2. Short Intro / Instructions */}
        <section ref={introRef} className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={introInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed mb-4">
                Tell us a few details about your location and requirements, and our system will create a perfect estimate for you.
              </p>
              <p className="text-base md:text-lg text-gray-600 font-serif">
                You can also ask Honey (AI Assistant) if you need help choosing the right setup.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 3. 4-Step Quotation Form + AI Help Box */}
        <section id="quotation-form" className="py-8 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Form - 3 columns */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 md:p-8">
                  <QuotationForm />
                </div>
              </div>

              {/* AI Help Box - 1 column */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-2xl border-2 border-yellow-200 p-6 sticky top-24"
                >
                  <div className="text-center mb-4">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="inline-block mb-3"
                    >
                      <Bot className="w-12 h-12 text-yellow-600 mx-auto" />
                    </motion.div>
                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
                      Need help choosing? Ask Honey.
                    </h3>
                    <p className="text-sm text-gray-600 font-serif mb-4">
                      Our AI assistant can help you pick the right camera count, storage, and product type.
                    </p>
                    <Button
                      onClick={handleOpenHoneyChat}
                      size="sm"
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-serif font-bold"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Chat with Honey
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Suggested Packages */}
        <section ref={packagesRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={packagesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Suggested Packages
              </h2>
              <p className="text-gray-600 font-serif">Ready-made combos for quick setup</p>
              <div className="w-24 h-1 bg-gray-900 mx-auto mt-4"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedPackages.map((pkg, index) => {
                const IconComponent = pkg.icon;
                return (
                  <motion.div
                    key={pkg.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={packagesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-900 p-6 transition-all hover:shadow-xl group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${pkg.color} rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 text-center">
                      {pkg.name}
                    </h3>
                    <p className="text-gray-600 font-serif text-sm mb-4 text-center">
                      {pkg.cameras}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 font-serif">
                          <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xl font-serif font-bold text-gray-900 mb-4 text-center">
                      {pkg.price}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-serif"
                    >
                      <Link href="#quotation-form" className="flex items-center justify-center gap-2">
                        Customize with calculator
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. What's Included */}
        <section ref={includedRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={includedInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                  What's Included in Your Quotation
                </h2>
                <p className="text-gray-600 font-serif text-center mb-8">
                  Users feel secure when they know exactly what's covered.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {includedItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={includedInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="text-center"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <IconComponent className="w-8 h-8 text-gray-700" />
                        </div>
                        <p className="text-sm font-serif font-semibold text-gray-900">
                          {item.text}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. Optional Add-Ons */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                Optional Add-Ons
              </h2>
              <p className="text-gray-600 font-serif text-center mb-8">
                Upselling made easy.
              </p>
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 space-y-4">
                {addOns.map((addon, index) => (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-900 transition-all"
                  >
                    <input
                      type="checkbox"
                      id={addon.id}
                      className="w-5 h-5 text-gray-900 border-2 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <label htmlFor={addon.id} className="flex-1 text-gray-700 font-serif font-semibold cursor-pointer">
                      {addon.label}
                    </label>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 7. Accuracy Note (Trust Section) */}
        <section ref={trustRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={trustInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center bg-white rounded-2xl border-2 border-gray-200 p-8 md:p-12"
            >
              <Shield className="w-12 h-12 text-gray-900 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                Accuracy Note
              </h3>
              <p className="text-gray-700 font-serif leading-relaxed">
                Your quotation is generated based on industry standards and real installation data. Final pricing may vary slightly after site visit, but 90% of the estimate is accurate.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 8. Why Choose D.G.Yard */}
        <section ref={whyChooseRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Why Choose D.G.Yard
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {whyChoosePoints.map((point, index) => {
                const IconComponent = point.icon;
                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="text-center bg-gray-50 rounded-xl p-8 border-2 border-gray-200 hover:border-gray-900 transition-all"
                  >
                    <IconComponent className="w-12 h-12 text-gray-900 mx-auto mb-4" />
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 font-serif text-sm">
                      {point.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 9. Customer Testimonials */}
        <section className="py-16 md:py-20 bg-gray-50">
          <Testimonials 
            customHeading="Customer Testimonials"
            customSubtitle="Real experiences from people who trust D.G.Yard"
          />
        </section>

        {/* 10. Final Call to Action */}
        <section ref={ctaRef} className="py-16 md:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
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
                className="inline-block mb-6"
              >
                <Sparkles className="w-12 h-12 text-yellow-400" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                Get Your Estimate →
              </h2>
              <p className="text-lg text-gray-200 font-serif mb-8">
                Want to talk directly?
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="tel:+91XXXXXXXXXX" className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Call Us
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Link href="https://wa.me/91XXXXXXXXXX" target="_blank" className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </Link>
                </Button>
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  variant="outline"
                  className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-serif font-bold"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Ask Honey
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

