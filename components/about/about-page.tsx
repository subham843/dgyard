"use client";

import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Heart, 
  Shield, 
  CheckCircle2, 
  Bot, 
  Zap, 
  Users, 
  ArrowRight,
  Home,
  Building2,
  Store,
  Warehouse,
  Factory,
  GraduationCap,
  Building,
  Star,
  Phone,
  MessageCircle,
  Camera,
  Network,
  TrendingUp,
  Factory as FactoryIcon,
  Eye,
  Video,
  Monitor,
  Laptop,
  Tv
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Testimonials } from "@/components/sections/testimonials";

const industries = [
  { icon: Home, name: "Homes & Apartments" },
  { icon: Building2, name: "Offices & Startups" },
  { icon: Store, name: "Retail Shops" },
  { icon: GraduationCap, name: "Schools & Colleges" },
  { icon: Users, name: "Institutes & Coaching Centers" },
  { icon: Warehouse, name: "Warehouses" },
  { icon: Factory, name: "Factories & Industrial Sites" },
  { icon: Video, name: "Event Spaces & Auditoriums" },
  { icon: Building, name: "Government & Public Sector" },
  { icon: Sparkles, name: "Political & Corporate Clients" },
];

const services = [
  { icon: Camera, name: "CCTV Sales & Installation" },
  { icon: Network, name: "Networking Solutions" },
  { icon: TrendingUp, name: "Digital Marketing" },
  { icon: FactoryIcon, name: "Industrial Tech Solutions" },
];

const values = [
  {
    icon: Heart,
    title: "Honesty",
    description: "Clear guidance, no upselling"
  },
  {
    icon: CheckCircle2,
    title: "Quality Work",
    description: "Clean and professional execution"
  },
  {
    icon: Zap,
    title: "Simplicity",
    description: "Technology explained in a simple way"
  },
  {
    icon: Sparkles,
    title: "Creativity",
    description: "Strong digital & branding solutions"
  },
  {
    icon: Eye,
    title: "Innovation",
    description: "AI, automation & modern tools"
  },
  {
    icon: Users,
    title: "Commitment",
    description: "Long-term support you can trust"
  },
];

const whyChoosePoints = [
  "Genuine advice, no upselling",
  "World-class clean installation",
  "Fast support + AI assistance",
  "Transparent pricing",
  "One team for security, networking & digital needs"
];

