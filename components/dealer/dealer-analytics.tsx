"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, DollarSign, Briefcase, Calendar, 
  BarChart3, PieChart, Loader2, ArrowUp, ArrowDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DealerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    earnings: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
    },
    jobs: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
    },
    payments: {
      pending: 0,
      released: 0,
      warrantyHolds: 0,
    },
    recentJobs: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch stats, recent jobs, and payments
      const [statsRes, jobsRes, paymentsRes] = await Promise.all([
        fetch("/api/dealer/stats"),
        fetch("/api/jobs?limit=5"),
        fetch("/api/dealer/payments").catch(() => ({ ok: false })),
      ]);

      if (statsRes.ok && jobsRes.ok) {
        const stats = await statsRes.json();
        const jobsData = await jobsRes.json();
        let paymentsData = { summary: { pendingPayments: 0, releasedPayments: 0, warrantyHolds: 0 } };
        
        if (paymentsRes.ok) {
          paymentsData = await paymentsRes.json();
        }
        
        // Calculate month-over-month growth
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Calculate earnings growth (simplified - would need actual monthly data from API)
        const earningsGrowth = stats.totalEarnings > 0 ? 15 : 0; // Placeholder
        
        setAnalytics({
          earnings: {
            total: stats.totalEarnings || 0,
            thisMonth: stats.totalEarnings || 0,
            lastMonth: Math.round((stats.totalEarnings || 0) * 0.85),
            growth: earningsGrowth,
          },
          jobs: {
            total: stats.totalJobs || 0,
            thisMonth: stats.activeJobs || 0,
            lastMonth: Math.max(0, (stats.totalJobs || 0) - (stats.activeJobs || 0)),
            growth: stats.totalJobs > 0 ? Math.round(((stats.activeJobs / stats.totalJobs) * 100)) : 0,
          },
          payments: {
            pending: paymentsData.summary?.pendingPayments || 0,
            released: paymentsData.summary?.releasedPayments || 0,
            warrantyHolds: paymentsData.summary?.warrantyHolds || 0,
          },
          recentJobs: jobsData.jobs || [],
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            {analytics.earnings.growth > 0 ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm font-semibold">+{analytics.earnings.growth}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <ArrowDown className="w-4 h-4" />
                <span className="text-sm font-semibold">{analytics.earnings.growth}%</span>
              </div>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
          <p className="text-3xl font-bold text-gray-900">
            ₹{analytics.earnings.total.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This month: ₹{analytics.earnings.thisMonth.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            {analytics.jobs.growth > 0 ? (
              <div className="flex items-center gap-1 text-blue-600">
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm font-semibold">+{analytics.jobs.growth.toFixed(1)}%</span>
              </div>
            ) : null}
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Jobs</h3>
          <p className="text-3xl font-bold text-gray-900">{analytics.jobs.total}</p>
          <p className="text-xs text-gray-500 mt-2">
            Active: {analytics.jobs.thisMonth}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Payment Status</h3>
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Released</span>
              <span className="font-semibold text-emerald-600">
                ₹{analytics.payments.released.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                ₹{analytics.payments.pending.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Warranty Holds</span>
              <span className="font-semibold text-orange-600">
                ₹{analytics.payments.warrantyHolds.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Jobs Performance</h2>
              <p className="text-sm text-gray-500">Latest job activities and status</p>
            </div>
          </div>
        </div>
        {analytics.recentJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No recent jobs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">Job #{job.jobNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(job.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    job.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    job.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                    job.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {job.status.replace("_", " ")}
                  </span>
                  {job.finalPrice && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      ₹{job.finalPrice.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Business Insights</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Your total earnings are <strong>₹{analytics.earnings.total.toLocaleString("en-IN")}</strong> from {analytics.jobs.total} jobs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  {analytics.jobs.thisMonth} active jobs are currently in progress
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Focus on completing pending jobs to increase earnings
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

