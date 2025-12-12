"use client";

import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  Cable, 
  Router, 
  Monitor, 
  GraduationCap, 
  Video,
  ArrowRight, 
  Bot, 
  CheckCircle2,
  Home,
  Building2,
  Factory,
  Star,
  HelpCircle,
  Phone,
  Settings,
  Network,
  Server,
  Zap,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Testimonials } from "@/components/sections/testimonials";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";

// Icon mapping for service categories
const iconMap: Record<string, any> = {
  wifi: Wifi,
  cable: Cable,
  router: Router,
  monitor: Monitor,
  school: GraduationCap,
  video: Video,
  home: Home,
  building: Building2,
  factory: Factory,
  network: Network,
  server: Server,
};

const defaultServiceCategories = [
  {
    icon: Wifi,
    title: "🌐 Wi-Fi Planning & Optimization",
    subtitle: "Strong, stable wireless coverage for homes, offices & institutions.",
    features: [
      "Placement planning",
      "Heatmap-based layout",
      "Dead-zone removal"
    ]
  },
  {
    icon: Cable,
    title: "🧩 LAN / Fiber / Structured Cabling",
    subtitle: "Clean and organized cabling that lasts for years.",
    features: [
      "Fiber cabling",
      "Cat6/Cat7 cabling",
      "Patch panel setup"
    ]
  },
  {
    icon: Router,
    title: "🔌 Routers, Switches & Enterprise Setup",
    subtitle: "Professional-grade configuration for fast performance.",
    features: [
      "VLAN setup",
      "Server room setup",
      "Rack organization"
    ]
  },
  {
    icon: Monitor,
    title: "🖥 IT Systems & Devices",
    subtitle: "Complete device solutions for offices & institutions.",
    features: [
      "Laptops & desktops",
      "LED/LCD TVs",
      "Monitors & accessories"
    ]
  },
  {
    icon: GraduationCap,
    title: "🏫 Classroom & Institutional Setup",
    subtitle: "Tools for teaching, training & smart learning.",
    features: [
      "Display boards",
      "Writing boards",
      "Information boards",
      "Teaching equipment"
    ]
  },
  {
    icon: Video,
    title: "🎥 Video Conferencing & Auditorium Networking",
    subtitle: "Smooth communication for meetings, events & presentations.",
    features: [
      "Web conferencing",
      "Projector connectivity",
      "Full auditorium network"
    ]
  }
];

