"use client";

import { Button } from "@/components/ui/button";
import { 
  Camera, 
  HardDrive, 
  DoorOpen, 
  Volume2, 
  Shield, 
  AlertTriangle, 
  ArrowRight, 
  Bot, 
  CheckCircle2,
  Home,
  Building2,
  Factory,
  Star,
  HelpCircle,
  Phone,
  MessageCircle,
  Sparkles,
  Zap,
  Users,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Testimonials } from "@/components/sections/testimonials";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";

const serviceCategories = [
  {
    icon: Camera,
    title: "📹 CCTV & IP Camera Systems",
    subtitle: "Smart surveillance for homes, shops, offices & industries.",
    features: [
      "Dome, Bullet & PTZ",
      "Indoor/Outdoor",
      "2MP / 4MP / 5MP / 8MP / 4K"
    ]
  },
  {
    icon: HardDrive,
    title: "🖥 DVR/NVR Setup & Recording Solutions",
    subtitle: "Reliable storage & easy remote viewing.",
    features: [
      "Bitrate & storage planning",
      "Multi-device monitoring"
    ]
  },
  {
    icon: DoorOpen,
    title: "🚪 Access Control & Attendance Systems",
    subtitle: "Secure entry for offices & institutions.",
    features: [
      "RFID, Biometric, Face Recognition"
    ]
  },
  {
    icon: Volume2,
    title: "🔊 Public Address (PA) System",
    subtitle: "Clear announcements for schools, colleges & industries.",
    features: []
  },
  {
    icon: Shield,
    title: "🚧 Barriers & Entry Automation",
    subtitle: "Smart access management for commercial & industrial sites.",
    features: [
      "Flap Barrier",
      "Automatic Boom Barrier"
    ]
  },
  {
    icon: AlertTriangle,
    title: "⚠️ Safety & Road Solutions",
    subtitle: "Better control, visibility & road safety.",
    features: [
      "Speed Breakers",
      "Solar Road Studs",
      "Solar Traffic Blinkers"
    ]
  },
];

const whyChoosePoints = [
  {
    icon: CheckCircle2,
    title: "Clean & professional installation",
    description: "Neat wiring, proper placement, and organized setup."
  },
  {
    icon: Users,
    title: "Honest product guidance",
    description: "We recommend what you actually need, not what increases the bill."
  },
  {
    icon: Shield,
    title: "Long-term service reliability",
    description: "Ongoing support, maintenance, and system updates."
  },
  {
    icon: Sparkles,
    title: "High-grade equipment",
    description: "Quality cameras and systems from trusted brands."
  },
  {
    icon: Settings,
    title: "Proper storage & angle planning",
    description: "Expert calculation of storage needs and optimal camera placement."
  },
  {
    icon: Bot,
    title: "Smart AI support through Honey",
    description: "24/7 AI assistance for recommendations and guidance."
  },
];

const faqs = [
  {
    question: "How many cameras do I need?",
    answer: "Depends on space. Honey can help calculate instantly based on your area size, entry points, and coverage requirements. Ask Honey for personalized recommendations!"
  },
  {
    question: "How long does installation take?",
    answer: "Most installs take 2–4 hours for home setups. Office installations typically take 4–8 hours, while industrial systems may require 1–2 days depending on complexity."
  },
  {
    question: "Is remote monitoring possible?",
    answer: "Yes, via mobile app. All our systems support remote viewing through smartphone apps, allowing you to monitor your property from anywhere, anytime."
  },
  {
    question: "Which camera is best for night vision?",
    answer: "For night vision, we recommend cameras with infrared (IR) LEDs. Bullet cameras are ideal for outdoor night surveillance, while dome cameras work well for indoor monitoring."
  },
  {
    question: "What's the difference between indoor and outdoor cameras?",
    answer: "Outdoor cameras are weatherproof (IP66/IP67 rated) and designed to withstand rain, dust, and temperature variations. Indoor cameras focus on better image quality in controlled environments."
  },
  {
    question: "Do you provide maintenance?",
    answer: "Yes, we offer comprehensive maintenance packages including regular check-ups, system updates, troubleshooting, and technical support to keep your security system running smoothly."
  },
];

