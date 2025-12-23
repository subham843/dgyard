"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Briefcase, TrendingUp, CheckCircle2, AlertCircle, 
  DollarSign, ShoppingBag, Settings, Bell, 
  MapPin, Clock, Shield, FileText, Package,
  Users, Phone, Mail, Calendar, Loader2, Menu, X,
  Home, BarChart3, Activity, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealerStatsCards } from "./dealer-stats-cards";
import { DealerJobManagement } from "./dealer-job-management";
import { DealerNotifications } from "./dealer-notifications";
import { DealerPayments } from "./dealer-payments";
import { DealerWarranty } from "./dealer-warranty";
import { DealerProducts } from "./dealer-products";
import { DealerSettings } from "./dealer-settings";
import { DealerAnalytics } from "./dealer-analytics";
import toast from "react-hot-toast";
import Link from "next/link";
import { signOut } from "next-auth/react";

type TabType = "overview" | "jobs" | "payments" | "warranty" | "products" | "analytics" | "notifications" | "settings";

export function DealerDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    warrantyJobs: 0,
    openDisputes: 0,
    freeTrialUsed: 0,
    freeTrialRemaining: 0,
    totalEarnings: 0,
    totalServiceSpend: 0,
  });
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchDealerInfo();
      fetchStats();
      fetchUnreadNotificationCount();
      fetchRecentActivity();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadNotificationCount();
        fetchRecentActivity();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchDealerInfo = async () => {
    try {
      const response = await fetch("/api/dealer/status");
      if (response.ok) {
        const data = await response.json();
        setDealerInfo(data.dealer);
      }
    } catch (error) {
      console.error("Error fetching dealer info:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dealer/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1&channel=IN_APP");
      if (response.ok) {
        const data = await response.json();
        const count = data.total || 0;
        setUnreadNotificationCount(count);
        console.log("Unread notification count:", count);
      } else {
        console.error("Failed to fetch notification count:", response.status);
      }
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/jobs?limit=5");
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if dealer is approved
  if (dealerInfo && dealerInfo.accountStatus !== "APPROVED") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Your dealer account is <span className="font-semibold">{dealerInfo.accountStatus.toLowerCase().replace("_", " ")}</span>. 
            Please wait for admin approval to access the dashboard.
          </p>
          <Button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full"
            variant="outline"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Check free trial status
  const freeTrialRemaining = dealerInfo?.freeTrialServices || 0;
  const showTrialWarning = freeTrialRemaining <= 3 && freeTrialRemaining > 0;

  const navItems = [
    { id: "overview", label: "Overview", icon: Home, badge: null },
    { id: "jobs", label: "Service Jobs", icon: Briefcase, badge: stats.activeJobs },
    { id: "payments", label: "Payments", icon: DollarSign, badge: null },
    { id: "warranty", label: "Warranty", icon: Shield, badge: stats.warrantyJobs },
    { id: "products", label: "Products", icon: Package, badge: null },
    { id: "analytics", label: "Analytics", icon: BarChart3, badge: null },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotificationCount },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dealer Panel</h1>
              <p className="text-xs text-gray-500 mt-1">D.G.Yard</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {session?.user?.name?.charAt(0) || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name || "Dealer"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {dealerInfo?.businessName || "Business"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setSidebarOpen(false);
                      if (item.id === "notifications") {
                        fetchUnreadNotificationCount();
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge !== null && item.badge > 0 && (
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-semibold
                          ${isActive ? 'bg-white text-primary' : 'bg-primary text-white'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "overview" 
                    ? "Welcome back! Here's your business overview"
                    : `Manage your ${navItems.find(item => item.id === activeTab)?.label.toLowerCase()}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {showTrialWarning && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {freeTrialRemaining} services left
                  </span>
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Trial Warning Banner */}
          {showTrialWarning && (
            <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  Free Trial: {freeTrialRemaining} services remaining
                </p>
                <p className="text-xs text-yellow-700">
                  Contact admin to upgrade your account for unlimited services
                </p>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <DealerStatsCards stats={stats} />
                
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      className="w-full justify-start h-auto p-4 hover:shadow-md transition-shadow" 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("jobs");
                        setSidebarOpen(false);
                      }}
                    >
                      <Briefcase className="w-5 h-5 mr-3 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">Post New Job</p>
                        <p className="text-xs text-gray-500">Create service request</p>
                      </div>
                    </Button>
                    <Button 
                      className="w-full justify-start h-auto p-4 hover:shadow-md transition-shadow" 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("products");
                        setSidebarOpen(false);
                      }}
                    >
                      <Package className="w-5 h-5 mr-3 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">Add Product</p>
                        <p className="text-xs text-gray-500">Manage inventory</p>
                      </div>
                    </Button>
                    <Button 
                      className="w-full justify-start h-auto p-4 hover:shadow-md transition-shadow" 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("payments");
                        setSidebarOpen(false);
                      }}
                    >
                      <DollarSign className="w-5 h-5 mr-3 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">View Payments</p>
                        <p className="text-xs text-gray-500">Payment history</p>
                      </div>
                    </Button>
                    <Button 
                      className="w-full justify-start h-auto p-4 hover:shadow-md transition-shadow" 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("notifications");
                        setSidebarOpen(false);
                      }}
                    >
                      <Bell className="w-5 h-5 mr-3 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">Notifications</p>
                        <p className="text-xs text-gray-500">View updates</p>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Activity className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                        <p className="text-sm text-gray-500">Latest jobs and updates</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("jobs")}>
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600">No recent activity</p>
                        <p className="text-xs text-gray-500 mt-1">Your recent jobs will appear here</p>
                      </div>
                    ) : (
                      recentActivity.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-2 rounded-lg ${
                              job.status === "COMPLETED" ? "bg-green-100" :
                              job.status === "IN_PROGRESS" ? "bg-blue-100" :
                              job.status === "PENDING" ? "bg-yellow-100" :
                              "bg-gray-100"
                            }`}>
                              <Briefcase className={`w-5 h-5 ${
                                job.status === "COMPLETED" ? "text-green-600" :
                                job.status === "IN_PROGRESS" ? "text-blue-600" :
                                job.status === "PENDING" ? "text-yellow-600" :
                                "text-gray-600"
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                              <p className="text-sm text-gray-600">Job #{job.jobNumber}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(job.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {job.finalPrice && (
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  ₹{job.finalPrice.toLocaleString("en-IN")}
                                </p>
                              </div>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              job.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                              job.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                              job.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {job.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "jobs" && (
              <DealerJobManagement onStatsUpdate={fetchStats} />
            )}

            {activeTab === "payments" && (
              <DealerPayments />
            )}

            {activeTab === "warranty" && (
              <DealerWarranty />
            )}

            {activeTab === "products" && (
              <DealerProducts />
            )}

            {activeTab === "analytics" && (
              <DealerAnalytics />
            )}

            {activeTab === "notifications" && (
              <DealerNotifications onNotificationRead={fetchUnreadNotificationCount} />
            )}

            {activeTab === "settings" && (
              <DealerSettings dealerInfo={dealerInfo} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}



