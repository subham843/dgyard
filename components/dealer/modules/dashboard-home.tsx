"use client";

import { 
  Briefcase, TrendingUp, CheckCircle2, Shield, AlertCircle, 
  DollarSign, ShoppingBag, Clock, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Users, FileText, Activity,
  Plus, ExternalLink, Calendar, Star, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

interface DashboardHomeProps {
  stats: {
    totalJobsPosted: number;
    activeServiceJobs: number;
    openBiddingJobs: number;
    productsLive: number;
    todaySales: number;
    monthlySales: number;
    pendingPayments: number;
    activeWarranties: number;
    openComplaints: number;
    lowStockAlerts: number;
    trustScore?: number;
    trustBadge?: string;
    trustBadgeColor?: string;
    averageRating?: number;
    totalReviews?: number;
  };
  dealerInfo: any;
  onNavigate?: (module: string, params?: any) => void;
  onStatsUpdate?: () => void;
}

export function DealerDashboardHome({ stats, dealerInfo, onNavigate, onStatsUpdate }: DashboardHomeProps) {
  // Real-time stats update every 60 seconds
  useRealtimeNotifications({
    interval: 60000,
    enabled: true,
    onUpdate: onStatsUpdate,
  });
  const statCards = [
    {
      title: "Total Jobs Posted",
      value: stats.totalJobsPosted,
      icon: Briefcase,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12%",
      changeType: "up" as const,
      actionLabel: "View Jobs",
      actionModule: "service-jobs",
    },
    {
      title: "Active Service Jobs",
      value: stats.activeServiceJobs,
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      urgent: stats.activeServiceJobs > 0,
      actionModule: "service-jobs",
    },
    {
      title: "Open Bidding Jobs",
      value: stats.openBiddingJobs,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      actionModule: "service-jobs",
    },
    {
      title: "Products Live",
      value: stats.productsLive,
      icon: Package,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      actionModule: "products",
    },
    {
      title: "Today Sales",
      value: `₹${stats.todaySales.toLocaleString("en-IN")}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      highlight: true,
      change: "+5.2%",
      changeType: "up" as const,
    },
    {
      title: "Monthly Sales",
      value: `₹${stats.monthlySales.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      gradient: "from-teal-500 to-teal-600",
      bgGradient: "from-teal-50 to-teal-100",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      change: "+18.5%",
      changeType: "up" as const,
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: AlertCircle,
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      urgent: stats.pendingPayments > 0,
      actionModule: "payments-settlement",
    },
    {
      title: "Active Warranties",
      value: stats.activeWarranties,
      icon: Shield,
      gradient: "from-cyan-500 to-cyan-600",
      bgGradient: "from-cyan-50 to-cyan-100",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      actionModule: "service-jobs",
    },
    {
      title: "Open Complaints",
      value: stats.openComplaints,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      urgent: stats.openComplaints > 0,
      actionModule: "support",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockAlerts,
      icon: Package,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      urgent: stats.lowStockAlerts > 0,
      actionModule: "inventory",
    },
  ];

  // Add rating and trust badge display if available
  const ratingAndTrustCards = [];
  if (stats.trustScore !== undefined || stats.averageRating !== undefined) {
    ratingAndTrustCards.push({
      title: "Trust Score & Rating",
      trustScore: stats.trustScore,
      trustBadge: stats.trustBadge,
      trustBadgeColor: stats.trustBadgeColor,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      icon: Shield,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    });
  }

  const handleQuickAction = (module: string) => {
    onNavigate?.(module);
  };

  const quickActions = [
    {
      title: "Post New Service Job",
      description: "Create a new service request",
      icon: Briefcase,
      color: "bg-blue-500 hover:bg-blue-600",
      module: "post-job",
    },
    {
      title: "Add New Product",
      description: "Add product to your catalog",
      icon: Package,
      color: "bg-green-500 hover:bg-green-600",
      module: "products",
    },
    {
      title: "View Orders",
      description: "Manage product orders",
      icon: ShoppingBag,
      color: "bg-purple-500 hover:bg-purple-600",
      module: "orders",
    },
    {
      title: "View Analytics",
      description: "Check performance reports",
      icon: TrendingUp,
      color: "bg-indigo-500 hover:bg-indigo-600",
      module: "reports-analytics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {dealerInfo?.businessName || "Dealer"}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Here's your business overview for today
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString("en-IN", { 
                    weekday: "long", 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Activity className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                bg-white rounded-xl shadow-sm border border-gray-200 
                p-6 hover:shadow-lg hover:scale-[1.02] 
                transition-all duration-300 cursor-pointer
                ${card.urgent ? 'ring-2 ring-red-200' : ''}
                ${card.highlight ? 'ring-2 ring-emerald-200' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} ${card.iconColor} p-3 rounded-xl shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                {card.change && (
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                    ${card.changeType === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                  `}>
                    {card.changeType === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {card.change}
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">{card.title}</h3>
              <p className={`text-3xl font-bold mb-3 ${card.highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
                {card.value}
              </p>
              {card.actionLabel && card.actionModule && (
                <button 
                  onClick={() => onNavigate?.(card.actionModule!)}
                  className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  {card.actionLabel}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              {card.urgent && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600 font-semibold">⚠️ Requires attention</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500 mt-1">Common tasks and shortcuts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  onNavigate?.(action.module);
                }}
                className={`
                  ${action.color} text-white rounded-xl p-6 text-left
                  hover:shadow-lg transition-all duration-300
                  transform hover:scale-105
                `}
              >
                <Icon className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                <p className="text-white/80 text-sm">{action.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Latest updates and transactions</p>
          </div>
          <Button variant="outline" size="sm">
            View All
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">No recent activity</p>
              <p className="text-sm text-gray-500">Your recent jobs and orders will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Status Alert */}
      {dealerInfo && !dealerInfo.isKycCompleted && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Complete KYC Verification</h3>
              <p className="text-sm text-gray-700 mb-4">
                Complete your KYC verification to unlock all features and enable product settlements.
              </p>
              <Button 
                onClick={() => onNavigate?.("kyc-verification")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Complete KYC
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

