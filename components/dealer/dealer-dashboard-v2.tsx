"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { 
  Home, Briefcase, Package, ShoppingBag, DollarSign, Users, FileText, 
  Settings, Bell, Shield, BarChart3, TrendingUp, AlertCircle, Loader2,
  Menu, X, LogOut, ChevronRight, Warehouse, Truck, RefreshCw, CreditCard,
  Receipt, Award, HelpCircle, Lock, CheckCircle2, AlertTriangle, Building2,
  Phone, Mail, MapPin, Calendar, Clock, Eye, Edit, Plus, Search,
  Filter, Download, Upload, ArrowUpDown, MoreVertical, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Import all module components (we'll create these)
import { DealerDashboardHome } from "./modules/dashboard-home";
import { ServiceJobManagement } from "./modules/service-job-management";
import { PostJobForm } from "./modules/post-job-form";
import { ProductManagementModule } from "./modules/product-management";
import { InventoryManagement } from "./modules/inventory-management";
import { OrderManagementModule } from "./modules/order-management";
import { ShippingDeliveryModule } from "./modules/shipping-delivery";
import { ProductPaymentsSettlement } from "./modules/product-payments-settlement";
import { ReturnsRefundsRMA } from "./modules/returns-refunds-rma";
import { CustomerManagementModule } from "./modules/customer-management";
import { BillingInvoicesGST } from "./modules/billing-invoices-gst";
import { WalletLedger } from "./modules/wallet-ledger";
import { ProfileBusinessSettings } from "./modules/profile-business-settings";
import { KYCVerification } from "./modules/kyc-verification";
import { BankSettlementDetails } from "./modules/bank-settlement-details";
import { ReportsAnalytics } from "./modules/reports-analytics";
import { MarketingPromotions } from "./modules/marketing-promotions";
import { NotificationsPreferences } from "./modules/notifications-preferences";
import { SupportDisputes } from "./modules/support-disputes";
import { SecurityAccountSettings } from "./modules/security-account-settings";
import { LegalConsent } from "./modules/legal-consent";
import { AccountControl } from "./modules/account-control";

export type DealerModule = 
  | "dashboard" 
  | "service-jobs"
  | "post-job"
  | "products"
  | "inventory"
  | "orders"
  | "shipping"
  | "payments-settlement"
  | "returns-refunds"
  | "customers"
  | "billing-invoices"
  | "wallet-ledger"
  | "profile-settings"
  | "kyc-verification"
  | "bank-settlement"
  | "reports-analytics"
  | "marketing"
  | "notifications"
  | "support"
  | "security"
  | "legal"
  | "account-control";

interface NavItem {
  id: DealerModule;
  label: string;
  icon: any;
  badge?: number | null;
  category?: "main" | "business" | "financial" | "settings" | "support";
}

export function DealerDashboardV2() {
  const { data: session } = useSession();
  const [activeModule, setActiveModule] = useState<DealerModule>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobsPosted: 0,
    activeServiceJobs: 0,
    openBiddingJobs: 0,
    productsLive: 0,
    todaySales: 0,
    monthlySales: 0,
    pendingPayments: 0,
    activeWarranties: 0,
    openComplaints: 0,
    lowStockAlerts: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchDealerInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/dealer/status", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDealerInfo(data.dealer);
      }
    } catch (error) {
      console.error("Error fetching dealer info:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch("/api/dealer/dashboard/stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1&channel=IN_APP", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      }).catch((fetchError) => {
        // Network error or fetch failed
        console.error("Network error fetching notifications:", fetchError);
        return null;
      });

      if (!response) {
        // Network error occurred
        setUnreadNotifications(0);
        return;
      }

      if (response.ok) {
        try {
          const data = await response.json();
          setUnreadNotifications(data.total || 0);
        } catch (parseError) {
          console.error("Error parsing notifications response:", parseError);
          setUnreadNotifications(0);
        }
      } else {
        // If API fails, don't throw error - just log it and keep count at 0
        console.error("Failed to fetch notifications:", response.status, response.statusText);
        setUnreadNotifications(0);
      }
    } catch (error) {
      // Silently fail - don't show error to user, just keep count at 0
      console.error("Error fetching notifications:", error);
      setUnreadNotifications(0);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (session?.user) {
      fetchDealerInfo();
      fetchDashboardStats();
      fetchUnreadNotifications();
    }
  }, [session, fetchDealerInfo, fetchDashboardStats, fetchUnreadNotifications]);

  // Auto-refresh removed - manual refresh button available
  // useEffect(() => {
  //   if (!session?.user) return;
  //   const interval = setInterval(() => {
  //     fetchDashboardStats();
  //     fetchUnreadNotifications();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, [session, fetchDashboardStats, fetchUnreadNotifications]);

  // Refresh stats when dashboard module becomes active
  useEffect(() => {
    if (activeModule === "dashboard" && session?.user) {
      fetchDashboardStats();
    }
  }, [activeModule, session, fetchDashboardStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if dealer is approved
  if (dealerInfo && dealerInfo.accountStatus !== "APPROVED") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Your dealer account is <span className="font-semibold">
              {dealerInfo.accountStatus.toLowerCase().replace("_", " ")}
            </span>. 
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

  const navItems: NavItem[] = [
    // Main Category
    { id: "dashboard", label: "Dashboard", icon: Home, category: "main" },
    { id: "service-jobs", label: "Service Jobs", icon: Briefcase, badge: stats.activeServiceJobs, category: "main" },
    { id: "post-job", label: "Post New Job", icon: Plus, category: "main" },
    { id: "products", label: "Products", icon: Package, category: "main" },
    { id: "orders", label: "Orders", icon: ShoppingBag, category: "main" },
    { id: "customers", label: "Customers", icon: Users, category: "main" },
    
    // Business Category
    { id: "inventory", label: "Inventory", icon: Warehouse, badge: stats.lowStockAlerts, category: "business" },
    { id: "shipping", label: "Shipping & Delivery", icon: Truck, category: "business" },
    { id: "marketing", label: "Marketing & Promotions", icon: TrendingUp, category: "business" },
    
    // Financial Category
    { id: "payments-settlement", label: "Payments & Settlement", icon: DollarSign, badge: stats.pendingPayments, category: "financial" },
    { id: "billing-invoices", label: "Billing & Invoices", icon: Receipt, category: "financial" },
    { id: "wallet-ledger", label: "Wallet & Ledger", icon: CreditCard, category: "financial" },
    
    // Settings Category
    { id: "profile-settings", label: "Profile & Settings", icon: Settings, category: "settings" },
    { id: "kyc-verification", label: "KYC & Verification", icon: Shield, category: "settings" },
    { id: "bank-settlement", label: "Bank & Settlement", icon: Building2, category: "settings" },
    { id: "security", label: "Security", icon: Lock, category: "settings" },
    
    // Support Category
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotifications, category: "support" },
    { id: "support", label: "Support & Disputes", icon: HelpCircle, badge: stats.openComplaints, category: "support" },
    { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3, category: "support" },
    { id: "legal", label: "Legal & Consent", icon: FileText, category: "support" },
    { id: "account-control", label: "Account Control", icon: AlertTriangle, category: "support" },
  ];

  const activeNavItem = navItems.find(item => item.id === activeModule);

  const renderModuleContent = () => {
    switch (activeModule) {
      case "dashboard":
        return <DealerDashboardHome stats={stats} dealerInfo={dealerInfo} onNavigate={(module) => {
          setActiveModule(module as DealerModule);
        }} onStatsUpdate={fetchDashboardStats} />;
      case "service-jobs":
        return <ServiceJobManagement onStatsUpdate={fetchDashboardStats} onNavigateToPostJob={() => setActiveModule("post-job")} />;
      case "post-job":
        return <PostJobForm onSuccess={() => setActiveModule("service-jobs")} onStatsUpdate={fetchDashboardStats} />;
      case "products":
        return <ProductManagementModule onStatsUpdate={fetchDashboardStats} />;
      case "inventory":
        return <InventoryManagement onStatsUpdate={fetchDashboardStats} />;
      case "orders":
        return <OrderManagementModule onStatsUpdate={fetchDashboardStats} />;
      case "shipping":
        return <ShippingDeliveryModule onStatsUpdate={fetchDashboardStats} />;
      case "payments-settlement":
        return <ProductPaymentsSettlement onStatsUpdate={fetchDashboardStats} />;
      case "returns-refunds":
        return <ReturnsRefundsRMA onStatsUpdate={fetchDashboardStats} />;
      case "customers":
        return <CustomerManagementModule onStatsUpdate={fetchDashboardStats} />;
      case "billing-invoices":
        return <BillingInvoicesGST onStatsUpdate={fetchDashboardStats} />;
      case "wallet-ledger":
        return <WalletLedger />;
      case "profile-settings":
        return <ProfileBusinessSettings dealerInfo={dealerInfo} onUpdate={fetchDealerInfo} />;
      case "kyc-verification":
        return <KYCVerification dealerInfo={dealerInfo} onUpdate={fetchDealerInfo} />;
      case "bank-settlement":
        return <BankSettlementDetails dealerInfo={dealerInfo} onUpdate={fetchDealerInfo} />;
      case "reports-analytics":
        return <ReportsAnalytics />;
      case "marketing":
        return <MarketingPromotions onStatsUpdate={fetchDashboardStats} />;
      case "notifications":
        return <NotificationsPreferences onNotificationRead={fetchUnreadNotifications} />;
      case "support":
        return <SupportDisputes onStatsUpdate={fetchDashboardStats} />;
      case "security":
        return <SecurityAccountSettings />;
      case "legal":
        return <LegalConsent />;
      case "account-control":
        return <AccountControl dealerInfo={dealerInfo} />;
      default:
        return <DealerDashboardHome stats={stats} dealerInfo={dealerInfo} />;
    }
  };

  const groupedNavItems = {
    main: navItems.filter(item => item.category === "main"),
    business: navItems.filter(item => item.category === "business"),
    financial: navItems.filter(item => item.category === "financial"),
    settings: navItems.filter(item => item.category === "settings"),
    support: navItems.filter(item => item.category === "support"),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dealer Panel</h1>
              <p className="text-xs text-blue-100 mt-1">D.G.Yard - Complete Management</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {session?.user?.name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name || "Dealer"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {dealerInfo?.businessName || "Business"}
              </p>
              {dealerInfo?.accountStatus === "APPROVED" && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Main
            </p>
            <ul className="space-y-1">
              {groupedNavItems.main.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-semibold
                            ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Business Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Business
            </p>
            <ul className="space-y-1">
              {groupedNavItems.business.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-semibold
                            ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Financial Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Financial
            </p>
            <ul className="space-y-1">
              {groupedNavItems.financial.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-semibold
                            ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Settings Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Settings
            </p>
            <ul className="space-y-1">
              {groupedNavItems.settings.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support Navigation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Support
            </p>
            <ul className="space-y-1">
              {groupedNavItems.support.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-semibold
                            ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeNavItem?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeModule === "dashboard" 
                    ? "Welcome back! Here's your business overview"
                    : `Manage your ${activeNavItem?.label.toLowerCase()}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDashboardStats}
                className="hidden md:flex"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <button
                onClick={() => {
                  setActiveModule("notifications");
                  fetchUnreadNotifications();
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderModuleContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

