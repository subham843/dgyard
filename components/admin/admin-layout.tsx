"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, Calendar, TrendingUp, 
  Tag, Layers, Settings, FileText, Gift, ClipboardList, Star, Shield, 
  Network, Zap, Wrench, Building2, Award, Briefcase, CreditCard, Lock,
  BarChart3, MessageSquare, AlertTriangle, Bell, Database, Key, 
  Eye, Filter, RefreshCw, ChevronDown, ChevronRight, Clock, CheckCircle2,
  Ban, DollarSign, Activity, Image as ImageIcon, Calculator, TrendingDown,
  FolderTree
} from "lucide-react";
import { AIChatbot } from "@/components/ai-assistant/ai-chatbot";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/price-calculator", label: "Price Calculator", icon: Calculator },
    ],
  },
  {
    title: "User Management",
    items: [
      { href: "/admin/users", label: "All Users", icon: Users },
      { href: "/admin/users/dealers", label: "Dealers", icon: Building2 },
      { href: "/admin/users/technicians", label: "Technicians", icon: Wrench },
      { href: "/admin/users/customers", label: "Customers", icon: Users },
      { href: "/admin/users/kyc", label: "KYC & Verification", icon: Shield },
    ],
  },
  {
    title: "Service Jobs",
    items: [
      { href: "/admin/jobs", label: "All Jobs", icon: Briefcase },
      { href: "/admin/jobs/active", label: "Active Jobs", icon: RefreshCw },
      { href: "/admin/jobs/pending", label: "Pending Assignment", icon: Clock },
      { href: "/admin/jobs/completed", label: "Completed", icon: CheckCircle2 },
    ],
  },
  {
    title: "Bidding",
    items: [
      { href: "/admin/bidding", label: "Bidding Management", icon: Award },
    ],
  },
  {
    title: "Payments & Finance",
    items: [
      { href: "/admin/payments", label: "Payment Control", icon: CreditCard },
      { href: "/admin/ledger", label: "Ledger Management", icon: FileText },
      { href: "/admin/wallet", label: "Wallets", icon: CreditCard },
      { href: "/admin/finance/dashboard", label: "Finance Dashboard", icon: TrendingUp },
      { href: "/admin/finance/commission", label: "Commission Settings", icon: Settings },
      { href: "/admin/finance/reports", label: "Reports & Exports", icon: BarChart3 },
      { href: "/admin/finance/settlement", label: "Seller Settlement", icon: DollarSign },
    ],
  },
  {
    title: "Warranty & Disputes",
    items: [
      { href: "/admin/warranties", label: "Warranties & Disputes", icon: Shield },
    ],
  },
  {
    title: "Performance & Risk",
    items: [
      { href: "/admin/performance/technicians", label: "Technician Performance", icon: BarChart3 },
      { href: "/admin/performance/dealers", label: "Dealer Performance", icon: TrendingUp },
      { href: "/admin/risk-control", label: "Risk Control", icon: Shield },
    ],
  },
  {
    title: "E-Commerce",
    items: [
      { href: "/admin/ecommerce/products", label: "Products", icon: Package },
      { href: "/admin/ecommerce/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/ecommerce/sellers", label: "Multi-Sellers", icon: Building2 },
      { href: "/admin/ecommerce/catalog", label: "Inventory & Catalog", icon: Database },
      { href: "/admin/refunds", label: "Refund Management", icon: TrendingDown },
    ],
  },
  {
    title: "Catalog Management",
    items: [
      { href: "/admin/brands", label: "Brands", icon: Tag },
      { href: "/admin/categories", label: "Categories", icon: Layers },
      { href: "/admin/subcategories", label: "Subcategories", icon: Layers },
      { href: "/admin/territory-categories", label: "Territory Categories", icon: Network },
      { href: "/admin/products", label: "All Products", icon: Package },
    ],
  },
  {
    title: "Service Management",
    items: [
      { href: "/admin/service-categories", label: "Service Categories", icon: FolderTree },
      { href: "/admin/service-sub-categories", label: "Service Sub Categories", icon: FolderTree },
      { href: "/admin/service-domains", label: "Service Domains", icon: Network },
      { href: "/admin/skills", label: "Skills", icon: Award },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      { href: "/admin/ai-automation", label: "AI Rule Engine", icon: Zap },
      { href: "/admin/ai-automation/logs", label: "AI Logs", icon: FileText },
      { href: "/admin/ai-automation/fraud", label: "Fraud Detection", icon: Shield },
    ],
  },
  {
    title: "Communications",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/communications/templates", label: "Templates", icon: FileText },
    ],
  },
  {
    title: "Content & CMS",
    items: [
      { href: "/admin/cms/pages", label: "Static Pages", icon: FileText },
      { href: "/admin/cms/faq", label: "FAQs", icon: MessageSquare },
      { href: "/admin/cms/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/system/roles", label: "Roles & Permissions", icon: Key },
      { href: "/admin/system/audit", label: "Audit Logs", icon: Eye },
      { href: "/admin/system/security", label: "Security Settings", icon: Shield },
      { href: "/admin/system/health", label: "System Health", icon: Activity },
      { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
      { href: "/admin/settings", label: "Platform Settings", icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["Core", "User Management"])
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  // Fix stuck overlays
  useEffect(() => {
    const removeStuckOverlays = () => {
      const allOverlays = document.querySelectorAll(
        'div[class*="fixed"][class*="inset-0"], [data-radix-dialog-overlay], [class*="DialogOverlay"]'
      );
      
      allOverlays.forEach((overlay) => {
        const element = overlay as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        const isBlackOverlay = bgColor.includes('rgb(0, 0, 0)') || 
                              bgColor.includes('rgba(0, 0, 0') ||
                              element.classList.toString().includes('bg-black');
        
        if (computedStyle.display !== "none" && 
            computedStyle.opacity !== "0" && 
            computedStyle.zIndex && 
            parseInt(computedStyle.zIndex) >= 50 &&
            isBlackOverlay) {
          const hasDialog = element.querySelector('[role="dialog"], [data-radix-dialog-content], [class*="DialogContent"]');
          const hasForm = element.querySelector('form');
          const hasModalContent = element.querySelector('[class*="modal"], [class*="Modal"]');
          
          if (!hasDialog && !hasForm && !hasModalContent) {
            element.style.display = 'none';
            element.remove();
          }
        }
      });
    };

    setTimeout(removeStuckOverlays, 100);
    const interval = setInterval(removeStuckOverlays, 1000);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const radixDialogs = document.querySelectorAll('[data-radix-dialog-content]');
        radixDialogs.forEach((dialog) => {
          const closeBtn = dialog.querySelector('button[aria-label="Close"], [data-radix-dialog-close]');
          if (closeBtn) (closeBtn as HTMLElement).click();
        });
        removeStuckOverlays();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-72' : 'w-20'
        } overflow-y-auto shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">DG</span>
              </div>
              {sidebarOpen && (
                <div>
                  <div className="font-bold text-gray-900 text-lg">D.G.Yard</div>
                  <div className="text-xs text-gray-500">Admin Panel</div>
                </div>
              )}
            </div>
            {/* Sidebar Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex-shrink-0"
            >
              {sidebarOpen ? (
                <ChevronDown className="w-4 h-4 rotate-90" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navSections.map((section) => {
            const isExpanded = expandedSections.has(section.title);
            return (
              <div key={section.title} className="mb-4">
                {sidebarOpen ? (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="h-8" />
                )}
                
                {(!sidebarOpen || isExpanded) && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            active
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold shadow-sm border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                          {sidebarOpen && (
                            <>
                              <span className="flex-1 text-sm">{item.label}</span>
                              {item.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {children}
      </main>
      
      {/* AI Assistant */}
      <AIChatbot />
      
      {/* Realtime Updates */}
      {/* <RealtimeUpdates /> */}
    </div>
  );
}
