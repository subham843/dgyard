"use client";

import { Button } from "@/components/ui/button";
import { Camera, Network, TrendingUp, Factory, ArrowRight, Bot, CheckCircle2, Video, Monitor, Shield, Flame, Building2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface SolutionsCategoryPageProps {
  category: "security-surveillance" | "networking-it" | "digital-marketing" | "av-fire-infrastructure";
  title: string;
  subtitle: string;
}

const allServices = [
  {
    id: "security-surveillance",
    icon: Camera,
    title: "CCTV & Security Solutions",
    subtitle: "Reliable protection for homes, offices & industries.",
    description: "We design and install security systems that match your environment. Clean wiring, proper configuration, high-quality equipment and long-term support — everything done with care.",
    features: [
      "CCTV & IP Camera Solutions",
      "Video Surveillance Systems",
      "NVR/DVR Setup",
      "Remote Monitoring",
      "Access Control Systems",
      "Flap Barrier Systems",
      "Automatic Boom Barriers",
      "Public Address Systems",
      "Speed Breakers & Road Safety Devices",
      "Solar Road Studs",
      "Solar Traffic Blinker Lights"
    ],
    punchline: "Security that keeps you safe — silently and efficiently.",
  },
  {
    id: "networking-it",
    icon: Network,
    title: "Networking Solutions",
    subtitle: "Stable, fast and clutter-free connectivity.",
    description: "From small offices to large campuses, we design networks built for performance and reliability.",
    features: [
      "Wi-Fi Planning & Optimization",
      "Router & Switch Setup",
      "LAN, Fiber & Structured Cabling",
      "Wireless Networking Solutions",
      "Enterprise Network Setup",
      "Video Conferencing Solutions",
      "Full Auditorium Networking Solutions",
      "Smart Institution Networking Support"
    ],
    punchline: "Connectivity that just works — every single day.",
  },
  {
    id: "networking-it-2",
    icon: Monitor,
    title: "IT & Computing Solutions",
    subtitle: "Devices and systems for work, learning and operations.",
    description: "Complete solutions for classrooms, offices, labs and control rooms.",
    features: [
      "Laptops & Desktops",
      "LED & LCD TVs",
      "Teaching & Training Equipment",
      "Display Boards, Writing Boards, Information Boards",
      "Epoxy Adhesive & Hardware Accessories"
    ],
    punchline: "Technology that supports every workspace.",
  },
  {
    id: "digital-marketing",
    icon: TrendingUp,
    title: "Digital Marketing & Branding",
    subtitle: "Clear strategies. Real results. Strong brand identity.",
    description: "We help businesses, organizations and public figures grow digitally through smart, creative and data-driven marketing.",
    features: [
      "Social Media Management",
      "Political & Corporate Branding",
      "Google & Meta Ads",
      "Lead Generation Campaigns",
      "Website & Branding Consultation",
      "Content Creation & Strategy",
      "Full Digital Brand Development"
    ],
    punchline: "Digital growth without confusion — just clarity and performance.",
  },
  {
    id: "av-fire-infrastructure",
    icon: Video,
    title: "Audio-Visual & Presentation Solutions",
    subtitle: "Modern communication tools for institutions & corporates.",
    description: "We provide complete AV setups for classrooms, offices, boardrooms, auditoriums and training environments.",
    features: [
      "Projectors (Standard & Laser)",
      "Motorized & Manual Projection Screens",
      "Motorized Projector Lifts",
      "Interactive Smart Boards",
      "Visualizers",
      "Wireless Presenters",
      "Conferencing Systems",
      "Auditorium AV Solutions",
      "PA Systems & Microphones"
    ],
    punchline: "Smart tools that make communication effortless.",
  },
  {
    id: "av-fire-infrastructure-2",
    icon: Factory,
    title: "Industrial & Infrastructure Solutions",
    subtitle: "Heavy-duty systems designed for real-world environments.",
    description: "Industrial setups demand precision and durability. We design solutions that stay reliable under pressure.",
    features: [
      "Automatic Fire Sprinkler Systems",
      "Fire Hydrant Systems",
      "Smart Industrial CCTV",
      "Industrial Wi-Fi & Network",
      "Access Control Solutions",
      "HD & IP Surveillance",
      "Warehouse & Factory Security Setup",
      "Traffic, Road & Safety Installations",
      "Industrial Monitoring & Alert Systems"
    ],
    punchline: "Strong systems, built to last.",
  },
];

export function SolutionsCategoryPage({ category, title, subtitle }: SolutionsCategoryPageProps) {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // Filter services based on category
  const categoryServices = allServices.filter(service => 
    service.id.startsWith(category)
  );

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

      <div className="relative z-10">
        {/* Hero Section */}
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
                className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6"
              >
                {title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-gray-200 font-serif mb-8 max-w-3xl mx-auto"
              >
                {subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="/request-service" className="flex items-center gap-2">
                    Book a Service
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Chat with Honey
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section ref={servicesRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {categoryServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl border-2 border-gray-200 p-8 hover:border-gray-900 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-gray-900">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 font-serif mt-1">
                          {service.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 font-serif mb-6">
                      {service.description}
                    </p>

                    <div className="mb-6">
                      <p className="text-sm font-serif font-semibold text-gray-900 mb-3">What we offer:</p>
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 font-serif">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-gray-500 font-serif italic mb-6 border-l-2 border-gray-300 pl-4">
                      {service.punchline}
                    </p>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-serif"
                    >
                      <Link href="/services/book" className="flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}











