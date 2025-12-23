"use client";

import { 
  Briefcase, TrendingUp, CheckCircle2, Shield, 
  AlertCircle, DollarSign, ShoppingBag, Clock, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    warrantyJobs: number;
    openDisputes: number;
    freeTrialUsed: number;
    freeTrialRemaining: number;
    totalEarnings: number;
    totalServiceSpend: number;
  };
}

export function DealerStatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Service Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: null,
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Clock,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: stats.activeJobs > 0 ? "up" : null,
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: CheckCircle2,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: "up",
    },
    {
      title: "Jobs Under Warranty",
      value: stats.warrantyJobs,
      icon: Shield,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      trend: null,
    },
    {
      title: "Open Disputes",
      value: stats.openDisputes,
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      trend: stats.openDisputes > 0 ? "down" : null,
      urgent: stats.openDisputes > 0,
    },
    {
      title: "Free Trial",
      value: `${stats.freeTrialUsed} / ${stats.freeTrialUsed + stats.freeTrialRemaining}`,
      icon: TrendingUp,
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      subtitle: `${stats.freeTrialRemaining} remaining`,
      trend: null,
    },
    {
      title: "Total Earnings",
      value: `₹${stats.totalEarnings.toLocaleString("en-IN")}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "up",
      highlight: true,
    },
    {
      title: "Total Service Spend",
      value: `₹${stats.totalServiceSpend.toLocaleString("en-IN")}`,
      icon: ShoppingBag,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
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
              {card.trend && (
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                  ${card.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                `}>
                  {card.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{card.title}</h3>
            <p className={`text-3xl font-bold mb-1 ${card.highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-xs text-gray-500 mt-2 font-medium">{card.subtitle}</p>
            )}
            {card.urgent && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-600 font-semibold">⚠️ Requires attention</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}







