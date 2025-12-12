"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, Lock, User, Phone, Github, Facebook, ShoppingBag, 
  Calendar, MapPin, FileText, CheckCircle2, Sparkles,
  Package, Shield, Star, TrendingUp, Gift, CreditCard
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Account created! Signing in...");
        
        // Wait a bit for user to be fully created in database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to sign in with credentials
        try {
          const signInResult = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
            callbackUrl: "/dashboard",
          });
          
          console.log("Sign in result:", signInResult);
          
          if (signInResult?.ok) {
            toast.success("Welcome! Redirecting...");
            // If callbackUrl contains #calculator, scroll to calculator section after redirect
            if (callbackUrl.includes("#calculator")) {
              router.push(callbackUrl);
              router.refresh();
              // Scroll to calculator section after page loads
              setTimeout(() => {
                const calculatorSection = document.getElementById("calculator");
                if (calculatorSection) {
                  calculatorSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }, 500);
            } else {
              router.push(callbackUrl);
              router.refresh();
            }
          } else if (signInResult?.error) {
            console.error("Sign in error:", signInResult.error);
            toast.success("Account created! Please sign in.");
            router.push(`/auth/signin?email=${encodeURIComponent(formData.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
          } else {
            // If sign in fails, redirect to sign in page
            toast.success("Account created! Please sign in with your credentials.");
            router.push(`/auth/signin?email=${encodeURIComponent(formData.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
          }
        } catch (signInError: any) {
          console.error("Sign in error:", signInError);
          toast.success("Account created! Please sign in manually.");
          router.push("/auth/signin?email=" + encodeURIComponent(formData.email));
        }
      } else {
        // Show specific error message
        const errorMessage = data.error || "Failed to create account";
        toast.error(errorMessage);
        console.error("Signup error:", data);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error("Failed to sign up");
      setLoading(false);
    }
  };

  const signUpFeatures = [
    {
      icon: Sparkles,
      title: "Honey AI Assistant (Free!)",
      description: "Get 24/7 instant help with product selection, quotations, troubleshooting & expert advice. Supports Hindi & English voice commands!",
      color: "text-yellow-400",
      highlight: true
    },
    {
      icon: ShoppingBag,
      title: "Exclusive Member Offers",
      description: "Get access to special deals, early-bird discounts & member-only pricing",
      color: "text-blue-600"
    },
    {
      icon: Package,
      title: "Real-time Order Tracking",
      description: "Track your orders from confirmation to delivery with live updates",
      color: "text-green-600"
    },
    {
      icon: Calendar,
      title: "One-Click Service Booking",
      description: "Book installation, maintenance & consultation appointments instantly",
      color: "text-purple-600"
    },
    {
      icon: FileText,
      title: "Unlimited Quotations",
      description: "Save, compare & manage unlimited quotations for future reference",
      color: "text-orange-600"
    },
    {
      icon: CreditCard,
      title: "Secure Payment Gateway",
      description: "Multiple payment methods with bank-level encryption & fraud protection",
      color: "text-indigo-600"
    },
    {
      icon: Star,
      title: "Priority Customer Support",
      description: "Get faster response times & dedicated support from our team",
      color: "text-yellow-600"
    },
    {
      icon: TrendingUp,
      title: "Personalized Recommendations",
      description: "Get product suggestions based on your browsing & purchase history",
      color: "text-pink-600"
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Features Section - Desktop */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 shadow-2xl border border-blue-700 h-full lg:min-h-[650px] flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white font-serif">Join D.G.Yard Today!</h2>
              </div>
              <p className="text-blue-100 text-lg font-serif">
                Create your account and unlock a world of smart solutions, exclusive offers, and seamless shopping experience.
              </p>
            </motion.div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-2">
              {signUpFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.07 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                      feature.highlight 
                        ? "bg-gradient-to-r from-yellow-400/25 to-yellow-500/15 border-yellow-400/40 hover:bg-yellow-400/30 shadow-lg shadow-yellow-500/20" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all ${feature.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-0.5 font-serif text-xs ${
                        feature.highlight ? "text-yellow-200" : "text-white"
                      }`}>
                        {feature.title}
                      </h3>
                      <p className="text-blue-100 text-[10px] leading-relaxed">{feature.description}</p>
                    </div>
                    {feature.highlight ? (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                      </motion.div>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-1" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-auto pt-6 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-serif">100% Secure & Free to Join</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sign Up Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto lg:max-w-full"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100 h-full lg:min-h-[650px] flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8 flex-shrink-0"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-2 font-serif">Create Account</h1>
              <p className="text-gray-600 font-serif">Sign up to unlock amazing features</p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-5 mb-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="name" className="text-gray-700 font-semibold mb-2 block">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="email" className="text-gray-700 font-semibold mb-2 block">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="phone" className="text-gray-700 font-semibold mb-2 block">Phone Number</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label htmlFor="password" className="text-gray-700 font-semibold mb-2 block">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                    placeholder="•••••••• (min 8 characters)"
                    required
                    minLength={8}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold mb-2 block">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      Creating account...
                    </motion.span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-serif">Or sign up with</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                  className="w-full h-12 border-2 rounded-xl hover:border-gray-400 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("facebook")}
                  disabled={loading}
                  className="w-full h-12 border-2 rounded-xl hover:border-gray-400 transition-all"
                >
                  <Facebook className="w-5 h-5 mr-2" />
                  Facebook
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center text-sm pt-4 border-t border-gray-100"
            >
              <span className="text-gray-600 font-serif">Already have an account? </span>
              <Link href="/auth/signin" className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors font-serif">
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:hidden mt-8"
        >
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 shadow-xl border border-blue-700">
            <h3 className="text-xl font-bold text-white mb-4 font-serif text-center">Join us to unlock:</h3>
            <div className="grid grid-cols-2 gap-3">
              {signUpFeatures.slice(0, 4).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                      feature.highlight 
                        ? "bg-gradient-to-br from-yellow-400/25 to-yellow-500/15 border-yellow-400/40 shadow-lg shadow-yellow-500/20" 
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white/10 ${feature.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className={`font-semibold text-xs text-center font-serif ${
                      feature.highlight ? "text-yellow-200" : "text-white"
                    }`}>
                      {feature.title.split(" ")[0]} {feature.title.split(" ")[1]}
                    </h4>
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 pt-4 border-t border-white/10 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-serif">100% Secure & Free</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