export function AboutPage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [purposeRef, purposeInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [storyRef, storyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [philosophyRef, philosophyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [honeyRef, honeyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [valuesRef, valuesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [whyChooseRef, whyChooseInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [industriesRef, industriesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [visionRef, visionInView] = useInView({ triggerOnce: true, threshold: 0.1 });
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
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-serif font-semibold text-white">Our Story</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25 }}
                className="text-sm md:text-base font-serif font-semibold text-gray-300 mb-4 tracking-wider uppercase"
              >
                ABOUT D.G.YARD
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-sm md:text-base font-serif font-semibold text-gray-300 mb-6 tracking-wider uppercase"
              >
                digital | secure | smart living
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 }}
                className="text-lg md:text-xl text-gray-200 font-serif max-w-3xl mx-auto"
              >
                Technology, security, digital growth, and smart infrastructure — all brought together under one powerful and reliable brand.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* 2. Who We Are */}
        <section ref={purposeRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={purposeInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                Who We Are
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-8"></div>
              <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed text-center mb-6">
                D.G.Yard is a multi-solution technology company offering CCTV & security systems, networking infrastructure, digital marketing, industrial tech, audio-visual systems, smart classroom solutions, fire safety systems, and IT equipment for homes, businesses, institutions, and industries.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-8 md:p-10 mb-6">
                <p className="text-lg md:text-xl text-gray-700 font-serif font-semibold mb-4 text-center">
                  Our approach is simple:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-gray-700 font-serif">Understand real needs</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-gray-700 font-serif">Deliver clean, reliable work</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-gray-700 font-serif">Use modern technology & AI</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-gray-700 font-serif">Provide long-term support</span>
                  </div>
                </div>
              </div>
              
              <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed text-center">
                We believe in solutions that look clean, work smoothly, and make everyday life easier.
              </p>
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8 mt-6">
                <ul className="space-y-3 text-center">
                  <li className="text-lg text-gray-700 font-serif">• Practical field experience</li>
                  <li className="text-lg text-gray-700 font-serif">• Creative digital strategy</li>
                  <li className="text-lg text-gray-700 font-serif">• Clean installations</li>
                  <li className="text-lg text-gray-700 font-serif">• Honest guidance</li>
                  <li className="text-lg text-gray-700 font-serif">• AI-assisted intelligence</li>
                </ul>
                <p className="text-lg text-gray-700 font-serif text-center mt-6 font-semibold">
                  Into one seamless service ecosystem.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Our Journey */}
        <section ref={storyRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={storyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                Our Journey — From Passion to a Multi-Service Tech Brand
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-8"></div>
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 md:p-12 space-y-6">
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  The foundation of D.G.Yard began in the early 2000s with a deep love for computers and technology. Between 2002–2003, continuous learning in hardware and software laid the technical base for everything that would follow.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  By 2004, this passion turned into service — providing door-to-door computer repairs and solutions for homes and small offices. Every visit taught something new, built trust, and strengthened understanding of customer needs.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  As experience grew, the services expanded with a team, offering structured home and office technical support.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  A major milestone came when the opportunity to work with a national-level software company arose. Starting as a technical role and later taking on a leadership partnership, the journey included traveling across India, training clients, deploying software, and collaborating with well-known Indian brands. These years built strong expertise in enterprise systems, customer management, and large-scale operations.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  Around 2011, a fully equipped computer showroom marked a transition into a more stable and professional presence in hardware and customer service.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  With time, D.G.Yard embraced the digital revolution — stepping into digital marketing, branding for businesses, organizations, and public figures. This expanded our capabilities into social media, advertising, content strategy, and modern digital communication.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed">
                  Further growth led us into industrial and institutional technology — handling CCTV surveillance, wireless networking, access control, fire safety systems, public address systems, barriers, and full auditorium and classroom technology solutions.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed font-semibold">
                  Today, D.G.Yard stands as a comprehensive tech powerhouse, delivering security + networking + digital + infrastructure + AI solutions under one brand.
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed font-semibold">
                  Our mission remains unchanged:
                </p>
                <p className="text-lg md:text-xl text-gray-700 font-serif leading-relaxed pl-4 border-l-4 border-gray-900">
                  to deliver honest, modern, and high-quality solutions that support digital, secure, smart living.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. What We Do */}
        <section ref={servicesRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={servicesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 text-center">
                What We Do — Complete Solutions Under One Roof
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CCTV */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Camera className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">📹 CCTV & Security Systems</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Smart, reliable surveillance for homes, offices & industries.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>CCTV & IP Cameras</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>DVR/NVR Systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Access Control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Public Address System</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Flap Barriers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Automatic Boom Barriers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Road Safety Devices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Solar Road Studs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Solar Traffic Blinker Lights</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Networking */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Network className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">🌐 Networking Solutions</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Fast, stable & well-planned connectivity.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Wi-Fi Layout & Optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Routers & Switches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>LAN / Fiber / Structured Cabling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Enterprise Network Setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Wireless Networks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Auditorium Networking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Video Conferencing Solutions</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Digital Marketing */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">📈 Digital Marketing & Branding</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Creative, strategic and result-driven digital growth.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Social Media Management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Political & Corporate Branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Paid Ads (Google / Meta)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Lead Generation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Graphic & Content Strategy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Brand Identity Development</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Industrial */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FactoryIcon className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">🏭 Industrial & Institutional Solutions</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Heavy-duty systems designed for demanding environments.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Factory & Warehouse CCTV</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Fire Hydrant Systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Automatic Fire Sprinkler Systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Industrial Wi-Fi & Network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Access Control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Industrial Monitoring Solutions</span>
                    </li>
                  </ul>
                </motion.div>

                {/* AV Solutions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Video className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">🎥 Audio-Visual & Presentation Solutions</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Modern communication and presentation tools.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Projectors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Motorized & Normal Projection Screens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Motorized Projector Lifts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Interactive Smart Boards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Visualizers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Wireless Presenters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Complete Auditorium AV Setup</span>
                    </li>
                  </ul>
                </motion.div>

                {/* IT Solutions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor className="w-8 h-8 text-gray-900 flex-shrink-0" />
                    <h3 className="text-xl font-serif font-bold text-gray-900">🖥 IT & Classroom Equipment</h3>
                  </div>
                  <p className="text-gray-700 font-serif mb-4 font-semibold">
                    Tech tools for learning, presentations & operations.
                  </p>
                  <p className="text-gray-700 font-serif mb-3 text-sm">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 font-serif">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Laptops & Desktops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>LED & LCD TVs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Writing Boards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Display Boards, Information Boards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Teaching & Training Equipment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>Epoxy Adhesive & IT Accessories</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. Our Philosophy / How We Work */}
        <section ref={philosophyRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={philosophyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                How We Work — Simple, Clear & Human
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: "1",
                    title: "We Understand You",
                    description: "Your goals, your space, your challenges — everything begins with listening.",
                    punchline: "Because your needs are as unique as your environment.",
                  },
                  {
                    step: "2",
                    title: "We Suggest What Fits",
                    description: "Honest, clear, and need-based recommendations without unnecessary add-ons.",
                    punchline: "Because the right solution should save time and fit your budget.",
                  },
                  {
                    step: "3",
                    title: "We Execute with Care",
                    description: "Clean installation, smooth configuration, and reliable performance.",
                    punchline: "Because good work should look effortless and work perfectly.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    animate={philosophyInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-gray-900 transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 font-serif mb-4">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-500 font-serif italic">
                      {item.punchline}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. Meet Honey — Our AI Assistant */}
        <section ref={honeyRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={honeyInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-2xl border-2 border-yellow-200 p-8 md:p-12 text-center">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-block mb-6"
                >
                  <Bot className="w-16 h-16 text-yellow-600 mx-auto" />
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                  Meet Honey — Your AI Assistant
                </h2>
                <p className="text-lg text-gray-700 font-serif mb-4 max-w-2xl mx-auto">
                  Honey is our smart AI assistant that guides you 24/7.
                </p>
                <p className="text-lg text-gray-700 font-serif mb-6 max-w-2xl mx-auto">
                  From choosing the right CCTV to understanding digital marketing or planning networking — Honey gives instant, clear, helpful answers.
                </p>
                <p className="text-lg text-gray-900 font-serif font-semibold mb-8">
                  Technology that listens.<br />Technology that helps.<br />Technology made human.
                </p>

                <Button
                  onClick={handleOpenHoneyChat}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-serif font-bold shadow-lg"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Chat with Honey
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 7. Our Values */}
        <section ref={valuesRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={valuesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                Our Values
              </h2>
              <p className="text-gray-600 font-serif text-center mb-12">
                Human, Not Corporate
              </p>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const IconComponent = value.icon;
                  return (
                    <motion.div
                      key={value.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-gray-900 transition-all hover:shadow-lg"
                    >
                      <IconComponent className="w-10 h-10 text-gray-900 mx-auto mb-4" />
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-serif">
                        {value.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 8. Why People Choose D.G.Yard */}
        <section ref={whyChooseRef} className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whyChooseInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 text-center">
                Why People Choose D.G.Yard
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-12"></div>

              <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-8 md:p-12">
                <ul className="space-y-4">
                  {whyChoosePoints.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={whyChooseInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6 text-gray-900 flex-shrink-0 mt-0.5" />
                      <span className="text-lg text-gray-700 font-serif">{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 9. Industries We Serve */}
        <section ref={industriesRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={industriesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Industries We Serve
              </h2>
              <p className="text-gray-600 font-serif mb-2">Show experience + versatility</p>
              <div className="w-24 h-1 bg-gray-900 mx-auto mt-4"></div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {industries.map((industry, index) => {
                const IconComponent = industry.icon;
                return (
                  <motion.div
                    key={industry.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={industriesInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center bg-white rounded-lg p-6 border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <IconComponent className="w-12 h-12 text-gray-700 group-hover:text-gray-900 mx-auto mb-4 transition-colors" />
                    <h3 className="text-sm font-serif font-semibold text-gray-900">
                      {industry.name}
                    </h3>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10. Customer Stories / Testimonials */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Customer Feedback
              </h2>
              <p className="text-gray-600 font-serif mb-2 font-semibold">
                What Our Customers Say
              </p>
              <p className="text-gray-600 font-serif">
                Real reviews that reflect trust, clean installation, reliable support, and digital excellence.
              </p>
              <div className="w-24 h-1 bg-gray-900 mx-auto mt-4"></div>
            </motion.div>
            <Testimonials />
          </div>
        </section>

        {/* 11. Our Vision */}
        <section ref={visionRef} className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={visionInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-8"></div>
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 md:p-12">
                <p className="text-xl md:text-2xl text-gray-700 font-serif leading-relaxed">
                  To create a future where every home, business and institution enjoys digital | secure | smart living through modern technology and human-centered service.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 12. Final CTA */}
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

              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                Let's Build Something Smart – Together
              </h2>
              <p className="text-lg text-gray-200 font-serif mb-8 max-w-2xl mx-auto">
                Whether it's security, networking, digital branding or full infrastructure — D.G.Yard is ready to help you move forward.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-serif font-bold shadow-lg"
                >
                  <Link href="/services/book" className="flex items-center gap-2">
                    Book a Service
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-serif font-bold bg-white/5 backdrop-blur-sm"
                >
                  <Link href="/quotation" className="flex items-center gap-2">
                    Request a Quote
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
                  Chat with Honey
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

