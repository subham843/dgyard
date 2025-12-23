"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Building2, Wrench, ShoppingBag, DollarSign, Clock,
  AlertCircle, CheckCircle2, TrendingUp, Shield, FileText, 
  Package, Activity, Bell, BarChart3, CreditCard, Lock, 
  Award, MessageSquare, Zap, Settings, Eye, Edit, Ban,
  RefreshCw, ArrowRight, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  // User counts
  totalDealers: number;
  totalTechnicians: number;
  totalCustomers: number;
  
  // Service Jobs
  activeServiceJobs: number;
  openBiddingJobs: number;
  jobsPending: number;
  jobsInProgress: number;
  jobsCompleted: number;
  
  // Product Orders
  ordersToday: number;
  ordersMonth: number;
  pendingOrders: number;
  
  // Financial
  totalGMV: number;
  serviceGMV: number;
  productGMV: number;
  pendingPayments: number;
  holdsAmount: number;
  
  // Warranty & Disputes
  activeWarranties: number;
  openComplaints: number;
  openDisputes: number;
  
  // Alerts
  lowStockCount: number;
  riskAlerts: number;
  systemHealth: "healthy" | "warning" | "critical";
  
  // Recent activity
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    severity: "info" | "warning" | "error";
  }>;
}

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalDealers: 0,
    totalTechnicians: 0,
    totalCustomers: 0,
    activeServiceJobs: 0,
    openBiddingJobs: 0,
    jobsPending: 0,
    jobsInProgress: 0,
    jobsCompleted: 0,
    ordersToday: 0,
    ordersMonth: 0,
    pendingOrders: 0,
    totalGMV: 0,
    serviceGMV: 0,
    productGMV: 0,
    pendingPayments: 0,
    holdsAmount: 0,
    activeWarranties: 0,
    openComplaints: 0,
    openDisputes: 0,
    lowStockCount: 0,
    riskAlerts: 0,
    systemHealth: "healthy",
    recentActivity: [],
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = "blue",
    href 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; type: "up" | "down" };
    color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
    href?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      red: "bg-red-50 border-red-200 text-red-700",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    };

    const iconColors = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
      red: "text-red-600",
      indigo: "text-indigo-600",
    };

    const content = (
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
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
      </div>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }
    return content;
  };

  const QuickActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    href, 
    color 
  }: {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
  }) => (
    <Link 
      href={href}
      className="group p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-blue hover:shadow-xl transition-all duration-200"
    >
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary-blue transition-colors">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <ArrowRight className="w-5 h-5 text-gray-400 mt-4 group-hover:text-primary-blue group-hover:translate-x-1 transition-all" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Complete platform overview & control</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/")}>
                View Site
              </Button>
              <Button onClick={fetchStats} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Critical Alerts */}
        {(stats.openDisputes > 0 || stats.systemHealth !== "healthy") && (
          <div className="mb-6 space-y-3">
            {stats.openDisputes > 0 && (
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">{stats.openDisputes} Open Dispute(s)</p>
                  <p className="text-sm text-orange-700">Warranty and complaint cases need resolution</p>
                </div>
                <Link href="/admin/disputes">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    Resolve <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
            {stats.systemHealth !== "healthy" && (
              <div className={`p-4 ${stats.systemHealth === "critical" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"} border-2 rounded-xl flex items-center gap-3`}>
                <Activity className={`w-6 h-6 ${stats.systemHealth === "critical" ? "text-red-600" : "text-yellow-600"} flex-shrink-0`} />
                <div className="flex-1">
                  <p className={`font-semibold ${stats.systemHealth === "critical" ? "text-red-900" : "text-yellow-900"}`}>
                    System Health: {stats.systemHealth === "critical" ? "Critical" : "Warning"}
                  </p>
                  <p className={`text-sm ${stats.systemHealth === "critical" ? "text-red-700" : "text-yellow-700"}`}>
                    Check payment gateways and API status
                  </p>
                </div>
                <Link href="/admin/system-health">
                  <Button variant="outline" size="sm" className={`${stats.systemHealth === "critical" ? "border-red-300 text-red-700 hover:bg-red-100" : "border-yellow-300 text-yellow-700 hover:bg-yellow-100"}`}>
                    Check <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Main Stats Grid - User Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-blue" />
            User Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Dealers"
              value={stats.totalDealers}
              icon={Building2}
              color="blue"
              href="/admin/users?type=dealer"
            />
            <StatCard
              title="Total Technicians"
              value={stats.totalTechnicians}
              icon={Wrench}
              color="indigo"
              href="/admin/users?type=technician"
            />
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              color="green"
              href="/admin/users?type=customer"
            />
          </div>
        </div>

        {/* Service Jobs & Bidding */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary-blue" />
            Service Jobs & Bidding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Active Service Jobs"
              value={stats.activeServiceJobs}
              icon={Activity}
              color="green"
              href="/admin/jobs?status=active"
            />
            <StatCard
              title="Open Bidding Jobs"
              value={stats.openBiddingJobs}
              icon={Award}
              color="purple"
              href="/admin/bidding?status=open"
            />
            <StatCard
              title="Pending"
              value={stats.jobsPending}
              icon={Clock}
              color="orange"
              href="/admin/jobs?status=pending"
            />
            <StatCard
              title="In Progress"
              value={stats.jobsInProgress}
              icon={RefreshCw}
              color="blue"
              href="/admin/jobs?status=in_progress"
            />
            <StatCard
              title="Completed"
              value={stats.jobsCompleted}
              icon={CheckCircle2}
              color="green"
              href="/admin/jobs?status=completed"
            />
          </div>
        </div>

        {/* Financial Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-blue" />
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total GMV"
              value={`₹${(stats.totalGMV / 100000).toFixed(2)}L`}
              subtitle={`Service: ₹${(stats.serviceGMV / 100000).toFixed(2)}L | Products: ₹${(stats.productGMV / 100000).toFixed(2)}L`}
              icon={TrendingUp}
              color="green"
              href="/admin/finance/gmv"
            />
            <StatCard
              title="Pending Payments"
              value={`₹${(stats.pendingPayments / 1000).toFixed(1)}K`}
              icon={Clock}
              color="orange"
              href="/admin/payments?status=pending"
            />
            <StatCard
              title="Holds Amount"
              value={`₹${(stats.holdsAmount / 1000).toFixed(1)}K`}
              icon={Lock}
              color="red"
              href="/admin/ledger?type=holds"
            />
            <StatCard
              title="Orders (Today)"
              value={stats.ordersToday}
              subtitle={`This Month: ${stats.ordersMonth}`}
              icon={ShoppingBag}
              color="blue"
              href="/admin/orders"
            />
          </div>
        </div>

        {/* Warranty & Disputes */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-blue" />
            Warranty & Disputes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Active Warranties"
              value={stats.activeWarranties}
              icon={Shield}
              color="blue"
              href="/admin/warranties"
            />
            <StatCard
              title="Open Complaints"
              value={stats.openComplaints}
              icon={MessageSquare}
              color="orange"
              href="/admin/complaints"
            />
            <StatCard
              title="Open Disputes"
              value={stats.openDisputes}
              icon={AlertCircle}
              color="red"
              href="/admin/disputes"
            />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-blue" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="User Management"
              description="Manage dealers, technicians, customers & KYC"
              icon={Users}
              href="/admin/users"
              color="bg-blue-600"
            />
            <QuickActionCard
              title="Payment Control"
              description="View payments, wallets & ledger management"
              icon={CreditCard}
              href="/admin/payments"
              color="bg-green-600"
            />
            <QuickActionCard
              title="Finance Dashboard"
              description="Platform revenue, commission stats & dealer earnings"
              icon={TrendingUp}
              href="/admin/finance/dashboard"
              color="bg-emerald-600"
            />
            <QuickActionCard
              title="Commission Settings"
              description="Configure platform commission rules for services & products"
              icon={Settings}
              href="/admin/finance/commission"
              color="bg-cyan-600"
            />
            <QuickActionCard
              title="Service Jobs"
              description="Monitor & manage all service jobs"
              icon={Wrench}
              href="/admin/jobs"
              color="bg-purple-600"
            />
            <QuickActionCard
              title="Bidding Management"
              description="Control bidding process & detect fraud"
              icon={Award}
              href="/admin/bidding"
              color="bg-indigo-600"
            />
            <QuickActionCard
              title="E-Commerce Admin"
              description="Multi-seller products & order management"
              icon={Package}
              href="/admin/ecommerce"
              color="bg-orange-600"
            />
            <QuickActionCard
              title="Warranty & Disputes"
              description="Handle warranties, complaints & disputes"
              icon={Shield}
              href="/admin/warranties"
              color="bg-red-600"
            />
            <QuickActionCard
              title="AI & Automation"
              description="AI rules, fraud detection & automation"
              icon={Zap}
              href="/admin/ai-automation"
              color="bg-yellow-600"
            />
          </div>
        </div>

        {/* Recent Activity & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-blue" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      activity.severity === "error"
                        ? "bg-red-50 border-red-500"
                        : activity.severity === "warning"
                        ? "bg-yellow-50 border-yellow-500"
                        : "bg-blue-50 border-blue-500"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-blue" />
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    stats.lowStockCount > 0 ? "bg-yellow-500" : "bg-green-500"
                  }`} />
                  <span className="font-medium">Low Stock Alerts</span>
                </div>
                <span className="font-bold">{stats.lowStockCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    stats.systemHealth === "healthy" ? "bg-green-500" : 
                    stats.systemHealth === "warning" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <span className="font-medium">System Health</span>
                </div>
                <span className={`font-bold ${
                  stats.systemHealth === "healthy" ? "text-green-600" : 
                  stats.systemHealth === "warning" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {stats.systemHealth === "healthy" ? "Healthy" : 
                   stats.systemHealth === "warning" ? "Warning" : "Critical"}
                </span>
              </div>
              <Link href="/admin/system-health">
                <Button variant="outline" className="w-full">
                  View Full System Status <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
