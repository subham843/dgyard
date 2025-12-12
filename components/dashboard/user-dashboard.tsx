"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Settings, ShoppingBag, MapPin, User, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    orders: 0,
    bookings: 0,
    addresses: 0,
    quotations: 0,
  });

  useEffect(() => {
    console.log(`[UserDashboard] ${new Date().toISOString()} - Status: ${status}, Session: ${session ? 'exists' : 'null'}, User ID: ${session?.user?.id}`);
    
    // Wait for session to finish loading
    if (status === "loading") {
      console.log(`[UserDashboard] Session is loading, waiting...`);
      return;
    }
    
    // If unauthenticated after loading is complete, redirect
    if (status === "unauthenticated") {
      console.log(`[UserDashboard] ⚠️ Unauthenticated, redirecting to signin`);
      router.push("/auth/signin");
      return;
    }
    
    // If authenticated, fetch stats
    if (status === "authenticated" && session?.user?.id) {
      console.log(`[UserDashboard] ✅ Session exists, fetching stats...`);
      fetchStats();
    }
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const [ordersRes, bookingsRes, addressesRes, quotationsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/bookings"),
        fetch("/api/addresses"),
        fetch("/api/quotations"),
      ]);
      const orders = await ordersRes.json();
      const bookings = await bookingsRes.json();
      const addresses = await addressesRes.json();
      const quotations = await quotationsRes.json();
      setStats({
        orders: orders.orders?.length || 0,
        bookings: bookings.bookings?.length || 0,
        addresses: addresses.addresses?.length || 0,
        quotations: quotations.quotations?.length || 0,
      });
    } catch (error) {
      // Silently handle stats fetch errors
    }
  };

  const quickActions = [
    {
      title: "My Orders",
      description: "View order history",
      icon: ShoppingBag,
      href: "/orders",
      color: "bg-lavender-light text-primary-blue",
    },
    {
      title: "My Bookings",
      description: "Manage service bookings",
      icon: Calendar,
      href: "/bookings",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "My Addresses",
      description: "Manage delivery addresses",
      icon: MapPin,
      href: "/dashboard/addresses",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "My Quotations",
      description: "View saved quotations",
      icon: FileText,
      href: "/dashboard/quotations",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Profile Settings",
      description: "Update your profile",
      icon: Settings,
      href: "/dashboard/profile",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name || "User"}!
        </h1>
        <p className="text-light-gray">Manage your account and track your orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-lavender-light">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-light-gray mb-1">Total Orders</div>
              <div className="text-3xl font-bold text-dark-blue">{stats.orders}</div>
            </div>
            <div className="w-12 h-12 bg-lavender-light rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Active Bookings</div>
              <div className="text-3xl font-bold">{stats.bookings}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Saved Addresses</div>
              <div className="text-3xl font-bold">{stats.addresses}</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">My Quotations</div>
              <div className="text-3xl font-bold">{stats.quotations}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
          <Button variant="outline" asChild>
            <Link href="/orders">View All</Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-gray-600 text-center py-8">
            {stats.orders === 0
              ? "No orders yet. Start shopping!"
              : "Loading recent orders..."}
          </p>
        </div>
      </div>
    </div>
  );
}

