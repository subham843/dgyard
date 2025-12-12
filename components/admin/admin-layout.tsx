"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Calendar, TrendingUp, Tag, Layers, Settings, FileText, Gift, ClipboardList, Star, Shield, Network, Zap, Wrench } from "lucide-react";
import { AIChatbot } from "@/components/ai-assistant/ai-chatbot";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/categories-nested", label: "Categories (Nested)", icon: Layers },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/offers", label: "Offers", icon: Gift },
  { href: "/admin/quotation-settings", label: "Quotation Settings", icon: FileText },
  { href: "/admin/quotations", label: "Quotations", icon: ClipboardList },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/technicians", label: "Technicians", icon: Wrench },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/page-content/security-surveillance", label: "Security Page", icon: Shield },
  { href: "/admin/page-content/networking-it", label: "Networking & IT Page", icon: Network },
  { href: "/admin/page-content/digital-marketing", label: "Digital Marketing Page", icon: TrendingUp },
  { href: "/admin/page-content/av-fire-infrastructure", label: "AV, Fire & Smart Infrastructure", icon: Zap },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-lavender-soft">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-lavender-light overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-purple-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">DG</span>
            </div>
            <div>
              <div className="font-bold text-dark-blue">D.G.Yard</div>
              <div className="text-xs text-light-gray">Admin Panel</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-lavender-light text-primary-blue font-semibold"
                      : "text-dark-blue-light hover:bg-lavender-light"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {children}
      </div>
      
      {/* AI Assistant for Admin */}
      <AIChatbot />
    </div>
  );
}

