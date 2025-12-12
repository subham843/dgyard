"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Package } from "lucide-react";

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    revenue: { total: 0, growth: 0 },
    orders: { total: 0, growth: 0 },
    users: { total: 0, growth: 0 },
    bookings: { total: 0, growth: 0 },
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 ${analytics.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{analytics.revenue.growth}%</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold">₹{analytics.revenue.total.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 ${analytics.orders.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{analytics.orders.growth}%</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{analytics.orders.total}</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`flex items-center gap-1 ${analytics.users.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{analytics.users.growth}%</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Users</div>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className={`flex items-center gap-1 ${analytics.bookings.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{analytics.bookings.growth}%</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
            <div className="text-2xl font-bold">{analytics.bookings.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-gray-600">
            Analytics charts and detailed reports coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}

