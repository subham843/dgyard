"use client";

import { Button } from "@/components/ui/button";
import { 
  Palette,
  Share2,
  MapPin,
  TrendingUp,
  Code,
  Smartphone,
  Monitor,
  PenTool,
  Video,
  Camera,
  FileText,
  Mail,
  Bot,
  CheckCircle2,
  HelpCircle,
  Phone,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
  Target,
  BarChart3,
  Layers,
  Rocket,
  Star,
  Award,
  Users,
  Clock,
  Shield,
  Search,
  Mail as MailIcon,
  MessageSquare,
  BarChart,
  Megaphone,
  Vote,
  MessageCircle,
  TrendingUp as TrendingUpIcon,
  UserCheck,
  ShieldCheck,
  Cpu,
  Database,
  Network,
  Code2,
  Terminal,
  Activity,
  Brain,
  TrendingDown,
  LineChart,
  Quote,
  Star as StarIcon,
  CheckCircle2 as CheckIcon
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { InlineAIHelper } from "@/components/ai-assistant/inline-ai-helper";
import { MarketingAuditWidget } from "@/components/ai-assistant/marketing-audit-widget";

// Icon mapping
const iconMap: Record<string, any> = {
  palette: Palette,
  share: Share2,
  map: MapPin,
  trending: TrendingUp,
  code: Code,
  smartphone: Smartphone,
  monitor: Monitor,
  pen: PenTool,
  video: Video,
  camera: Camera,
  file: FileText,
  mail: Mail,
  megaphone: Megaphone,
  target: Target,
  "message-circle": MessageCircle,
  "bar-chart": BarChart,
  "shield-check": ShieldCheck,
  "message-square": MessageSquare,
};

// 5 Service Pillars
const servicePillars = [
  {
    id: 1,
    icon: Palette,
    title: "Brand & Identity",
    services: [
      "Brand Identity & Positioning",
      "Logo & Visual Identity",
      "Brand Voice & Messaging",
      "Competitive Market Research",
      "Corporate Profile Design"
    ],
    impact: "A brand that looks, feels, and sounds premium.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50"
  },
  {
    id: 2,
    icon: TrendingUp,
    title: "Digital Marketing & Growth",
    services: [
      "Social Media Management",
      "Performance Marketing (Google Ads, Meta Ads, LinkedIn Ads)",
      "Organic Growth & SEO",
      "Reputation & Review Management"
    ],
    impact: "Constant visibility + real leads + long-term growth.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50"
  },
  {
    id: 3,
    icon: MapPin,
    title: "Local Business Growth",
    services: [
      "Google Business Profile Setup",
      "Profile Optimization",
      "Local Ranking Improvement",
      "Citation Building",
      "Review Strategy & Improvement"
    ],
    impact: "Be the first business customers find.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50"
  },
  {
    id: 4,
    icon: Code,
    title: "Digital Development Services",
    services: [
      "Website Development (Business, E-commerce, Portfolio)",
      "Web App Development (CRM, Dashboards, Admin Panels)",
      "Mobile App Development (Android, iOS, Hybrid)",
      "Custom Software Development",
      "UI/UX Design"
    ],
    impact: "Technology that fits your business — not the other way around.",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50"
  },
  {
    id: 5,
    icon: Video,
    title: "Content & Creative Production",
    services: [
      "Videos (Reels / Shorts)",
      "Product Photography",
      "Ad Creatives",
      "Blog Writing",
      "Email Copy & Campaigns",
      "Motion Graphics"
    ],
    impact: "Creative content that actually converts.",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50"
  }
];

// Packages
const packages = [
  {
    name: "Starter",
    subtitle: "Digital Presence Pack",
    features: ["GBP + Website + Branding basics"],
  },
  {
    name: "Growth",
    subtitle: "Lead Generation Pack",
    features: ["SEO + Ads + Social Media Management"],
  },
  {
    name: "Premium",
    subtitle: "Full Brand Pack",
    features: ["Branding + Website + Social + Ads + Automation"],
  },
  {
    name: "Enterprise",
    subtitle: "Custom Digital Transformation Pack",
    features: ["Custom software + Web apps + CRM + Mobile apps + Full marketing"],
  },
];

// Why Choose Points
const whyChoosePoints = [
  { icon: Layers, text: "One company for marketing + branding + website + app + custom software" },
  { icon: Sparkles, text: "Clean, modern and optimized designs" },
  { icon: Target, text: "Strategy-first approach" },
  { icon: Bot, text: "Honey AI audit support" },
  { icon: Users, text: "Long-term partnership and support" },
  { icon: Shield, text: "Transparent communication" },
  { icon: Clock, text: "On-time delivery" },
  { icon: Award, text: "Industry-level knowledge" }
];

// FAQs
const defaultFAQs = [
  {
    question: "Do you build websites & apps from scratch?",
    answer: "Yes — fully custom, modern, fast & SEO-friendly."
  },
  {
    question: "Can Honey audit my website?",
    answer: "Yes — Honey checks performance, SEO, content, UX, and missing elements."
  },
  {
    question: "Do you provide monthly marketing plans?",
    answer: "Yes — from social content to ad management to complete digital growth."
  }
];

// Tech-Style Testimonials Component
function TestimonialsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("/api/reviews");
        const data = await response.json();
        if (data.reviews) {
          setReviews(data.reviews.slice(0, 6)); // Show 6 reviews
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // Fallback reviews
        setReviews([
          {
            id: "1",
            name: "Rajesh Kumar",
            role: "Business Owner",
            content: "D.G.Yard transformed our online presence. Our Google Business ranking improved significantly and we're getting real customers now.",
            rating: 5,
            verified: true,
            source: "Google"
          },
          {
            id: "2",
            name: "Priya Sharma",
            role: "Marketing Director",
            content: "The social media strategy and ad campaigns have been game-changing. ROI improved by 300% in just 3 months.",
            rating: 5,
            verified: true,
            source: "Facebook"
          },
          {
            id: "3",
            name: "Amit Patel",
            role: "Startup Founder",
            content: "Website redesign and branding work exceeded expectations. Clean, modern, and conversion-focused. Highly recommend!",
            rating: 5,
            verified: true,
            source: "Google"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || isPaused || reviews.length === 0) return;

    const scrollContainer = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 0.3;

    const scroll = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition += scrollSpeed;
        if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollPosition = 0;
        }
        scrollContainer.scrollTo({ left: scrollPosition, behavior: "auto" });
      }
    };

    const interval = setInterval(scroll, 16);
    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[350px] bg-slate-800/50 rounded-xl h-64 animate-pulse border border-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          ref={index === 0 ? ref : null}
          initial={{ opacity: 0, x: 40, rotateY: -15 }}
          animate={inView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="group relative flex-shrink-0 w-[340px] md:w-[380px] snap-start"
        >
          {/* Tech Review Card */}
          <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all overflow-hidden">
            {/* Animated Corner Accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400/30 rounded-br-xl" />

            {/* Animated Glow on Hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity"
              animate={inView && index % 2 === 0 ? {
                x: ['-100%', '200%'],
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Quote Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={inView ? { scale: 1, rotate: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
              className="absolute top-4 right-4"
            >
              <Quote className="w-8 h-8 text-cyan-400/20" />
            </motion.div>

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 + i * 0.05, type: "spring" }}
                >
                  <StarIcon
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-cyan-400 text-cyan-400"
                        : "fill-gray-700 text-gray-700"
                    }`}
                  />
                </motion.div>
              ))}
            </div>

            {/* Review Content */}
            <p className="text-gray-300 mb-6 leading-relaxed font-light text-sm relative z-10">
              "{review.content}"
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

            {/* Author Info */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-2 border-cyan-400/50">
                  <span className="text-white font-mono font-bold text-lg">
                    {review.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {review.verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center border-2 border-slate-900"
                  >
                    <CheckIcon className="w-3 h-3 text-slate-900" />
                  </motion.div>
                )}
              </div>

              {/* Name and Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-mono font-bold text-white text-sm mb-1 truncate">
                  {review.name}
                </h4>
                {review.role && (
                  <p className="text-xs text-cyan-400 font-mono truncate">
                    {'>'} {review.role}
                  </p>
                )}
                {review.source && (
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    via {review.source}
                  </p>
                )}
              </div>
            </div>

            {/* Tech Decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function DigitalMarketingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [introRef, introInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [honeyRef, honeyInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [packagesRef, packagesInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [pageContent, setPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuditWidget, setShowAuditWidget] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 100]);

  useEffect(() => {
    fetchPageContent();
    fetchUserProfile();
  }, [session]);

  const fetchPageContent = async () => {
    try {
      const response = await fetch("/api/admin/page-content/digital-marketing", {
        next: { revalidate: 300 },
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

  const fetchUserProfile = async () => {
    if (status !== "authenticated" || !session?.user) {
      setProfileLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const isProfileComplete = useMemo(() => {
    if (!userProfile) return false;
    return !!(
      userProfile.name &&
      userProfile.email &&
      userProfile.phone &&
      userProfile.phoneVerified
    );
  }, [userProfile]);

  // Check login and profile before opening audit widget
  const checkAuthAndProfile = async (action: () => void, buttonAction: string) => {
    // Check if user is logged in
    if (status !== "authenticated" || !session?.user) {
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
      const callbackUrl = `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Check if profile is complete
    if (!isProfileComplete) {
      toast.error("Please complete your profile first (Name, Email, Phone with OTP verification)");
      const currentUrl = (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");
      const callbackUrl = `/dashboard/profile?callbackUrl=${encodeURIComponent(currentUrl)}&action=${buttonAction}`;
      router.push(callbackUrl);
      return;
    }

    // Execute the action
    action();
  };

  const handleOpenHoneyAudit = () => {
    checkAuthAndProfile(() => {
      setShowAuditWidget(true);
    }, "OPEN_MARKETING_AUDIT");
  };

  const handleAuditAction = () => {
    checkAuthAndProfile(() => {
      setShowAuditWidget(true);
    }, "OPEN_MARKETING_AUDIT");
  };

  useEffect(() => {
    const handleOpenAudit = () => {
      setShowAuditWidget(true);
    };
    window.addEventListener("openHoneyAudit", handleOpenAudit);
    return () => window.removeEventListener("openHoneyAudit", handleOpenAudit);
  }, []);

  const heroData = pageContent?.hero || {
    title: "Digital Marketing, Branding & Digital Transformation Solutions",
    subtitle: "Grow your brand, build your digital identity, and scale with smart technology — all in one place.",
    tagline: "Marketing that works. Technology that grows with you.",
    buttons: [
      { text: "Get a Free Digital Audit (Ask Honey)", action: "audit", visible: true },
      { text: "Start Your Project", href: "/contact", visible: true }
    ]
  };

  const introData = pageContent?.intro || {
    text: "Your business deserves more than random posts, boosted ads, or a basic website. It deserves a clear strategy, strong branding, powerful online presence, and technology that actually works. D.G.Yard brings together marketing + branding + technology + AI to help your business grow digitally, locally, and globally. We don't just promote brands — we build them, scale them, and transform them."
  };

  const honeyData = pageContent?.honey || {
    enabled: true,
    title: "Meet Honey — Your Digital Auditor (AI)",
    description: "Honey is your AI-powered marketing & technology advisor. She audits your Google Business Profile, Website, Social profiles, Ads, SEO, Speed & performance, Branding consistency, and Local presence. NEW ability: Honey can also analyze your existing website, web app, or mobile app and tell what is missing, what is outdated, what user experience issues exist, what features should be added, how D.G.Yard can rebuild or upgrade it, and whether you should switch to an AI-powered system.",
    buttonText: "Ask Honey for a Free Audit"
  };

  const faqsData = pageContent?.faqs || defaultFAQs;
  const ctaData = pageContent?.cta || {
    title: "Build your brand. Boost your visibility. Scale your digital presence.",
    subtitle: "Let's create something powerful together.",
    buttons: [
      { text: "Ask Honey for Audit", action: "audit", visible: true },
      { text: "Start Your Project", href: "/contact", visible: true },
      { text: "Book a Call", href: "/contact?type=call", visible: true }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-cyan-400 font-mono text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Tech Background Grid */}
      <div className="fixed inset-0 opacity-10 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Hero Section - Tech Style */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
          
          {/* Animated Tech Particles */}
          {typeof window !== 'undefined' && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                opacity: 0
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}

          {/* Animated Gradient Orbs */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tech Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-mono font-semibold text-cyan-400">DIGITAL TRANSFORMATION</span>
            </motion.div>

            {/* Main Title - Tech Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-tight px-4"
            >
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Digital Marketing
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                & Branding
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light mb-4 sm:mb-6 max-w-3xl mx-auto px-4"
            >
              {heroData.subtitle}
            </motion.p>

            {/* Tagline with Tech Accent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-sm font-mono text-cyan-400">{heroData.tagline}</span>
              </div>
            </motion.div>

            {/* CTA Buttons - Tech Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center px-4"
            >
              {(heroData.buttons || []).filter((btn: any) => btn.visible !== false).map((btn: any, idx: number) => (
                btn.action === "audit" ? (
                  <Button
                    key={idx}
                    onClick={handleAuditAction}
                    size="lg"
                    className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm sm:text-base md:text-lg transition-all w-full sm:w-auto"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-center">{btn.text}</span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </Button>
                ) : (
                  <Button
                    key={idx}
                    asChild
                    size="lg"
                    variant="outline"
                    className="group border-2 border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/40 font-mono font-bold px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm sm:text-base md:text-lg transition-all w-full sm:w-auto"
                  >
                    <Link href={btn.href || "#"} className="flex items-center justify-center gap-2">
                      <span className="text-center">{btn.text}</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Link>
                  </Button>
                )
              ))}
            </motion.div>

            {/* Tech Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {[
                { label: "Projects", value: "500+", icon: Rocket },
                { label: "Clients", value: "200+", icon: Users },
                { label: "Success Rate", value: "98%", icon: TrendingUp },
                { label: "AI Powered", value: "24/7", icon: Brain }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    className="p-4 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 transition-colors"
                  >
                    <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                    <div className="text-xs text-gray-400 font-mono">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs font-mono text-gray-400">SCROLL</span>
            <div className="w-6 h-10 border-2 border-cyan-400/50 rounded-full flex justify-center p-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-3 bg-cyan-400 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Introduction Section - Tech Style */}
      <section ref={introRef} className="relative py-20 md:py-28 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={introInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Code-like brackets */}
              <div className="absolute -left-8 top-0 text-6xl font-mono text-cyan-400/20">{"{"}</div>
              <div className="absolute -right-8 bottom-0 text-6xl font-mono text-cyan-400/20">{"}"}</div>
              
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light text-center relative z-10">
                {introData.text}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Pillars - Tech Cards */}
      <section ref={servicesRef} className="relative py-20 md:py-28 bg-slate-900 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={servicesInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4"
            >
              <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/30">
                SERVICES
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Full Service Range
              </span>
            </h2>
            <p className="text-xl text-gray-400 font-light">
              5 Major Pillars for Complete Digital Transformation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicePillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, y: 40, rotateX: -15 }}
                  animate={servicesInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  {/* Tech Card */}
                  <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-xl p-8 border border-white/10 hover:border-cyan-400/50 transition-all overflow-hidden">
                    {/* Animated Border Glow */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${pillar.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`}
                    />
                    
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-xl" />
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400/30 rounded-br-xl" />

                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      className={`inline-flex p-4 rounded-lg bg-gradient-to-r ${pillar.gradient} mb-6 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>

                    <h3 className="text-2xl font-bold text-white mb-4 font-mono">{pillar.title}</h3>
                    
                    <ul className="space-y-3 mb-6">
                      {pillar.services.map((service, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={servicesInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: idx * 0.1 + i * 0.05 }}
                          className="flex items-start gap-3 text-gray-300 text-sm"
                        >
                          <Code2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{service}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs font-mono text-cyan-400">
                        {'>'} {pillar.impact}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple Honey AI Helper */}
      <section ref={honeyRef} className="relative py-16 md:py-20 bg-slate-950 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={honeyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <InlineAIHelper
              context="digital marketing & branding"
              suggestions={[
                "How to improve my Google Business ranking?",
                "What's the best social media strategy?",
                "Help me create a marketing plan",
                "How to run Facebook ads?",
                "SEO tips for my website"
              ]}
              position="inline"
            />
          </motion.div>
        </div>
      </section>

      {/* Political Campaigning Section - Tech Style */}
      {pageContent?.political?.enabled !== false && (
        <section className="relative py-20 md:py-28 bg-slate-900 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-sm font-mono text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/30 mb-4 inline-block">
                POLITICAL EXPERTISE
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-red-300 bg-clip-text text-transparent">
                  {pageContent?.political?.title || "Political Campaigning & PR Strategy"}
                </span>
              </h2>
              <p className="text-xl text-gray-400 font-light max-w-3xl mx-auto">
                {pageContent?.political?.subtitle || "Strategic election campaigns built with clarity, influence and strong public messaging."}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {(pageContent?.political?.offerings || [
                { icon: "megaphone", title: "Political Digital Campaign Management", items: ["Social media direction", "Content creation", "Engagement management", "Public perception building"] },
                { icon: "target", title: "Election Strategy & Messaging", items: ["Candidate introduction strategy", "Issue-focused messaging", "Opponent analysis", "Voter-centric positioning"] },
                { icon: "message-circle", title: "PR & Media Communication", items: ["Press releases", "Public statements", "Media coordination", "Crisis communication"] },
                { icon: "bar-chart", title: "Voter Targeting & Data Analytics", items: ["Age-based + locality-based segmentation", "Issue-based communication", "Engagement heatmaps", "Supporter activation strategy"] },
                { icon: "video", title: "Content & Creative for Political Campaigns", items: ["Videos (short reels, speeches highlights)", "Posters, banners, online creatives", "Campaign slogans", "Rally communication"] },
                { icon: "shield-check", title: "Reputation & Image Management", items: ["Review monitoring", "Public opinion analysis", "Rapid response system", "Sentiment correction strategy"] },
                { icon: "message-square", title: "WhatsApp & Community Outreach", items: ["Constituency-wide message broadcasting", "Volunteer engagement system", "Group communication flow", "Local support building"] }
              ]).map((offering: any, idx: number) => {
                const IconComponent = iconMap[offering.icon] || Megaphone;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="relative group"
                  >
                    <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-red-400/20 hover:border-red-400/50 transition-all overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all" />
                      
                      <div className="relative z-10">
                        <div className="inline-flex p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-white mb-4 shadow-lg">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white font-mono mb-4">{offering.title}</h3>
                        <ul className="space-y-2">
                          {(offering.items || []).map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                              <Code2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Political CTAs */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-mono font-bold shadow-lg shadow-red-500/50 px-8 py-6"
              >
                <Link href="/contact?type=political" className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6" />
                  Book Political Consultation
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-red-400/50 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-red-400 font-mono font-bold px-8 py-6"
              >
                <Link href="/contact?type=call&service=political" className="flex items-center gap-2">
                  <Phone className="w-6 h-6" />
                  Call Political Team
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Packages Section - Tech Style */}
      <section ref={packagesRef} className="relative py-20 md:py-28 bg-slate-900 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={packagesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/30 mb-4 inline-block">
              PACKAGES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Choose Your Plan
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={packagesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="text-xs font-mono text-cyan-400 mb-2">PACKAGE {idx + 1}</div>
                    <h3 className="text-2xl font-bold text-white font-mono mb-2">{pkg.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{pkg.subtitle}</p>
                    
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono"
                    >
                      <Link href="/contact" className="flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section - Tech Grid */}
      <section className="relative py-20 md:py-28 bg-slate-950 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/30 mb-4 inline-block">
              WHY CHOOSE US
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Built for Success
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoosePoints.map((point, idx) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 transition-all group"
                >
                  <Icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-gray-300 text-sm">{point.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Customer Reviews - Tech Style */}
      <section className="relative py-20 md:py-28 bg-slate-900 border-t border-white/10 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/30 mb-4 inline-block">
              CUSTOMER REVIEWS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                What Our Clients Say
              </span>
            </h2>
            <p className="text-xl text-gray-400 font-light">
              Real feedback from businesses we've helped grow digitally
            </p>
          </motion.div>

          <TestimonialsSection />
        </div>
      </section>

      {/* FAQ Section - Tech Style */}
      <section ref={faqRef} className="relative py-20 md:py-28 bg-slate-950 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full border border-cyan-400/30 mb-4 inline-block">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Common Questions
              </span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqsData.map((faq: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={faqInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-white/10 hover:border-cyan-400/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white font-mono mb-2">
                      <span className="text-cyan-400">Q:</span> {faq.question}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      <span className="text-cyan-400/70">A:</span> {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Tech Style */}
      <section ref={ctaRef} className="relative py-20 md:py-28 bg-gradient-to-br from-cyan-950 via-blue-950 to-indigo-950 border-t border-white/10 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Rocket className="w-16 h-16 text-cyan-400 mx-auto" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                {ctaData.title}
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 font-light">
              {ctaData.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              {ctaData.buttons.filter((btn: any) => btn.visible).map((button: any, idx: number) => (
                <Button
                  key={idx}
                  asChild={!!button.href}
                  onClick={button.action === "audit" ? handleAuditAction : undefined}
                  size="lg"
                  className={`font-mono font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all px-8 py-6 ${
                    idx === 0
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/50"
                      : "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50"
                  }`}
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

      {/* Audit Widget Modal */}
      {showAuditWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowAuditWidget(false)}
              className="absolute -top-12 right-0 text-white hover:text-cyan-400 transition-colors"
            >
              <span className="text-sm font-mono">CLOSE [X]</span>
            </button>
            <MarketingAuditWidget onClose={() => setShowAuditWidget(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
