"use client";

import { Button } from "@/components/ui/button";
import { 
  Video,
  Flame,
  Building2,
  Home,
  ArrowRight,
  Bot,
  CheckCircle2,
  HelpCircle,
  Phone,
  Sparkles,
  Projector,
  Screen,
  Speaker,
  FireExtinguisher,
  Sprinkler,
  Shield,
  Zap,
  Smartphone,
  Radio,
  Laptop,
  Lightbulb,
  Lock,
  Calendar,
  Users,
  Settings,
  Network,
  Mic,
  Volume2
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Testimonials } from "@/components/sections/testimonials";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";

// Icon mapping
const iconMap: Record<string, any> = {
  video: Video,
  projector: Projector,
  screen: Screen,
  speaker: Speaker,
  flame: Flame,
  sprinkler: Sprinkler,
  extinguisher: FireExtinguisher,
  barrier: Shield,
  home: Home,
  building: Building2,
  zap: Zap,
  smartphone: Smartphone,
  radio: Radio,
  laptop: Laptop,
  lightbulb: Lightbulb,
  lock: Lock,
  network: Network,
  mic: Mic,
  volume: Volume2,
};

export function AVFireInfrastructurePage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [packagesRef, packagesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/av-fire-infrastructure", {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });
      if (response.ok) {
        const data = await response.json();
        setPageContent(data.content);
      }
    } catch (error) {
      console.error("Error fetching page content:", error);
    } finally {
      setLoading(false);
    }
  };

  const heroData = pageContent?.hero || {
    title: "AV, Fire, Smart Infrastructure & Home Automation Solutions",
    subtitle: "Modern spaces need modern systems. From AV setups to fire safety to automation — we design environments that are intelligent, safe and effortlessly convenient.",
    tagline: "Classrooms → Offices → Homes → Industries — we install everything end-to-end.",
    buttons: [
      { text: "Explore Solutions", href: "#solutions", visible: true },
      { text: "Ask Honey (AI Help)", action: "honey", visible: true },
      { text: "Book Installation", href: "/contact", visible: true }
    ]
  };

  const introData = pageContent?.intro || {
    text: "Spaces today need more than just equipment — they need smart, integrated systems that communicate, secure and simplify everyday work. D.G.Yard provides complete Audio-Visual, Fire Protection, Smart Infrastructure, and Home/Office Automation solutions powered by expert planning, clean installation, and AI guidance through Honey. Whether it's projectors, hydrants, boom barriers, or voice-controlled smart homes — we build spaces that feel modern, efficient and safe."
  };

  const serviceCategories = pageContent?.serviceCategories || [
    {
      id: 1,
      title: "Audio-Visual Systems",
      description: "Better communication, more engagement, and modern presentation environments.",
      icon: "video",
      services: [
        { title: "Projectors (Normal & Laser)", description: "High-quality projection for classrooms, offices, and auditoriums" },
        { title: "Motorized & Manual Screens", description: "Professional projection screens for all environments" },
        { title: "Smart Interactive Boards", description: "Interactive whiteboards for engaging presentations" },
        { title: "Visualizers", description: "Document cameras for clear visual presentations" },
        { title: "PA & Professional Sound Systems", description: "Crystal clear audio for announcements and events" },
        { title: "Video Conferencing Systems", description: "Complete setup for remote meetings and collaboration" },
        { title: "Motorized Projector Lifts", description: "Automated projector mounting solutions" }
      ]
    },
    {
      id: 2,
      title: "Fire Safety Systems",
      description: "Reliable protection and industrial-grade compliance.",
      icon: "flame",
      services: [
        { title: "Automatic Sprinkler Systems", description: "Complete fire suppression systems" },
        { title: "Fire Hydrant Setup", description: "Emergency water supply systems" },
        { title: "Fire Safety Accessories", description: "Hoses, signage, alarms, and compliance equipment" },
        { title: "Compliance & Safety Checklist", description: "Full safety audit and compliance verification" }
      ]
    },
    {
      id: 3,
      title: "Smart Infrastructure Systems",
      description: "Safer movement, smooth entry management, and modernized facility infrastructure.",
      icon: "building",
      services: [
        { title: "Automatic Boom Barriers", description: "Automated gate control systems" },
        { title: "Flap Barriers / Turnstiles", description: "Access control for secure entry" },
        { title: "Solar Traffic Blinkers", description: "Solar-powered traffic safety lights" },
        { title: "Solar Road Studs", description: "Energy-efficient road marking systems" },
        { title: "Speed Breakers", description: "Rubber/PU/Plastic speed control solutions" },
        { title: "LED/LCD Display Systems", description: "Digital signage and information displays" },
        { title: "Complete Auditorium Setup", description: "Full AV and infrastructure for auditoriums" }
      ]
    },
    {
      id: 4,
      title: "Home & Office Automation",
      description: "Convenience, energy efficiency, security, and modern living.",
      icon: "home",
      services: [
        { title: "Smart Lighting Automation", description: "Control lights using Alexa, Google Home, apps, motion sensors & schedules" },
        { title: "Smart Fans & Appliances", description: "Operate fans, AC, TV through voice commands or mobile control" },
        { title: "Smart Plugs & Smart Switch Panels", description: "Convert any appliance into a smart, automated device" },
        { title: "Routine & Timer Automation", description: "Schedule lights, AC, appliances to turn on/off automatically" },
        { title: "Home Security Integration", description: "Smart door sensors, alarm systems, Wi-Fi locks, video doorbells" },
        { title: "Office Automation", description: "Meeting room automation, AV integration, routine-based control" }
      ]
    }
  ];

  const packages = pageContent?.packages || [
    {
      name: "Classroom Smart Pack",
      description: "Complete AV setup for classrooms",
      features: ["Projector", "Smart Board", "Sound System", "Visualizer"]
    },
    {
      name: "Conference AV Pack",
      description: "Professional meeting room setup",
      features: ["Video Conferencing", "Display Systems", "Audio Setup", "Smart Controls"]
    },
    {
      name: "Fire Safety Pack",
      description: "Complete fire protection",
      features: ["Sprinkler System", "Hydrant Setup", "Safety Accessories", "Compliance"]
    },
    {
      name: "Home Automation Starter Pack",
      description: "Essential smart home features",
      features: ["Smart Lighting", "Smart Switches", "Voice Control", "Mobile App"]
    }
  ];

  const faqs = pageContent?.faqs || [
    {
      question: "Do you provide smart home automation?",
      answer: "Yes — we offer complete Alexa and Google Home integration with smart lighting, appliances, security, and routine automation."
    },
    {
      question: "Can Honey help design my AV setup?",
      answer: "Yes — Honey can suggest projector placement, screen size, speaker positioning, and complete conference room layouts."
    },
    {
      question: "Do you install fire safety systems?",
      answer: "Yes — we provide complete fire sprinkler systems, hydrants, and all safety accessories with full compliance."
    }
  ];

  const ctaData = pageContent?.cta || {
    title: "Ready to Transform Your Space?",
    subtitle: "From AV to fire safety to smart automation — we handle everything.",
    buttons: [
      { text: "Book Installation", href: "/contact", visible: true },
      { text: "Ask Honey", action: "honey", visible: true },
      { text: "Get Quote", href: "/quotation", visible: true }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-serif">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-blue-900/80 to-slate-900/90" />
        </div>
        
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 z-0 opacity-30"
        >
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 mb-6">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold font-serif">digital | secure | smart living</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                {heroData.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 font-serif mb-8 leading-relaxed">
                {heroData.subtitle}
              </p>
              <p className="text-lg text-gray-300 font-serif mb-10">
                {heroData.tagline}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {heroData.buttons.filter((btn: any) => btn.visible).map((button: any, idx: number) => (
                  <Button
                    key={idx}
                    asChild={!!button.href}
                    size="lg"
                    className={`font-serif font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all px-8 py-6 ${
                      idx === 0
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white hover:bg-gray-100 text-gray-900 border-2 border-white"
                    }`}
                    onClick={button.action === "honey" ? () => {
                      window.dispatchEvent(new CustomEvent("openHoneyChat"));
                    } : undefined}
                  >
                    {button.href ? (
                      <Link href={button.href} className="flex items-center gap-2">
                        {button.text}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2">
                        {button.text}
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section ref={introRef} className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={introInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
              {introData.text}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="solutions" ref={servicesRef} className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Our Solutions
            </h2>
            <p className="text-xl text-gray-600 font-serif">
              4 Major Categories of Modern Systems
            </p>
          </motion.div>

          <div className="space-y-16">
            {serviceCategories.map((category: any, catIdx: number) => {
              const IconComponent = iconMap[category.icon] || Video;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: catIdx * 0.2, duration: 0.6 }}
                  className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200"
                >
                  <div className="flex items-start gap-6 mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-blue-100 text-blue-600">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                        {category.id}. {category.title}
                      </h3>
                      <p className="text-lg text-gray-600 font-serif mb-2">
                        {category.description}
                      </p>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.services.map((service: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-serif font-semibold text-gray-900 mb-1">
                                {service.title}
                              </h4>
                              <p className="text-sm text-gray-600 font-serif">
                                {service.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section ref={packagesRef} className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={packagesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Packages (Quick Selection)
            </h2>
            <p className="text-xl text-gray-600 font-serif">
              Pre-configured solutions for different needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={packagesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 shadow-lg hover:shadow-xl border border-blue-200 transition-all"
              >
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  {pkg.name}
                </h3>
                <p className="text-gray-600 font-serif mb-6">
                  {pkg.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700 font-serif text-sm">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-serif"
                >
                  <Link href="/contact" className="flex items-center justify-center gap-2">
                    Get Quote
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Honey AI Helper */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <InlineAIHelper
              context="AV, Fire & Smart Infrastructure solutions"
              suggestions={[
                "Help me design my AV system",
                "What fire safety system do I need?",
                "Smart home automation setup",
                "Projector and screen recommendations",
                "How to plan smart infrastructure?"
              ]}
              position="inline"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Why D.G.Yard
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              "Clean, professional installation",
              "High-quality industrial-grade hardware",
              "Smart planning & structured wiring",
              "Honey-powered AI assistance",
              "Long-term support",
              "One-stop solution for AV + Safety + Infra + Smart Automation"
            ].map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white p-6 rounded-lg shadow-md">
                <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-serif">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Testimonials />
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={faqInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-md border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-serif font-bold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 font-serif">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className="py-20 md:py-28 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              {ctaData.title}
            </h2>
            <p className="text-xl text-blue-100 font-serif mb-10">
              {ctaData.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {ctaData.buttons.filter((btn: any) => btn.visible).map((button: any, idx: number) => (
                <Button
                  key={idx}
                  asChild={!!button.href}
                  size="lg"
                  className={`font-serif font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all px-8 py-6 ${
                    idx === 0
                      ? "bg-white hover:bg-gray-100 text-blue-600"
                      : "bg-transparent hover:bg-white/10 text-white border-2 border-white"
                  }`}
                  onClick={button.action === "honey" ? () => {
                    window.dispatchEvent(new CustomEvent("openHoneyChat"));
                  } : undefined}
                >
                  {button.href ? (
                    <Link href={button.href} className="flex items-center gap-2">
                      {button.text}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      {button.text}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

