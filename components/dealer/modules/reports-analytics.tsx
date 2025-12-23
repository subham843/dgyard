"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Briefcase, Calendar, Download, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function ReportsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year">("month");
  const [stats, setStats] = useState({
    serviceRevenue: 0,
    productRevenue: 0,
    totalRevenue: 0,
    commissionPaid: 0,
    netProfit: 0,
    totalOrders: 0,
    totalJobs: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch stats based on date range
      const [jobsRes, ordersRes] = await Promise.all([
        fetch("/api/dealer/payments"),
        fetch("/api/dealer/orders"),
      ]);

      const jobs = jobsRes.ok ? (await jobsRes.json()).payments || [] : [];
      const orders = ordersRes.ok ? (await ordersRes.json()).orders || [] : [];

      const serviceRevenue = jobs.reduce((sum: number, j: any) => sum + (j.amount || 0), 0);
      const productRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const commission = productRevenue * 0.1; // 10% commission
      const netProfit = serviceRevenue + productRevenue - commission;

      setStats({
        serviceRevenue,
        productRevenue,
        totalRevenue: serviceRevenue + productRevenue,
        commissionPaid: commission,
        netProfit,
        totalOrders: orders.length,
        totalJobs: jobs.length,
        avgOrderValue: orders.length > 0 ? productRevenue / orders.length : 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-500 mt-1">View performance reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Service Revenue</p>
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.serviceRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Product Revenue</p>
            <ShoppingBag className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.productRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Net Profit</p>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.netProfit.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Jobs</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900">₹{stats.avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Revenue Breakdown Chart */}
      {stats.totalRevenue > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Service Revenue", value: stats.serviceRevenue },
                  { name: "Product Revenue", value: stats.productRevenue },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Service Revenue", value: stats.serviceRevenue, color: "#3B82F6" },
                  { name: "Product Revenue", value: stats.productRevenue, color: "#10B981" },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Service Revenue</span>
              <span className="text-sm font-medium">₹{stats.serviceRevenue.toLocaleString("en-IN")}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats.totalRevenue > 0 ? (stats.serviceRevenue / stats.totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Product Revenue</span>
              <span className="text-sm font-medium">₹{stats.productRevenue.toLocaleString("en-IN")}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.totalRevenue > 0 ? (stats.productRevenue / stats.totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Commission Paid</span>
              <span className="text-sm font-medium text-orange-600">-₹{stats.commissionPaid.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
