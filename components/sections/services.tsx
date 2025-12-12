"use client";

import { Button } from "@/components/ui/button";
import { Camera, Network, TrendingUp, Factory, Phone, Calendar, ArrowRight, Shield, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";

const services = [
  {
    icon: Camera,
    title: "Security & Surveillance Solutions",
    subtitle: "Peace of mind, made simple",
    description: "We understand that security isn't just about cameras — it's about feeling safe in your space. From homes to offices to industries, we design surveillance systems that work quietly in the background, giving you the confidence that what matters is protected.",
    features: [
      "CCTV & IP camera systems with AI-powered detection",
      "Clean, professional installation that looks good",
      "Remote viewing on your phone, anytime, anywhere",
      "Access control systems for secure entry",
      "Multi-site monitoring for businesses",
      "Long-term support and maintenance"
    ],
    accent: "blue",
    buttonText: "Explore Security Solutions",
    href: "/services/security-surveillance",
  },
  {
    icon: Network,
    title: "Networking & IT Solutions",
    subtitle: "Connectivity that feels effortless",
    description: "In today's world, a slow or unreliable network isn't just frustrating — it costs time and opportunities. We build networks that you can forget about because they just work. Whether it's your home Wi-Fi or an entire office campus, we make connectivity seamless.",
    features: [
      "Wi-Fi planning that eliminates dead zones",
      "Structured cabling that stays organized for years",
      "Enterprise networking for offices and institutions",
      "IT devices: laptops, desktops, monitors, displays",
      "Classroom and institutional IT setups",
      "Server room design and management"
    ],
    accent: "purple",
    buttonText: "View Networking Services",
    href: "/services/networking-it",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing, Branding & Software Development",
    subtitle: "Your story, told beautifully",
    description: "Every business has a story worth telling. We help you tell it in ways that connect with people — through smart marketing, authentic branding, and technology that makes your work easier. Whether you're a startup or an established brand, we're here to help you grow.",
    features: [
      "Digital marketing: social media, Google ads, SEO",
      "Brand identity: logos, messaging, visual design",
      "Political campaigning & PR strategies",
      "Custom software: websites, apps, business tools",
      "E-commerce solutions that actually sell",
      "AI-powered tools for smarter business decisions"
    ],
    accent: "orange",
    buttonText: "Discover Marketing Services",
    href: "/services/digital-marketing",
  },
  {
    icon: Factory,
    title: "AV, Fire Safety & Smart Infrastructure",
    subtitle: "Spaces that think, protect, and inspire",
    description: "Modern spaces need to do more than just exist — they need to communicate clearly, keep people safe, and make daily life easier. From auditoriums to classrooms to smart homes, we create environments that respond to human needs.",
    features: [
      "Audio-visual systems: projectors, screens, PA systems",
      "Fire safety: sprinklers, hydrants, compliance support",
      "Smart infrastructure: barriers, traffic solutions, displays",
      "Home & office automation: Alexa, Google, IoT devices",
      "Meeting room automation for seamless collaboration",
      "Complete solutions for schools, corporates, and institutions"
    ],
    accent: "green",
    buttonText: "Learn About AV & Smart Solutions",
    href: "/services/av-fire-infrastructure",
  },
];

export function Services() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="relative py-20 md:py-28 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
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
        className="absolute top-20 right-20 opacity-[0.05] hidden lg:block"
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
          <Network className="w-40 h-40 text-gray-800" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-20 left-20 opacity-[0.05] hidden lg:block"
      >
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Camera className="w-32 h-32 text-gray-800" />
        </motion.div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section - Classical Creative */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Badge - Animated */}
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
              Professional Services
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

          {/* Main Heading - Creative Typography */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-gray-900 mb-6 relative inline-block"
          >
            <span className="relative z-10">Solutions That</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-gray-700 italic relative">
              Understand You
              <motion.span
                initial={{ width: 0 }}
                animate={inView ? { width: "100%" } : {}}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-0 left-0 h-0.5 bg-gray-400"
              />
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 font-serif italic"
          >
            From security to connectivity, from branding to automation — we build solutions that fit your life, not the other way around.
          </motion.p>
        </motion.div>

        {/* AI Helper */}
        <div className="max-w-4xl mx-auto mb-12">
          <InlineAIHelper
            context="selecting services"
            suggestions={[
              "What services do you offer?",
              "How to book installation service?",
              "What's included in maintenance?",
              "Help me choose the right service"
            ]}
            position="top"
          />
        </div>

        {/* Services Grid - Unique Classical Animated Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            const accentColors = {
              blue: {
                bg: "bg-blue-50",
                border: "border-blue-200",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-700",
                hoverBorder: "hover:border-blue-400",
                dot: "bg-blue-500",
                accent: "bg-blue-500",
              },
              purple: {
                bg: "bg-purple-50",
                border: "border-purple-200",
                iconBg: "bg-purple-100",
                iconColor: "text-purple-700",
                hoverBorder: "hover:border-purple-400",
                dot: "bg-purple-500",
                accent: "bg-purple-500",
              },
              orange: {
                bg: "bg-orange-50",
                border: "border-orange-200",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-700",
                hoverBorder: "hover:border-orange-400",
                dot: "bg-orange-500",
                accent: "bg-orange-500",
              },
              green: {
                bg: "bg-green-50",
                border: "border-green-200",
                iconBg: "bg-green-100",
                iconColor: "text-green-700",
                hoverBorder: "hover:border-green-400",
                dot: "bg-green-500",
                accent: "bg-green-500",
              },
            };
            const colors = accentColors[service.accent as keyof typeof accentColors];

            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.5 + index * 0.15 }}
                className="group relative"
              >
                {/* Unique Classical Card */}
                <div className={`relative bg-white rounded-xl overflow-hidden border-2 ${colors.border} ${colors.hoverBorder} shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col hover:-translate-y-2`}>
                  {/* Animated Top Accent Bar */}
                  <div className={`h-3 ${colors.bg} relative overflow-hidden`}>
                    <motion.div
                      className={`absolute inset-0 ${colors.accent} opacity-20`}
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        delay: index * 0.5,
                      }}
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                    {/* Icon Section - Eye Catching */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        {/* Icon Badge */}
                        <motion.div
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1],
                          }}
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0], 
                            scale: 1.15,
                            transition: { duration: 0.5 }
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                          className={`w-16 h-16 md:w-20 md:h-20 rounded-xl ${colors.iconBg} border-2 ${colors.border} flex items-center justify-center relative`}
                        >
                          <Icon className={`w-8 h-8 md:w-10 md:h-10 ${colors.iconColor}`} />
                          {/* Animated Corner Badge */}
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={inView ? { scale: 1, rotate: 0 } : {}}
                            transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                            className={`absolute -top-2 -right-2 w-6 h-6 ${colors.bg} border-2 ${colors.border} rounded-full flex items-center justify-center`}
                          >
                            <CheckCircle2 className={`w-3 h-3 ${colors.iconColor}`} />
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Title Section */}
                    <h3 className={`text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2 group-hover:${colors.iconColor} transition-colors relative`}>
                      {service.title}
                    </h3>

                    {/* Subtitle */}
                    <p className={`text-base md:text-lg font-serif font-medium ${colors.iconColor} mb-4 italic`}>
                      {service.subtitle}
                    </p>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed font-serif flex-1 text-sm md:text-base">
                      {service.description}
                    </p>

                    {/* Features List - Animated */}
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, idx) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={inView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.9 + index * 0.15 + idx * 0.1 }}
                          className="flex items-start gap-3 text-sm text-gray-700 font-serif group/item"
                        >
                          <motion.div
                            whileHover={{ scale: 1.3, rotate: 180 }}
                            className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0 mt-2 relative`}
                          >
                            <motion.div
                              className={`absolute inset-0 ${colors.dot} rounded-full`}
                              animate={{
                                scale: [1, 2, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.3,
                              }}
                            />
                          </motion.div>
                          <span className="group-hover/item:translate-x-1 transition-transform flex-1">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* CTA Button - Animated */}
                    <div className="relative overflow-hidden rounded-md">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          asChild
                          size="lg"
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-serif font-semibold shadow-md hover:shadow-lg border-2 border-gray-900 hover:border-gray-800 rounded-md transition-all py-6 relative z-10 group/btn"
                        >
                          <Link href={service.href || "/services"} className="flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {service.buttonText || "Get Started"}
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Creative Corner Accent - Animated */}
                  <motion.div
                    className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} opacity-0 group-hover:opacity-20 transition-opacity rounded-bl-full -mr-16 -mt-16`}
                    animate={{
                      rotate: [0, 90, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Decorative Border on Hover */}
                  <div className={`absolute inset-0 border-2 ${colors.border} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  
                  {/* Subtle Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity blur-2xl pointer-events-none`}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA - Classical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 text-center"
        >
          <div className="relative overflow-hidden rounded-md inline-block">
            <motion.div
              className="absolute inset-0 bg-gray-50 pointer-events-none"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-gray-400 hover:border-gray-600 hover:text-gray-900 hover:bg-gray-100 font-serif rounded-md transition-all bg-white relative z-10 group/cta"
              >
                <Link href="/solutions" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Need Custom Solution? Contact Us
                  <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
