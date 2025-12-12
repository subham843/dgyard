"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, TrendingUp, Network, Shield, Sparkles, Bot, Video } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const services = [
  {
    icon: Camera,
    title: "Security & Surveillance",
    description: "CCTV, access control & monitoring",
    href: "/services/security-surveillance",
    color: "blue",
  },
  {
    icon: Network,
    title: "Networking & IT",
    description: "Wi-Fi, LAN, enterprise solutions",
    href: "/services/networking-it",
    color: "purple",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    description: "Branding, ads & software",
    href: "/services/digital-marketing",
    color: "orange",
  },
  {
    icon: Video,
    title: "AV, Fire & Smart",
    description: "Audio-visual, safety & automation",
    href: "/services/av-fire-infrastructure",
    color: "green",
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    hover: "hover:bg-blue-600",
    border: "border-blue-400",
    text: "text-blue-600",
    light: "bg-blue-50",
    icon: "text-blue-500",
  },
  purple: {
    bg: "bg-purple-500",
    hover: "hover:bg-purple-600",
    border: "border-purple-400",
    text: "text-purple-600",
    light: "bg-purple-50",
    icon: "text-purple-500",
  },
  orange: {
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600",
    border: "border-orange-400",
    text: "text-orange-600",
    light: "bg-orange-50",
    icon: "text-orange-500",
  },
  green: {
    bg: "bg-green-500",
    hover: "hover:bg-green-600",
    border: "border-green-400",
    text: "text-green-600",
    light: "bg-green-50",
    icon: "text-green-500",
  },
};