export function SecuritySurveillancePage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [whyChooseRef, whyChooseInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [honeyRef, honeyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      // Use cached fetch with revalidation
      const response = await fetch("/api/admin/page-content/security-surveillance", {
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
    title: "Security & Surveillance Solutions",
    subtitle: "Advanced, reliable and clean installations for homes, offices & industries.",
    tagline: "Protection that works — simple, smart, and secure.",
    buttons: [
      { text: "Get CCTV Quote (2 Minutes)", href: "/quotation", visible: true },
      { text: "Book Installation", href: "/services/book", visible: true },
      { text: "Ask Honey (AI Support)", action: "chat", visible: true }
    ]
  };

  const introData = pageContent?.intro || {
    text: "Security isn't just about adding cameras — it's about planning the right angles, storage, wiring and access control that fits your environment.\n\nAt D.G.Yard, we build surveillance systems that work smoothly every day, with clear guidance and professional workmanship."
  };

  const serviceCategoriesData = pageContent?.serviceCategories || serviceCategories;
  const faqsData = pageContent?.faqs || faqs;
  const honeyData = pageContent?.honey || {
    enabled: true,
    title: "💡 Let Honey Help You Choose the Right Setup",
    description: "Honey — our AI assistant — guides you in selecting cameras, calculating storage, comparing products, and planning your security setup.",
    buttonText: "→ Ask Honey (AI Support)"
  };
  const ctaData = pageContent?.cta || {
    title: "Ready To Secure Your Space?",
    subtitle: "Get a customized plan with professional installation & AI-guided suggestions.",
    buttons: [
      { text: "Get CCTV Quote", href: "/quotation", visible: true },
      { text: "Book Installation", href: "/services/book", visible: true },
      { text: "Chat With Honey", action: "chat", visible: true }
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
                <Camera className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-serif font-semibold text-white">Security Solutions</span>
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
                      className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-serif font-bold"
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
                        ? "bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
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

        {/* 2. Short Intro Section */}
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

        {/* 3. Main Service Categories */}
        <section ref={servicesRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={servicesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Our Security & Surveillance Services
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {serviceCategoriesData.filter((s: any) => s.visible !== false).map((service: any, index: number) => {
                const IconComponent = service.icon;
                return (
                  <motion.div
                    key={service.title}
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
                      {service.features.map((feature, idx) => (
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

        {/* 4. Why Choose Our Security Solutions */}
        <section ref={whyChooseRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Why Choose Our Security Solutions
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {whyChoosePoints.map((point, index) => {
                const IconComponent = point.icon;
                return (
                  <motion.div
                    key={point.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-gray-900 hover:shadow-lg transition-all"
                  >
                    <IconComponent className="w-8 h-8 text-gray-900 mb-4" />
                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
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

        {/* 6. How We Work */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={true ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                How We Work
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "1",
                  title: "We Understand Your Space",
                  description: "We survey your site and note your requirements."
                },
                {
                  step: "2",
                  title: "We Suggest What's Right",
                  description: "Honest recommendations, no unnecessary items."
                },
                {
                  step: "3",
                  title: "We Install & Optimize",
                  description: "Clean wiring, proper angles, smooth setup."
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={true ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="text-center bg-gray-50 rounded-xl p-8 border-2 border-gray-200 hover:border-gray-900 transition-all"
                >
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 font-serif">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Simple Honey AI Helper */}
        <section ref={honeyRef} className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={honeyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <InlineAIHelper
                context="security & surveillance solutions"
                suggestions={[
                  "How many cameras do I need?",
                  "Which camera is best for night vision?",
                  "How much storage do I need?",
                  "What's the difference between DVR and NVR?",
                  "Help me plan my CCTV installation"
                ]}
                position="inline"
              />
            </motion.div>
          </div>
        </section>

        {/* 6. Before/After Gallery */}
        <BeforeAfterGallerySection />

        {/* 7. Resolution Comparison */}
        <ResolutionComparisonSection />

        {/* 8. Customer Reviews */}
        <section className="py-16 md:py-20 bg-gray-50">
          <Testimonials 
            customHeading="What Our Security Clients Say"
            customSubtitle="Real feedback from customers who trust D.G.Yard for their security needs"
          />
        </section>

        {/* 9. FAQ Section */}
        <section ref={faqRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={faqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-900" />
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                </div>
                <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
              </div>

              <div className="space-y-4">
                {faqsData.filter((f: any) => f.visible !== false).map((faq: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={faqInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg border-2 border-gray-200 p-6 hover:border-gray-900 transition-all"
                  >
                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 font-serif">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 10. Final CTA */}
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
                <Shield className="w-12 h-12 text-yellow-400" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                {ctaData.title}
              </h2>
              <p className="text-lg text-gray-200 font-serif mb-8">
                {ctaData.subtitle}
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="/quotation" className="flex items-center gap-2">
                    Get CCTV Quote
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
                    Book Installation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  variant="outline"
                  className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-serif font-bold"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Chat With Honey
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Before/After Gallery Component
function BeforeAfterGallerySection() {
  const [galleryRef, galleryInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // This will be loaded from admin panel - using placeholder for now
  const beforeAfterSliders = [
    {
      id: 1,
      beforeImage: "/images/placeholder-before.jpg",
      afterImage: "/images/placeholder-after.jpg",
      title: "Messy Wiring → Clean Wiring"
    },
    {
      id: 2,
      beforeImage: "/images/placeholder-before.jpg",
      afterImage: "/images/placeholder-after.jpg",
      title: "Old Camera → High-resolution IP Camera"
    },
  ];

  return (
    <section ref={galleryRef} className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={galleryInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            See the Difference Professional Installation Makes
          </h2>
          <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {beforeAfterSliders.map((slider, index) => (
            <motion.div
              key={slider.id}
              initial={{ opacity: 0, y: 30 }}
              animate={galleryInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="mb-8"
            >
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4 text-center">
                {slider.title}
              </h3>
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-serif font-semibold text-red-600 mb-2">Before</p>
                    <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                      {/* Image will be loaded from admin panel */}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-serif font-semibold text-green-600 mb-2">After</p>
                    <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                      {/* Image will be loaded from admin panel */}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Resolution Comparison Component
function ResolutionComparisonSection() {
  const [resolutionRef, resolutionInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // This will be loaded from admin panel - using placeholder for now
  const resolutions = [
    { label: "2MP Sample", resolution: "2MP", image: "/images/placeholder.jpg" },
    { label: "4MP Sample", resolution: "4MP", image: "/images/placeholder.jpg" },
    { label: "5MP Sample", resolution: "5MP", image: "/images/placeholder.jpg" },
    { label: "8MP / 4K Sample", resolution: "8MP/4K", image: "/images/placeholder.jpg" },
  ];

  return (
    <section ref={resolutionRef} className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={resolutionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Camera Quality Comparison
          </h2>
          <p className="text-gray-600 font-serif mb-6 max-w-2xl mx-auto">
            User instantly समझ जाता है quality difference।
          </p>
          <div className="w-24 h-1 bg-gray-900 mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {resolutions.map((res, index) => (
            <motion.div
              key={res.resolution}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={resolutionInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-gray-900 transition-all"
            >
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                {/* Image will be loaded from admin panel */}
              </div>
              <p className="text-center font-serif font-semibold text-gray-900 text-sm">
                {res.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

