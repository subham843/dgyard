"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, Package, Wrench, RefreshCw, 
  Download, Calendar, Building2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlatformRevenue {
  totalPlatformRevenue: number;
  serviceCommission: number;
  productCommission: number;
  platformLedgerBalance: number;
  dealerEarnings: Array<{
    dealerId: string;
    dealerName: string;
    dealerEmail: string;
    earnings: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    description: string;
    createdAt: string;
    jobNumber?: string;
    serviceType?: string;
  }>;
  period: string;
}

export function FinanceDashboard() {
  const [revenue, setRevenue] = useState<PlatformRevenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "month" | "all">("today");

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/finance/platform-revenue?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setRevenue(data);
      }
    } catch (error) {
      console.error("Error fetching platform revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading finance dashboard...</p>
        </div>
      </div>
    );
  }

  if (!revenue) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Period:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("today")}
            >
              Today
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              This Month
            </Button>
            <Button
              variant={period === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("all")}
            >
              All Time
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRevenue}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Platform Revenue"
          value={revenue.totalPlatformRevenue}
          subtitle={period === "today" ? "Today" : period === "month" ? "This Month" : "All Time"}
          icon={DollarSign}
          color="green"
          trend={null}
        />
        <StatCard
          title="Service Commission"
          value={revenue.serviceCommission}
          subtitle="From service jobs"
          icon={Wrench}
          color="blue"
          trend={null}
        />
        <StatCard
          title="Product Commission"
          value={revenue.productCommission}
          subtitle="From product sales"
          icon={Package}
          color="purple"
          trend={null}
        />
        <StatCard
          title="Platform Ledger Balance"
          value={revenue.platformLedgerBalance}
          subtitle="Total accumulated"
          icon={TrendingUp}
          color="indigo"
          trend={null}
        />
      </div>

      {/* Dealer-wise Earnings */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-blue" />
            Dealer-wise Earnings
          </h2>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dealer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {revenue.dealerEarnings.length > 0 ? (
                revenue.dealerEarnings.map((dealer) => (
                  <tr key={dealer.dealerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{dealer.dealerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dealer.dealerEmail}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      ₹{dealer.earnings.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No dealer earnings found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-blue" />
          Recent Transactions
        </h2>
        <div className="space-y-3">
          {revenue.recentTransactions.length > 0 ? (
            revenue.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  {transaction.jobNumber && (
                    <p className="text-sm text-gray-600">Job: {transaction.jobNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(transaction.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +₹{transaction.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  color: "green" | "blue" | "purple" | "indigo";
  trend: { value: number; type: "up" | "down" } | null;
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-200 text-green-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  };

  const iconColors = {
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/80 backdrop-blur-sm`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.type === "up" ? "text-green-600" : "text-red-600"
          }`}>
            {trend.type === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <p className="text-3xl font-bold">₹{(value / 1000).toFixed(1)}K</p>
        {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