// Placeholder for Before/After Gallery
const BeforeAfterGallerySection = ({ images }: { images?: any[] }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const galleryImages = images || [
    { beforeImage: "/images/before-cabling.jpg", afterImage: "/images/after-cabling.jpg", title: "Messy wiring → Clean structured cabling" },
    { beforeImage: "/images/before-rack.jpg", afterImage: "/images/after-rack.jpg", title: "Unorganized rack → Professionally arranged rack" }
  ];
  
  return (
    <section ref={ref} className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Professional Rack & Cabling Examples
          </h2>
          <p className="text-lg text-gray-700 font-serif max-w-2xl mx-auto">
            Showcase the quality of your work — clean, organized, and professional.
          </p>
          <div className="w-24 h-1 bg-gray-900 mx-auto mt-4"></div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {galleryImages.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="relative h-64">
                  <Image 
                    src={item.beforeImage || "/images/placeholder.jpg"} 
                    alt="Before" 
                    width={400} 
                    height={300} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xl font-bold font-serif">BEFORE</span>
                  </div>
                </div>
                <div className="relative h-64">
                  <Image 
                    src={item.afterImage || "/images/placeholder.jpg"} 
                    alt="After" 
                    width={400} 
                    height={300} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xl font-bold font-serif">AFTER</span>
                  </div>
                </div>
              </div>
              {item.title && (
                <div className="p-4 bg-white">
                  <p className="text-center text-sm text-gray-600 font-serif">{item.title}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export function NetworkingITPage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [honeyRef, honeyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [processRef, processInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/networking-it", {
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

  const handleOpenHoneyChat = () => {
    const event = new CustomEvent("openHoneyChat");
    window.dispatchEvent(event);
  };

  // Use page content from API if available, otherwise use defaults
  const heroData = pageContent?.hero || {
    title: "Networking & IT Solutions",
    subtitle: "Fast, stable and professionally structured connectivity for homes, offices, institutions & industries.",
    tagline: "Smooth connectivity, clean design, and effortless performance.",
    buttons: [
      { text: "Plan My Network", href: "/quotation", visible: true },
      { text: "Book Technician Visit", href: "/services/book", visible: true },
      { text: "Ask Honey (AI Help)", action: "chat", visible: true }
    ]
  };

  const introData = pageContent?.intro || {
    text: "A great network is the backbone of any business, school, or home.\n\nWe design networks that are fast, stable, secure and neatly organized — with clean cabling, proper device placement and long-term support.\n\nFrom Wi-Fi planning to enterprise-level IT setups, D.G.Yard builds systems that work flawlessly."
  };

  const serviceCategoriesData = pageContent?.serviceCategories || defaultServiceCategories;
  const faqsData = pageContent?.faqs || [];
  const honeyData = pageContent?.honey || {
    enabled: true,
    title: "💡 Let Honey Help You Build the Perfect Network",
    description: "Honey — our AI assistant — gives quick, smart recommendations based on your space and requirements.",
    buttonText: "→ Ask Honey for Network Suggestions",
    features: [
      "Wi-Fi coverage planning",
      "Device placement suggestions",
      "Required router type",
      "LAN/Fiber cable length estimation",
      "Switch configuration suggestions",
      "Server rack planning",
      "IT equipment selection",
      "Office/classroom setup guidance"
    ]
  };
  const processData = pageContent?.process || {
    title: "How We Work",
    steps: [
      {
        id: 1,
        title: "We Understand Your Space",
        description: "We survey and note coverage, cabling and router placement."
      },
      {
        id: 2,
        title: "We Suggest the Right Plan",
        description: "Clear, honest recommendations based on your usage and budget."
      },
      {
        id: 3,
        title: "We Install & Optimize Everything",
        description: "Clean cabling, proper signal strength, stable connections."
      }
    ]
  };
  const ctaData = pageContent?.cta || {
    title: "Ready To Build a Better Network?",
    subtitle: "Get a customized layout, clean installation, and AI-powered recommendations.",
    buttons: [
      { text: "Plan My Network", href: "/quotation", visible: true },
      { text: "Get a Quote", href: "/quotation", visible: true },
      { text: "Ask Honey", action: "chat", visible: true }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-serif">Loading...</p>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10">
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
              >
                <Network className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-serif font-semibold text-white">Networking Solutions</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6"
              >
                {heroData.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-gray-200 font-serif mb-4 max-w-3xl mx-auto"
              >
                {heroData.subtitle}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.45 }}
                className="text-base md:text-lg text-gray-300 font-serif font-semibold mb-8 max-w-3xl mx-auto"
              >
                {heroData.tagline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                {(heroData.buttons || []).filter((btn: any) => btn.visible !== false).map((btn: any, idx: number) => (
                  btn.action === "chat" ? (
                    <Button
                      key={idx}
                      onClick={handleOpenHoneyChat}
                      size="lg"
                      variant="outline"
                      className="border-2 border-blue-300 text-blue-300 hover:bg-blue-300/10 font-serif font-bold"
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      {btn.text}
                    </Button>
                  ) : (
                    <Button
                      key={idx}
                      asChild
                      size="lg"
                      className={idx === 0 
                        ? "bg-white text-blue-900 hover:bg-blue-50 font-serif font-bold shadow-lg"
                        : "border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                      }
                    >
                      <Link href={btn.href || "#"} className="flex items-center gap-2">
                        {btn.text}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  )
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 2. Introduction Section */}
        <section ref={introRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={introInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed whitespace-pre-line">
                {introData.text.split('\n').map((line: string, idx: number) => (
                  <p key={idx} className={idx > 0 ? 'mt-4' : ''}>{line}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Service Categories */}
        <section id="service-categories" ref={servicesRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={servicesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Our Networking & IT Services
              </h2>
              <p className="text-gray-600 font-serif mb-6 max-w-2xl mx-auto">
                Complete solutions for connectivity, devices, and infrastructure
              </p>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {serviceCategoriesData.filter((s: any) => s.visible !== false).map((service: any, index: number) => {
                // Get icon component from string or use default
                let IconComponent = Wifi;
                if (typeof service.icon === 'string') {
                  IconComponent = iconMap[service.icon.toLowerCase()] || Wifi;
                } else if (service.icon) {
                  IconComponent = service.icon;
                }
                
                return (
                  <motion.div
                    key={service.id || service.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-900 transition-all"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-gray-900" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 font-serif mb-4 text-sm">
                      {service.subtitle}
                    </p>
                    <ul className="space-y-2">
                      {service.features?.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 font-serif">
                          <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Simple Honey AI Helper */}
        <section ref={honeyRef} className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={honeyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <InlineAIHelper
                context="networking & IT solutions"
                suggestions={[
                  "How to plan Wi-Fi coverage?",
                  "Which router is best for my office?",
                  "LAN vs Wi-Fi - which is better?",
                  "Help me design my network layout",
                  "What cables do I need for networking?"
                ]}
                position="inline"
              />
            </motion.div>
          </div>
        </section>

        {/* 6. Before/After Gallery */}
        <BeforeAfterGallerySection images={pageContent?.beforeAfter} />

        {/* 7. Process Section */}
        <section ref={processRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={processInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                {processData.title}
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {processData.steps?.map((step: any, index: number) => (
                <motion.div
                  key={step.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={processInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center bg-gray-50 rounded-xl p-8 border-2 border-gray-200 hover:border-gray-900 transition-all"
                >
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 font-serif">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Customer Reviews */}
        <section className="py-16 md:py-20 bg-gray-50">
          <Testimonials
            customHeading="What People Say About Our Networking Services"
            customSubtitle="Real feedback from customers who trust D.G.Yard for their connectivity needs"
          />
        </section>

        {/* 9. FAQ Section */}
        <section ref={faqRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={faqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {faqsData.filter((f: any) => f.visible !== false).map((faq: any, index: number) => (
                  <motion.div
                    key={faq.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={faqInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg border-2 border-gray-200 p-6"
                  >
                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-gray-700 font-serif ml-8">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 9. Final CTA Section */}
        <section ref={ctaRef} className="py-16 md:py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                {ctaData.title}
              </h2>
              <p className="text-lg text-gray-200 font-serif mb-8">
                {ctaData.subtitle}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {(ctaData.buttons || []).filter((btn: any) => btn.visible !== false).map((btn: any, idx: number) => (
                  btn.action === "chat" ? (
                    <Button
                      key={idx}
                      onClick={handleOpenHoneyChat}
                      size="lg"
                      variant="outline"
                      className="border-2 border-blue-300 text-blue-300 hover:bg-blue-300/10 font-serif font-bold"
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      {btn.text}
                    </Button>
                  ) : (
                    <Button
                      key={idx}
                      asChild
                      size="lg"
                      className={idx === 0 
                        ? "bg-white text-blue-900 hover:bg-blue-50 font-serif font-bold shadow-lg"
                        : "border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                      }
                    >
                      <Link href={btn.href || "#"} className="flex items-center gap-2">
                        {btn.text}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  )
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

