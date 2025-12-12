"use client";

import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Brain, 
  MessageCircle, 
  Mic, 
  Zap, 
  Globe,
  Shield,
  ArrowRight,
  Bot,
  Network,
  Video,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { HoneyIcon } from "@/components/ai-assistant/honey-icon";

const features = [
  {
    icon: Brain,
    title: "CCTV Quotation & Product Selection",
    description: "Get instant CCTV quotations in 2 minutes. Honey helps you choose the right cameras, DVR/NVR, storage, and accessories based on your space and budget. Perfect for homes, offices, shops, and industries.",
    color: "from-purple-400 to-pink-400",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    icon: Network,
    title: "Networking & IT Solutions",
    description: "Need Wi-Fi planning? Network design? Honey creates custom network diagrams, suggests routers, switches, access points, and cabling solutions. Get professional network layouts for your home or office.",
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing Audit & Strategy",
    description: "Get a free marketing audit! Honey analyzes your website, GMB, social media, and provides a 30-day marketing strategy. Includes competitor analysis, ad targeting suggestions, and brand voice recommendations.",
    color: "from-yellow-400 to-orange-400",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
  },
  {
    icon: Video,
    title: "AV, Fire Safety & Smart Infrastructure",
    description: "Planning a projector setup? Fire safety system? Smart home automation? Honey recommends projectors, screens, sprinkler systems, boom barriers, and automation solutions tailored to your needs.",
    color: "from-green-400 to-emerald-400",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
  },
  {
    icon: MessageCircle,
    title: "24/7 Support in English & Hindi",
    description: "Ask questions anytime, anywhere. Honey speaks both English and Hindi, supports voice and text input, and provides instant answers about products, pricing, installation, and troubleshooting.",
    color: "from-indigo-400 to-blue-400",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconColor: "text-indigo-600",
  },
  {
    icon: Zap,
    title: "Service Booking & Troubleshooting",
    description: "Book installation services, track orders, and get instant troubleshooting help. Honey guides you through technical issues step-by-step and connects you with D.G.Yard experts when needed.",
    color: "from-red-400 to-pink-400",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
  },
];

export function MeetHoney() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleOpenChat = () => {
    // Dispatch event to open Honey chatbot
    const event = new CustomEvent("openHoneyChat");
    window.dispatchEvent(event);
  };

  return (
    <section ref={ref} className="relative py-20 md:py-28 bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden">
      {/* Animated AI Background */}
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
            className="absolute inset-0 w-full h-full opacity-[0.03]"
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
                opacity: [0.03, 0.06, 0.03],
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
            className="absolute inset-0 w-full h-full opacity-[0.03]"
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
                opacity: [0.03, 0.06, 0.03],
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

        {/* Floating AI Nodes */}
        {[...Array(10)].map((_, i) => {
          const positions = [
            { x: '10%', y: '15%' },
            { x: '30%', y: '20%' },
            { x: '55%', y: '18%' },
            { x: '80%', y: '22%' },
            { x: '15%', y: '60%' },
            { x: '45%', y: '65%' },
            { x: '70%', y: '62%' },
            { x: '90%', y: '68%' },
            { x: '25%', y: '85%' },
            { x: '60%', y: '88%' },
          ];
          const pos = positions[i] || positions[0];
          
          return (
            <motion.div
              key={`node-${i}`}
              className="absolute w-2 h-2 rounded-full bg-blue-400/20"
              style={{
                left: pos.x,
                top: pos.y,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
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
                className="absolute inset-0 rounded-full bg-blue-400/10 blur-md"
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.1, 0.3, 0.1],
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
          { from: { x: '10%', y: '15%' }, to: { x: '30%', y: '20%' } },
          { from: { x: '55%', y: '18%' }, to: { x: '80%', y: '22%' } },
          { from: { x: '15%', y: '60%' }, to: { x: '45%', y: '65%' } },
          { from: { x: '70%', y: '62%' }, to: { x: '90%', y: '68%' } },
        ].map((connection, i) => (
          <motion.svg
            key={`connection-${i}`}
            className="absolute inset-0 w-full h-full opacity-[0.02]"
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
                opacity: [0.02, 0.04, 0.02],
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
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-blue-400/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: ['0%', '-100%'],
              x: [0, Math.sin(i) * 30],
              opacity: [0, 0.4, 0],
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

        {/* Hexagonal Pattern Overlay */}
        <motion.div
          className="absolute inset-0 opacity-[0.015]"
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

        {/* Subtle Gradient Orbs */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Decorative Bot Icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="absolute top-20 right-20 opacity-[0.03] hidden lg:block"
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
          <Bot className="w-40 h-40 text-gray-800" />
        </motion.div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 md:mb-20"
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
                AI-Powered Assistant
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
              <span className="relative z-10">Meet Honey</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
              />
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
                Your AI Assistant
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
              className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-serif mb-12 leading-relaxed"
            >
              Meet Honey — your AI assistant who's here 24/7 to help with everything from CCTV quotations and networking design to free marketing audits and smart home planning. Whether you're choosing products, troubleshooting issues, or planning a complete solution, Honey speaks your language (English or Hindi) and makes technology feel simple.
            </motion.p>
          </motion.div>

          {/* Main Content - Classical Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            {/* Left: Honey Icon with Animation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start"
            >
              <div className="relative">
                {/* Large Honey Icon */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="w-64 h-64 md:w-80 md:h-80 relative">
                    <HoneyIcon className="w-full h-full" />
                  </div>
                  
                  {/* Floating Sparkles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={inView ? { opacity: [0, 1, 0], scale: [0, 1, 0] } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                      }}
                      className="absolute"
                      style={{
                        top: `${20 + i * 15}%`,
                        left: `${10 + i * 12}%`,
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Chat with Honey Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center lg:text-left"
                >
                  <Button
                    onClick={handleOpenChat}
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white font-serif font-bold text-lg px-8 py-6 rounded-md shadow-lg hover:shadow-xl transition-all group border-2 border-gray-900 hover:border-gray-800"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat with Honey
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Features List - Classical Style */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-6"
            >
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 30 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    className="group relative pl-4 border-l-4 border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                        className={`w-12 h-12 rounded-lg ${feature.bgColor} border-2 ${feature.borderColor} flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-all duration-300`}
                      >
                        {IconComponent && <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed font-serif text-sm md:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Bottom Features - Classical Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12 border-t-2 border-gray-200"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-300 mb-4"
              >
                <Globe className="w-8 h-8 text-blue-600" />
              </motion.div>
              <h4 className="font-serif font-bold text-gray-900 mb-2 text-lg">
                Multi-Language
              </h4>
              <p className="text-gray-600 font-serif text-sm">
                English & Hindi support for seamless communication
              </p>
            </div>

            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-300 mb-4"
              >
                <Shield className="w-8 h-8 text-purple-600" />
              </motion.div>
              <h4 className="font-serif font-bold text-gray-900 mb-2 text-lg">
                Always Learning
              </h4>
              <p className="text-gray-600 font-serif text-sm">
                Gets smarter with every conversation
              </p>
            </div>

            <div className="text-center">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 mb-4"
              >
                <Zap className="w-8 h-8 text-green-600" />
              </motion.div>
              <h4 className="font-serif font-bold text-gray-900 mb-2 text-lg">
                Instant Help
              </h4>
              <p className="text-gray-600 font-serif text-sm">
                Quick responses for all your queries
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

