"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, Lock, Github, Facebook, Phone, ShoppingBag, 
  Calendar, MapPin, FileText, CheckCircle2, Sparkles,
  Package, Shield, Star, TrendingUp
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { OTPLogin } from "./otp-login";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid credentials");
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        console.log(`[SignIn] ${new Date().toISOString()} - Login successful, waiting 200ms for session cookie to be set...`);
        
        // Wait a bit for NextAuth to set the session cookie
        setTimeout(() => {
          console.log(`[SignIn] Redirecting to: ${callbackUrl}`);
          // Use window.location for a full page reload to ensure session is ready
          window.location.href = callbackUrl;
        }, 200);
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      toast.error("Failed to sign in");
      setLoading(false);
    }
  };

  const signInFeatures = [
    {
      icon: Sparkles,
      title: "Honey AI Assistant",
      description: "Get instant answers, product recommendations, and expert advice 24/7. Supports voice input in Hindi & English!",
      color: "text-yellow-500",
      highlight: true
    },
    {
      icon: ShoppingBag,
      title: "Order Management",
      description: "Track all your orders in real-time, view order history, and get delivery updates",
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      title: "Service Bookings",
      description: "Book installation, maintenance & service appointments with ease",
      color: "text-green-600"
    },
    {
      icon: FileText,
      title: "Saved Quotations",
      description: "Access, compare, and purchase your saved quotations anytime",
      color: "text-purple-600"
    },
    {
      icon: MapPin,
      title: "Multiple Addresses",
      description: "Save multiple delivery addresses for quick checkout",
      color: "text-orange-600"
    },
    {
      icon: Shield,
      title: "Secure Profile",
      description: "Manage your account settings, payment methods & preferences securely",
      color: "text-indigo-600"
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
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 h-full lg:min-h-[600px] flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex-shrink-0"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white font-serif">Welcome Back!</h2>
              </div>
              <p className="text-gray-300 text-lg font-serif">
                Sign in to access your personalized dashboard and manage everything effortlessly.
              </p>
            </motion.div>

            <div className="space-y-3 flex-1">
              {signInFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                      feature.highlight 
                        ? "bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border-yellow-400/30 hover:bg-yellow-500/25" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className={`p-2.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all ${feature.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 font-serif text-sm ${
                        feature.highlight ? "text-yellow-300" : "text-white"
                      }`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 text-xs leading-relaxed">{feature.description}</p>
                    </div>
                    {feature.highlight && (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-serif">Secure & Protected</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto lg:max-w-full"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100 h-full lg:min-h-[600px] flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-2 font-serif">Welcome Back</h1>
              <p className="text-gray-600 font-serif">Sign in to your account to continue</p>
            </motion.div>

            {/* Login Method Toggle */}
            <AnimatePresence mode="wait">
              <motion.div
                key={loginMethod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 mb-6 p-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
              >
                <motion.button
                  type="button"
                  onClick={() => setLoginMethod("email")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    loginMethod === "email"
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setLoginMethod("otp")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    loginMethod === "otp"
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone OTP
                </motion.button>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {loginMethod === "email" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleEmailSignIn}
                  className="space-y-5 mb-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="email" className="text-gray-700 font-semibold mb-2 block">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="password" className="text-gray-700 font-semibold mb-2 block">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-600 transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center cursor-pointer group">
                      <input type="checkbox" className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                    </label>
                    <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          Signing in...
                        </motion.span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <OTPLogin />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-serif">Or continue with</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
              transition={{ delay: 0.7 }}
              className="text-center text-sm pt-4 border-t border-gray-100"
            >
              <span className="text-gray-600 font-serif">Don't have an account? </span>
              <Link href="/auth/signup" className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors font-serif">
                Sign Up
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
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 font-serif text-center">What you'll get:</h3>
            <div className="grid grid-cols-2 gap-3">
              {signInFeatures.slice(0, 4).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                      feature.highlight 
                        ? "bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 border-yellow-400/30" 
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white/10 ${feature.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className={`font-semibold text-xs text-center font-serif ${
                      feature.highlight ? "text-yellow-300" : "text-white"
                    }`}>
                      {feature.title}
                    </h4>
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-4 pt-4 border-t border-white/10 text-center"
            >
              <p className="text-yellow-400 text-xs font-serif">✨ Plus: Honey AI Assistant with Voice Support!</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