// Animated Technical Web Background
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated Grid Pattern */}
    <motion.div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(to right, #4a5568 1px, transparent 1px), linear-gradient(to bottom, #4a5568 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
      animate={{
        backgroundPosition: ['0px 0px', '60px 60px'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    />

    {/* Circuit Lines - Horizontal */}
    {[...Array(4)].map((_, i) => (
      <motion.svg
        key={`circuit-h-${i}`}
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        style={{ zIndex: 0 }}
      >
        <motion.path
          d={`M 0 ${20 + i * 25}% L 100% ${20 + i * 25}%`}
          stroke="#4a5568"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="10 5"
          animate={{
            strokeDashoffset: [0, -15],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
        />
      </motion.svg>
    ))}

    {/* Circuit Lines - Vertical */}
    {[...Array(3)].map((_, i) => (
      <motion.svg
        key={`circuit-v-${i}`}
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        style={{ zIndex: 0 }}
      >
        <motion.path
          d={`M ${25 + i * 25}% 0 L ${25 + i * 25}% 100%`}
          stroke="#4a5568"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="10 5"
          animate={{
            strokeDashoffset: [0, -15],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.7,
          }}
        />
      </motion.svg>
    ))}

    {/* Floating Tech Nodes */}
    {[...Array(8)].map((_, i) => {
      const positions = [
        { x: '15%', y: '20%' },
        { x: '35%', y: '15%' },
        { x: '65%', y: '25%' },
        { x: '85%', y: '20%' },
        { x: '20%', y: '70%' },
        { x: '50%', y: '75%' },
        { x: '75%', y: '70%' },
        { x: '90%', y: '80%' },
      ];
      const pos = positions[i] || positions[0];
      
      return (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 rounded-full bg-blue-400/30"
          style={{
            left: pos.x,
            top: pos.y,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            y: [0, -15, 0],
            x: [0, Math.sin(i) * 10, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        >
          {/* Node Glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400/20 blur-md"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      );
    })}

    {/* Connection Lines Between Nodes */}
    {[
      { from: { x: '15%', y: '20%' }, to: { x: '35%', y: '15%' } },
      { from: { x: '65%', y: '25%' }, to: { x: '85%', y: '20%' } },
      { from: { x: '20%', y: '70%' }, to: { x: '50%', y: '75%' } },
      { from: { x: '75%', y: '70%' }, to: { x: '90%', y: '80%' } },
    ].map((connection, i) => (
      <motion.svg
        key={`connection-${i}`}
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        style={{ zIndex: 0 }}
      >
        <motion.line
          x1={connection.from.x}
          y1={connection.from.y}
          x2={connection.to.x}
          y2={connection.to.y}
          stroke="#4a5568"
          strokeWidth="1"
          strokeDasharray="5 5"
          animate={{
            strokeDashoffset: [0, -10],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 2 + i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.4,
          }}
        />
      </motion.svg>
    ))}

    {/* Data Flow Particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute w-1 h-1 rounded-full bg-blue-400/40"
        style={{
          left: `${10 + i * 15}%`,
          top: `${30 + (i % 2) * 40}%`,
        }}
        animate={{
          y: ['0%', '-100%'],
          x: [0, Math.sin(i) * 30],
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeOut",
          delay: i * 0.8,
        }}
      />
    ))}

    {/* Subtle Gradient Overlays */}
    <motion.div
      className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-100/20 to-transparent"
      animate={{
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-purple-100/20 to-transparent"
      animate={{
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
    />

    {/* Hexagonal Pattern Overlay */}
    <motion.div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a5568' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
      animate={{
        backgroundPosition: ['0px 0px', '60px 60px'],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AnimatedBackground />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-8 sm:pt-24 sm:pb-12 md:pt-28 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-3 sm:space-y-4 md:space-y-6 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 border-2 border-gray-300 shadow-sm"
              >
                <Shield className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-serif font-semibold text-gray-800">
                  Trusted Since 2010
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight"
              >
                <span className="relative inline-block">
                  <span className="relative z-10">Digital</span>
                  <motion.span
                    className="absolute bottom-1 left-0 right-0 h-2 bg-gray-200 -z-0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  />
                </span>
                {" | "}
                <span className="relative inline-block">
                  <span className="relative z-10">Secure</span>
                  <motion.span
                    className="absolute bottom-1 left-0 right-0 h-2 bg-gray-200 -z-0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  />
                </span>
                {" | "}
                <span className="relative inline-block">
                  <span className="relative z-10">Smart Living</span>
                  <motion.span
                    className="absolute bottom-1 left-0 right-0 h-2 bg-gray-200 -z-0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                  />
                </span>
              </motion.h1>

              {/* AI-Powered Services Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
              >
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-serif font-semibold text-blue-700">
                  AI-Powered Services
                </span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-sm sm:text-base md:text-lg text-gray-600 font-serif max-w-2xl mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0"
              >
                End-to-end solutions for CCTV, networking, digital marketing, AV, fire safety and automation — enhanced with AI-powered assistance from Honey
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 justify-center lg:justify-start px-2 sm:px-0"
              >
                <Button
                  asChild
                  size="lg"
                  className="text-sm md:text-base px-6 md:px-8 py-5 md:py-6 bg-gray-900 hover:bg-gray-800 text-white font-serif font-semibold shadow-lg hover:shadow-xl border-2 border-gray-900 hover:border-gray-800 rounded-md transition-all w-full sm:w-auto group"
                >
                  <Link href="/shop" className="flex items-center justify-center gap-2">
                    Shop Products
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-sm md:text-base px-6 md:px-8 py-5 md:py-6 border-2 border-gray-400 hover:border-gray-600 hover:text-gray-900 hover:bg-gray-100 font-serif rounded-md transition-all w-full sm:w-auto bg-white"
                >
                  <Link href="/quotation" className="flex items-center justify-center">
                    Get Estimate
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Content - Service Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 gap-3 md:gap-4 mt-8 lg:mt-0"
            >
              {services.map((service, index) => {
                const Icon = service.icon;
                const colors = colorClasses[service.color as keyof typeof colorClasses] || colorClasses.blue;
                
                return (
                  <Link key={service.title} href={service.href}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.4 + index * 0.1,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      whileHover={{
                        scale: 1.05,
                        y: -8,
                        transition: { duration: 0.3 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Hover Gradient Background */}
                      <motion.div
                        className={`absolute inset-0 ${colors.light} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />

                      {/* Content */}
                      <div className="relative z-10 flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        {/* Icon */}
                        <motion.div
                          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl ${colors.bg} ${colors.hover} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                          whileHover={{
                            rotate: [0, -5, 5, 0],
                            scale: 1.1,
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                        </motion.div>

                        {/* Text */}
                        <div className="space-y-1">
                          <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 group-hover:text-gray-900 transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                            {service.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                          className="mt-1"
                          animate={{
                            x: [0, 4, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.2,
                          }}
                        >
                          <ArrowRight className={`w-4 h-4 md:w-5 md:h-5 ${colors.icon} group-hover:translate-x-1 transition-transform`} />
                        </motion.div>
                      </div>

                      {/* Decorative Corner */}
                      <div className={`absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 ${colors.light} opacity-0 group-hover:opacity-50 rounded-bl-full transition-opacity duration-300`} />
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </div>

          {/* Stats Section - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 md:pt-8 border-t-2 border-gray-200 px-2 sm:px-0"
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 text-center">
              {[
                { value: "10K+", label: "Clients" },
                { value: "50K+", label: "Projects" },
                { value: "15+", label: "Years" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 font-serif">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
