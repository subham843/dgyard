"use client";

import { Button } from "@/components/ui/button";
import { Camera, Network, TrendingUp, Factory, ArrowRight, Bot, CheckCircle2, Home, Shield, Sparkles, Zap, Clock, Video, Flame, Wrench, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const solutions = [
  {
    icon: Camera,
    title: "Security & Surveillance Solutions",
    subtitle: "Smarter security for homes, offices & industries.",
    description: "Complete CCTV and surveillance systems with AI-enabled features, clean installation, and professional support.",
    features: [
      "CCTV & IP Camera Systems",
      "Clean, structured installation",
      "NVR, storage & network planning",
      "Smart alerts, remote access, mobile viewing",
      "Human, vehicle & motion detection (AI-enabled)",
      "Access control integration",
      "Perimeter & entry surveillance",
      "Multi-site monitoring solutions"
    ],
    perfectFor: "Homes, shops, schools, offices, factories.",
    accent: "blue",
  },
  {
    icon: Network,
    title: "Networking & IT Solutions",
    subtitle: "Fast, stable, organized connectivity for any space.",
    description: "Complete networking infrastructure from Wi-Fi planning to enterprise setups, designed for reliability and performance.",
    features: [
      "Wi-Fi planning & optimization",
      "Structured cabling (Cat6/Cat7/Fiber)",
      "Router, switch & rack setup",
      "LAN/Fiber network design",
      "Enterprise & campus networking",
      "Server room setup",
      "IT devices: laptops, desktops, monitors, LEDs",
      "Classroom & institutional IT setups"
    ],
    perfectFor: "Offices, institutions, industries, co-working spaces.",
    accent: "purple",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing, Branding & Software Development",
    subtitle: "Grow your business online — with strategy, creativity & technology.",
    description: "End-to-end digital solutions from marketing to branding to custom software development.",
    sections: [
      {
        name: "Digital Marketing",
        items: [
          "Social Media Management",
          "Google & Meta Ads",
          "SEO & Local SEO",
          "Reputation & review management",
          "Content creation (graphics, reels, blogs)"
        ]
      },
      {
        name: "Branding",
        items: [
          "Brand identity & logo",
          "Messaging & positioning",
          "Creative design & storytelling"
        ]
      },
      {
        name: "Political Campaigning & PR",
        items: [
          "Campaign strategy",
          "Content & media communication",
          "Voter targeting & sentiment analysis",
          "Public image management"
        ]
      },
      {
        name: "Software & Development",
        items: [
          "Website development",
          "E-commerce solutions",
          "Mobile app development",
          "Custom web apps & admin dashboards",
          "AI-powered business tools",
          "CRM, automation systems"
        ]
      }
    ],
    perfectFor: "Businesses, brands, politicians, startups & agencies.",
    accent: "orange",
  },
  {
    icon: Video,
    title: "AV, Fire & Smart Infrastructure Solutions",
    subtitle: "Modern spaces built with safety, clarity and intelligence.",
    description: "Complete solutions for audio-visual systems, fire safety, smart infrastructure, and automation.",
    sections: [
      {
        name: "Audio-Visual Solutions",
        items: [
          "Projectors (Normal/Laser)",
          "Motorized screens",
          "Smart interactive boards",
          "PA sound systems",
          "Video conferencing systems",
          "Auditorium AV integration"
        ]
      },
      {
        name: "Fire Safety Solutions",
        items: [
          "Automatic fire sprinklers",
          "Fire hydrant systems",
          "Fire panels & accessories",
          "Compliance support"
        ]
      },
      {
        name: "Smart Infrastructure",
        items: [
          "Boom barriers",
          "Flap barriers & turnstiles",
          "Solar traffic blinkers",
          "Solar road studs",
          "Speed breakers",
          "Display boards, LED/LCD TVs"
        ]
      },
      {
        name: "Home & Office Automation (Alexa, Google, IoT)",
        items: [
          "Smart lighting automation",
          "Smart plugs & smart switch panels",
          "Fan/AC/TV automation",
          "Voice & app-controlled devices",
          "Routine automation",
          "Smart door locks & sensors",
          "Meeting room automation"
        ]
      }
    ],
    perfectFor: "Schools, corporates, homes, societies, industries & institutions.",
    accent: "green",
  },
];

const honeyCapabilities = [
  {
    icon: Camera,
    title: "Honey for Security",
    color: "blue",
    items: [
      "Suggest right camera models",
      "Calculate storage needs",
      "Design CCTV wiring map",
      "Detect layout blind spots",
      "Suggest NVR/hard disk sizes",
      "Generate quick quotes"
    ]
  },
  {
    icon: Network,
    title: "Honey for Networking",
    color: "red",
    items: [
      "Create network layout diagrams",
      "Suggest routers, switches, APs",
      "Recommend LAN vs Fiber",
      "Estimate cable length",
      "Solve Wi-Fi dead zone issues",
      "Troubleshoot connectivity"
    ]
  },
  {
    icon: TrendingUp,
    title: "Honey for Digital Marketing & Branding",
    color: "green",
    items: [
      "Website audit",
      "GMB audit",
      "Social media performance check",
      "Full 30-day marketing strategy",
      "Ad targeting suggestions",
      "Competitor analysis",
      "Brand voice recommendations",
      "Ends with: 'D.G.Yard experts can help implement this professionally.'"
    ]
  },
  {
    icon: Video,
    title: "Honey for AV Systems",
    color: "orange",
    items: [
      "Projector + screen size recommendations",
      "Speaker placement planning",
      "Conference room setup plan",
      "Classroom AV layout diagram"
    ]
  },
  {
    icon: Flame,
    title: "Honey for Fire Safety",
    color: "red",
    items: [
      "Sprinkler estimation",
      "Hydrant layout suggestions",
      "Compliance checklist",
      "Safety gap report"
    ]
  },
  {
    icon: Shield,
    title: "Honey for Smart Infrastructure",
    color: "yellow",
    items: [
      "Boom barrier placement",
      "Turnstile configuration",
      "Solar blinker & stud quantity planning"
    ]
  },
  {
    icon: Home,
    title: "Honey for Home & Office Automation",
    color: "purple",
    items: [
      "Smart lighting plan",
      "Alexa/Google automation routines",
      "Smart plug & switch recommendation",
      "Motion sensor & security suggestions",
      "Energy-saving automation tips"
    ]
  },
  {
    icon: Wrench,
    title: "Honey Troubleshooting Mode",
    color: "gray",
    items: [
      "CCTV not working",
      "Wi-Fi slow",
      "Projector dim",
      "Fire pump pressure low",
      "Alexa not connecting",
      "Honey gives quick fixes + suggests D.G.Yard service visit."
    ]
  },
];

const trustPoints = [
  {
    icon: CheckCircle2,
    title: "End-to-end solutions under one roof",
    description: "From cameras → networking → branding → AV → fire → automation → apps."
  },
  {
    icon: Bot,
    title: "AI + Human Expertise",
    description: "Honey helps plan, we execute professionally."
  },
  {
    icon: Sparkles,
    title: "Clean, professional installation",
    description: "Structured wiring, neat finish, organized systems."
  },
  {
    icon: Clock,
    title: "Long-term support",
    description: "Service visits, maintenance, troubleshooting."
  },
  {
    icon: Zap,
    title: "Modern, future-ready approach",
    description: "Automation, AI, digital transformation — everything in one place."
  },
];


export function ServicesPage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [honeyRef, honeyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [trustRef, trustInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const handleOpenHoneyChat = () => {
    const event = new CustomEvent("openHoneyChat");
    window.dispatchEvent(event);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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

      <div className="relative z-0">
        {/* 1. Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-20 md:py-28">
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
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-4"
              >
                SOLUTIONS — Everything You Need, One Smart Platform
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 }}
                className="text-sm md:text-base font-serif font-semibold text-gray-300 mb-6 tracking-wider uppercase"
              >
                digital | secure | smart living
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-gray-200 font-serif mb-6 max-w-3xl mx-auto"
              >
                Technology should make life easier — safer homes, smarter offices, better communication, and stronger digital presence.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.45 }}
                className="text-base md:text-lg text-gray-300 font-serif mb-4 max-w-3xl mx-auto"
              >
                D.G.Yard brings all these solutions together under one roof, powered by expert engineering, clean installation, and our AI assistant Honey.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="text-base md:text-lg text-gray-300 font-serif mb-8 max-w-3xl mx-auto"
              >
                Whether it's CCTV, networking, digital marketing, automation, AV systems, fire safety, or custom web/app development — you get end-to-end service that works seamlessly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-serif font-bold shadow-lg"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Ask Honey
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="#solutions" className="flex items-center gap-2">
                    Explore Services
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Link href="/services/book" className="flex items-center gap-2">
                    Book an Appointment
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 2. Solutions Ecosystem Header */}
        <section ref={introRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={introInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={introInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-12 h-12 text-yellow-500" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                OUR COMPLETE SOLUTIONS ECOSYSTEM
              </h2>
              <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed mb-4">
                We organize our services into four clear pillars — making it easy for customers to find exactly what they need.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 3. Solutions Pillars Section */}
        <section id="solutions" ref={servicesRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {solutions.map((solution, index) => {
                const IconComponent = solution.icon;
                const solutionNumber = index + 1;
                return (
                  <motion.div
                    key={solution.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-900 p-6 transition-all duration-500 shadow-lg hover:shadow-xl"
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-gray-700" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
                          {solution.title}
                        </h3>
                      </div>
                      <p className="text-base text-gray-600 font-serif mb-3">
                        {solution.subtitle}
                      </p>
                      <p className="text-sm text-gray-700 font-serif mb-4">
                        {solution.description}
                      </p>
                    </div>

                    {/* Features or Sections */}
                    {solution.features ? (
                      <div className="mb-6">
                        <ul className="space-y-2">
                          {solution.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700 font-serif">
                              <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : solution.sections ? (
                      <div className="space-y-6 mb-6">
                        {solution.sections.map((section, sectionIdx) => (
                          <div key={sectionIdx} className="border-l-4 border-gray-300 pl-4">
                            <h4 className="text-lg font-serif font-bold text-gray-900 mb-3">
                              {section.name}
                            </h4>
                            <ul className="space-y-2">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-2 text-gray-700 font-serif">
                                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Perfect For */}
                    {solution.perfectFor && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-serif font-semibold text-gray-900">
                          Perfect for: <span className="font-normal text-gray-600">{solution.perfectFor}</span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. AI-Powered Support — Meet Honey */}
        <section ref={honeyRef} className="relative py-20 md:py-24 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #111827 1px, transparent 0)`,
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Floating Honey Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={honeyInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1 }}
            className="absolute top-10 right-10 opacity-[0.05] hidden lg:block"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Bot className="w-40 h-40 text-gray-800" />
            </motion.div>
          </motion.div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={honeyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-6xl mx-auto"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={honeyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="text-center mb-12 md:mb-16"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={honeyInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 shadow-sm mb-6"
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
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                  </motion.div>
                  <span className="text-sm font-serif font-semibold text-yellow-800">
                    AI-Powered Assistant
                  </span>
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                  ⭐ AI-POWERED SUPPORT — MEET HONEY
                </h2>
                <p className="text-lg text-gray-700 font-serif mb-4 max-w-3xl mx-auto">
                  Your personal assistant for planning, auditing & decision-making.
                </p>
                <p className="text-gray-600 font-serif mb-2 max-w-3xl mx-auto">
                  Honey is our AI-powered assistant, built using OpenAI + Google Gemini APIs, designed to help customers make better, smarter, faster decisions.
                </p>
                <p className="text-gray-600 font-serif font-semibold max-w-3xl mx-auto">
                  Honey can assist across every service:
                </p>
              </motion.div>

              {/* Honey Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {honeyCapabilities.map((capability, index) => {
                  const IconComponent = capability.icon;
                  const getColorClasses = (color: string) => {
                    const colors: Record<string, { bg: string; border: string; iconBg: string; iconText: string; gradient: string }> = {
                      blue: { bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-600", gradient: "from-blue-400 to-cyan-400" },
                      red: { bg: "bg-red-50", border: "border-red-200", iconBg: "bg-red-100", iconText: "text-red-600", gradient: "from-red-400 to-pink-400" },
                      green: { bg: "bg-green-50", border: "border-green-200", iconBg: "bg-green-100", iconText: "text-green-600", gradient: "from-green-400 to-emerald-400" },
                      orange: { bg: "bg-orange-50", border: "border-orange-200", iconBg: "bg-orange-100", iconText: "text-orange-600", gradient: "from-yellow-400 to-orange-400" },
                      yellow: { bg: "bg-yellow-50", border: "border-yellow-200", iconBg: "bg-yellow-100", iconText: "text-yellow-600", gradient: "from-yellow-400 to-orange-400" },
                      purple: { bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-100", iconText: "text-purple-600", gradient: "from-purple-400 to-pink-400" },
                      gray: { bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600", gradient: "from-gray-400 to-gray-500" },
                    };
                    return colors[color] || colors.gray;
                  };
                  const colors = getColorClasses(capability.color);
                  return (
                    <motion.div
                      key={capability.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={honeyInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                      className="group relative"
                    >
                      {/* Feature Card */}
                      <div className={`relative ${colors.bg} rounded-xl overflow-hidden border-2 ${colors.border} hover:border-gray-400 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:-translate-y-1 p-5`}>
                        {/* Top Gradient Bar */}
                        <div className={`h-1 bg-gradient-to-r ${colors.gradient} relative overflow-hidden mb-4`}>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                            animate={{
                              x: ["-100%", "200%"],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                              delay: index * 0.2,
                            }}
                          />
                        </div>

                        {/* Icon */}
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                          className={`w-12 h-12 rounded-lg ${colors.iconBg} border-2 ${colors.border} flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all duration-300`}
                        >
                          <IconComponent className={`w-6 h-6 ${colors.iconText} group-hover:scale-110 transition-transform`} />
                        </motion.div>

                        {/* Title */}
                        <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                          {capability.title}
                        </h3>

                        {/* Items List */}
                        <ul className="space-y-2 flex-1">
                          {capability.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed font-serif">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Decorative Corner */}
                        <div className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-tl-full`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={honeyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.9 }}
                className="text-center"
              >
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-serif font-bold text-lg px-8 py-6 rounded-md shadow-lg hover:shadow-xl transition-all"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Ask Honey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 5. Why D.G.Yard — Our Advantage */}
        <section ref={trustRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={trustInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                ⭐ WHY D.G.YARD — OUR ADVANTAGE
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {trustPoints.map((point, index) => {
                const IconComponent = point.icon;
                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={trustInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg border-2 border-gray-200 p-6 hover:border-gray-900 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-gray-900 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
                          {point.title}
                        </h3>
                        <p className="text-gray-600 font-serif text-sm">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Final CTA Section */}
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
                ⭐ FINAL CTA
              </h2>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                Ready to Make Your Space Smarter, Safer & More Digital?
              </h3>
              <p className="text-lg text-gray-200 font-serif mb-8">
                Let Honey guide you — and let D.G.Yard build it for you.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-serif font-bold shadow-lg"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Ask Honey
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="#solutions" className="flex items-center gap-2">
                    Explore Services
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Link href="/services/book" className="flex items-center gap-2">
                    Book an Appointment
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

