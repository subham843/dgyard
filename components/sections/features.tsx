"use client";

import { 
  Heart, 
  Sparkles, 
  Zap, 
  Rocket, 
  Shield, 
  Layers,
  CheckCircle2,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const features = [
  {
    icon: Heart,
    emoji: "1️⃣",
    title: "We Tell You What You Actually Need",
    description: "No pushing unnecessary products. Just honest advice that makes sense.",
    subDescription: "We've seen too many people get sold things they don't need. That's not how we work. We listen to your situation, understand what you're trying to achieve, and recommend only what will genuinely help you. No upselling, no confusion — just straightforward guidance you can trust.",
    color: "from-red-400 to-pink-400",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
  },
  {
    icon: Sparkles,
    emoji: "2️⃣",
    title: "Work That Looks Good and Works Even Better",
    description: "We care about how things look, not just how they function.",
    subDescription: "When we install your CCTV cameras or set up your network, we make sure the wiring is neat, everything is organized, and it actually looks professional. Because your space matters to you, and it should matter to us too. Clean installation means less maintenance, fewer problems, and something you can be proud of.",
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    icon: Zap,
    emoji: "3️⃣",
    title: "Honey — Your AI Assistant Who Actually Helps",
    description: "Get instant answers and smart recommendations, anytime you need them.",
    subDescription: "Meet Honey, our AI assistant who's here 24/7 to help you choose the right products, answer technical questions, and guide you through decisions. Whether you're wondering which camera works best for your space or need help with a networking setup, Honey makes technology feel less overwhelming and more approachable.",
    color: "from-yellow-400 to-orange-400",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
  },
  {
    icon: Rocket,
    emoji: "4️⃣",
    title: "Quick Quotations, Faster Service",
    description: "Get your CCTV quote in 2 minutes. Book services without the hassle.",
    subDescription: "We know your time is valuable. That's why we've made getting a quotation as simple as answering a few questions — you'll have a detailed estimate in minutes, not days. And when you're ready to book, the process is straightforward. No long forms, no back-and-forth calls — just simple, fast service that respects your schedule.",
    color: "from-purple-400 to-indigo-400",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    icon: Shield,
    emoji: "5️⃣",
    title: "Solutions Built to Last",
    description: "We think long-term, so you don't have to worry about tomorrow.",
    subDescription: "Your CCTV system should still be working perfectly years from now. Your network should handle growth without breaking down. Your digital marketing should keep delivering results. We build with durability and reliability in mind, because we know you're investing in something that needs to work consistently, not just today.",
    color: "from-green-400 to-emerald-400",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
  },
  {
    icon: Layers,
    emoji: "6️⃣",
    title: "One Team, Every Tech Need Covered",
    description: "Security, networking, marketing, automation — we handle it all.",
    subDescription: "Instead of juggling multiple vendors for CCTV, Wi-Fi, digital marketing, and automation, you get one team that understands how everything connects. We see the bigger picture, so your security system talks to your network, your marketing aligns with your brand, and your smart home actually makes life easier. It's all connected, and so are we.",
    color: "from-indigo-400 to-blue-400",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconColor: "text-indigo-600",
  },
];

export function Features() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="relative py-20 md:py-24 bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #111827 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
        className="absolute top-20 right-10 opacity-[0.03] hidden lg:block"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Star className="w-40 h-40 text-gray-800" />
        </motion.div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
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
              Why Choose Us
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
            <span className="relative z-10">Why Choose</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              D.G.Yard?
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
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-serif leading-relaxed"
          >
            We're not just another tech company. We're a team that understands your space matters, your time is valuable, and your peace of mind is everything. Here's why thousands of homes, offices, and businesses trust us with their most important tech needs.
          </motion.p>
        </motion.div>

        {/* Features Grid - Modern Classical Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="group relative"
              >
                {/* Feature Content - Enhanced Classical Style */}
                <div className="relative h-full flex flex-col pl-6 border-l-4 border-gray-200 hover:border-gray-400 transition-all duration-300 group-hover:pl-8">
                  {/* Icon Section */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="mb-6"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3,
                      }}
                      className={`w-16 h-16 rounded-xl ${feature.bgColor} border-2 ${feature.borderColor} flex items-center justify-center group-hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                    >
                      {/* Gradient Background on Hover */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                      />
                      {Icon && (
                        <Icon className={`w-8 h-8 ${feature.iconColor} relative z-10 group-hover:scale-110 transition-transform`} />
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors leading-tight"
                  >
                    {feature.title}
                  </motion.h3>

                  {/* Main Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.75 + index * 0.1 }}
                    className="text-gray-700 font-semibold mb-4 font-serif text-base leading-relaxed"
                  >
                    {feature.description}
                  </motion.p>

                  {/* Sub Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-gray-600 leading-relaxed font-serif text-sm flex-1 mb-6"
                  >
                    {feature.subDescription}
                  </motion.p>

                  {/* Decorative Checkmark */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.85 + index * 0.1 }}
                    className="pt-5 border-t-2 border-gray-200 group-hover:border-gray-300 transition-colors flex items-center gap-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle2 className={`w-6 h-6 ${feature.iconColor}`} />
                    </motion.div>
                    <span className="text-sm font-serif font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      Trusted & Reliable
                    </span>
                  </motion.div>

                  {/* Hover Accent Line */}
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: 1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
