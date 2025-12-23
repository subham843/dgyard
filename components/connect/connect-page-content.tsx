"use client";

import { Button } from "@/components/ui/button";
import { 
  Shield, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Users,
  Wrench,
  ShoppingBag,
  Brain,
  Navigation,
  Lock,
  Zap,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function ConnectPageContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-pulse" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-4">
                🌐 D.G.Yard Connect
              </h1>
              <p className="text-2xl md:text-3xl font-serif text-gray-700 mb-2">
                Connect. Negotiate. Track. Complete.
              </p>
              <p className="text-lg md:text-xl text-gray-600 font-medium italic">
                👉 "Kaam real hai, system transparent hai."
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900 mb-4">
                One Platform to Connect Dealers, Technicians & Customers
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                Manage service jobs, negotiate price fairly, track technicians live,
                and complete work securely with OTP, AI support & warranty protection.
              </p>
              <p className="text-base text-gray-600 font-medium italic">
                👉 "Dealer ka customer, technician ka kaam — platform sirf support."
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mt-8"
            >
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-serif">
                <Link href="/connect/dealer/signup">
                  <Users className="w-5 h-5 mr-2" />
                  Join as Dealer
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-serif">
                <Link href="/connect/technician/signup">
                  <Wrench className="w-5 h-5 mr-2" />
                  Join as Technician
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-6 text-lg font-serif">
                <Link href="/services/book">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Book a Service
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Strip */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-serif">OTP-Based Job Completion</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-serif">Live Technician Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="font-serif">Escrow & Warranty Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-serif">Controlled Price Negotiation</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span className="font-serif">AI-Assisted (Human-Controlled)</span>
            </div>
          </div>
          <p className="text-center mt-4 text-blue-100 font-medium italic">
            👉 "Bina jhol-jhaal, bina pressure."
          </p>
        </div>
      </section>

      {/* What is D.G.Yard Connect */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                🤝 WHAT IS D.G.Yard CONNECT?
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                D.G.Yard Connect is a neutral service execution platform that helps
                dealers assign work, technicians get verified jobs, and customers see
                everything clearly — from assignment to completion.
              </p>
              <p className="text-base text-gray-600 font-medium italic">
                👉 "Na middleman, na interference."
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-green-50 p-6 rounded-lg border-2 border-green-200"
              >
                <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  What we DO
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Connect nearby technicians</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Enable fair price discussion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Track work live</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Protect payment & quality</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-red-50 p-6 rounded-lg border-2 border-red-200"
              >
                <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  What we DON'T do
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>No lead selling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>No customer data misuse</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>No direct competition with dealers</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Test Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Test Section</h2>
          <p className="text-lg text-gray-700">If you can see this, the page is working!</p>
        </div>
      </section>

      {/* Footer Trust Strip */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-serif">Neutral Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="font-serif">AI-Assisted, Human-Controlled</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="font-serif">OTP & Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-serif">Warranty Backed Services</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}












