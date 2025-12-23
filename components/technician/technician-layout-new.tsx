"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Briefcase, 
  User, 
  Settings, 
  MapPin, 
  Award, 
  LogOut,
  Search,
  FileCheck,
  Wallet,
  CreditCard,
  Shield,
  Bell,
  FileText,
  HelpCircle,
  Lock,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  MessageSquare,
  BookOpen,
  UserX,
  Power
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { 
    href: "/technician/dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    section: "main"
  },
  { 
    href: "/technician/jobs/discover", 
    label: "Job Discovery", 
    icon: Search,
    section: "jobs"
  },
  { 
    href: "/technician/jobs/my-jobs", 
    label: "My Jobs", 
    icon: Briefcase,
    section: "jobs"
  },
  { 
    href: "/technician/jobs/completed", 
    label: "Completed Jobs", 
    icon: CheckCircle2,
    section: "jobs"
  },
  { 
    href: "/technician/jobs/warranty", 
    label: "Warranty Jobs", 
    icon: Shield,
    section: "jobs"
  },
  { 
    href: "/technician/jobs/disputed", 
    label: "Disputed Jobs", 
    icon: AlertCircle,
    section: "jobs"
  },
  { 
    href: "/technician/earnings", 
    label: "Earnings", 
    icon: DollarSign,
    section: "financial"
  },
  { 
    href: "/technician/wallet", 
    label: "Wallet & Ledger", 
    icon: Wallet,
    section: "financial"
  },
  { 
    href: "/technician/withdraw", 
    label: "Withdraw", 
    icon: CreditCard,
    section: "financial"
  },
  { 
    href: "/technician/profile", 
    label: "Profile", 
    icon: User,
    section: "settings"
  },
  { 
    href: "/technician/bank-details", 
    label: "Bank Details", 
    icon: Building2,
    section: "settings"
  },
  { 
    href: "/technician/kyc", 
    label: "KYC & Verification", 
    icon: Shield,
    section: "settings"
  },
  { 
    href: "/technician/trust-score", 
    label: "Trust Score", 
    icon: TrendingUp,
    section: "settings"
  },
  { 
    href: "/technician/documents", 
    label: "Documents", 
    icon: FileText,
    section: "settings"
  },
  { 
    href: "/technician/notifications", 
    label: "Notifications", 
    icon: Bell,
    section: "settings"
  },
  { 
    href: "/technician/security", 
    label: "Security", 
    icon: Lock,
    section: "settings"
  },
  { 
    href: "/technician/support", 
    label: "Support & Help", 
    icon: HelpCircle,
    section: "settings"
  },
  { 
    href: "/technician/legal", 
    label: "Legal & Consent", 
    icon: BookOpen,
    section: "settings"
  },
  { 
    href: "/technician/account", 
    label: "Account Control", 
    icon: UserX,
    section: "settings"
  },
];

export function TechnicianLayoutNew({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/technician/dashboard") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const groupedNavItems = {
    main: navItems.filter(item => item.section === "main"),
    jobs: navItems.filter(item => item.section === "jobs"),
    financial: navItems.filter(item => item.section === "financial"),
    settings: navItems.filter(item => item.section === "settings"),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200/80 overflow-y-auto transition-all duration-300 z-30 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-lg truncate">Technician</div>
                <div className="text-xs text-gray-500 font-medium">Dashboard</div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <div className="h-0.5 w-full bg-gray-600 rounded"></div>
                <div className="h-0.5 w-full bg-gray-600 rounded"></div>
                <div className="h-0.5 w-full bg-gray-600 rounded"></div>
              </div>
            </button>
          </div>

          {/* User Info */}
          {session?.user && sidebarOpen && (
            <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || "Technician"}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {session.user.email}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            {/* Main Section */}
            {groupedNavItems.main.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* Jobs Section */}
            {sidebarOpen && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Jobs
                </div>
              </div>
            )}
            {groupedNavItems.jobs.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* Financial Section */}
            {sidebarOpen && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Financial
                </div>
              </div>
            )}
            {groupedNavItems.financial.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}

            {/* Settings Section */}
            {sidebarOpen && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Settings
                </div>
              </div>
            )}
            {groupedNavItems.settings.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
              title={!sidebarOpen ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {children}
      </div>
    </div>
  );
}

