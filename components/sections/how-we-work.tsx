"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Ear, Lightbulb, Settings, CheckCircle2, Shield, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Ear,
    title: "We Understand You",
    subtitle: "Every project starts with listening.",
    description: "Your space, your goals, your budget — we make sure we fully understand what matters.",
    hindiText: "Kyuki aapki need, aapki tarah hi unique hoti hai.",
    color: "from-blue-50 to-blue-100",
    iconColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    icon: Lightbulb,
    title: "We Suggest What's Right",
    subtitle: "No extra push, no confusion.",
    description: "Whether it's CCTV, networking, or a marketing plan — we recommend what truly works for you and fits long-term use.",
    hindiText: "Kyuki sahi solution wahi hota hai jo kaam aaye, time bachaye, aur budget me bhi fit baithe jaye.",
    color: "from-purple-50 to-purple-100",
    iconColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    icon: Settings,
    title: "We Set It Up the Right Way",
    subtitle: "Professional execution.",
    description: "CCTV gets clean wiring, networking gets stable connectivity, and digital marketing gets clear, thoughtful execution.",
    hindiText: "Kyuki final result bas ek hona chahiye — everything works, simply and clearly.",
    color: "from-green-50 to-green-100",
    iconColor: "text-green-700",
    borderColor: "border-green-200",
  },
];

export function HowWeWork() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Classical Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, #111827 1px, transparent 1px), linear-gradient(to bottom, #111827 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
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
              How We Work
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
            <span className="relative z-10">A Simple</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-2 left-0 right-0 h-3 bg-gray-200 -z-0"
            />
            <br />
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-gray-700 italic relative">
              Clear Process
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
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 font-serif"
          >
            A simple, clear process that puts you first
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`relative bg-white/80 backdrop-blur-md rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 border-2 ${step.borderColor} shadow-lg hover:shadow-xl transition-all duration-300`}
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${step.color.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : step.color.includes('purple') ? 'rgba(147, 51, 234, 0.1)' : 'rgba(34, 197, 94, 0.1)'} 100%)`,
                }}
              >
                {/* Step Number - Classical Style - Smaller on Mobile */}
                <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gray-900 text-white rounded-full flex items-center justify-center border-2 md:border-4 border-white shadow-lg">
                  <span className="text-base md:text-lg lg:text-xl font-serif font-bold">{index + 1}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                  {/* Icon - Smaller on Mobile */}
                  <motion.div
                    className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/90 backdrop-blur-sm rounded-lg md:rounded-xl flex items-center justify-center border-2 ${step.borderColor} flex-shrink-0 shadow-md`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 ${step.iconColor}`} />
                  </motion.div>

                  {/* Content - Compact on Mobile */}
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-gray-900 mb-1 md:mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base lg:text-lg text-gray-700 font-serif italic mb-2 md:mb-3">
                        {step.subtitle}
                      </p>
                    </div>

                    <p className="text-sm md:text-base lg:text-lg text-gray-700 font-serif leading-relaxed">
                      {step.description}
                    </p>

                    {/* Hindi Text - Highlighted - Glass Effect */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5 + index * 0.2, duration: 0.6 }}
                      className="bg-white/70 backdrop-blur-md rounded-lg p-3 md:p-4 border-2 border-gray-200/50 mt-3 md:mt-4 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <p className="text-sm md:text-base lg:text-lg text-gray-800 font-serif italic">
                          {step.hindiText}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Decorative Line - Classical - Hidden on Mobile */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={inView ? { scaleX: 1 } : {}}
                    transition={{ delay: 0.8 + index * 0.2, duration: 0.6 }}
                    className="hidden md:block absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-1 h-12 bg-gray-300"
                  >
                    <motion.div
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1 + index * 0.2,
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

