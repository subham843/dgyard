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
  LogOut
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/technician/dashboard", label: "Dashboard", icon: LayoutDashboard, tab: null },
  { href: "/technician/dashboard?tab=profile", label: "Profile", icon: User, tab: "profile" },
  { href: "/technician/dashboard?tab=skills", label: "Skills", icon: Award, tab: "skills" },
  { href: "/technician/dashboard?tab=location", label: "Location", icon: MapPin, tab: "location" },
  { href: "/technician/dashboard?tab=settings", label: "Settings", icon: Settings, tab: "settings" },
];

export function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || null;
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 overflow-y-auto shadow-lg z-10">
        <div className="p-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">Technician</div>
              <div className="text-xs text-gray-500 font-medium">Dashboard</div>
            </div>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || "Technician"}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {session.user.email}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.tab === currentTab || (!item.tab && !currentTab);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {children}
      </div>
    </div>
  );
}









