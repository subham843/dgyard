"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, Users, Building2, Award, Clock, 
  CheckCircle2, XCircle, Star, DollarSign, Search, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DealerPerformanceData {
  id: string;
  name: string;
  email: string;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  activeJobs: number;
  trustScore: number;
  accountStatus: string;
}

export function DealerPerformance() {
  const [dealers, setDealers] = useState<DealerPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "revenue" | "totalJobs">("rating");

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/performance/dealers");
      if (response.ok) {
        const data = await response.json();
        setDealers(data.dealers || []);
      }
    } catch (error) {
      console.error("Error fetching dealer performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDealers = dealers
    .filter((d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "totalJobs":
          return b.totalJobs - a.totalJobs;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
      SUSPENDED: "bg-red-100 text-red-800 border-red-200",
      REJECTED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  const stats = {
    total: dealers.length,
    averageRating: dealers.reduce((sum, d) => sum + (d.averageRating || 0), 0) / dealers.length || 0,
    averageCompletionRate: dealers.reduce((sum, d) => sum + d.completionRate, 0) / dealers.length || 0,
    totalRevenue: dealers.reduce((sum, d) => sum + d.totalRevenue, 0),
    totalJobs: dealers.reduce((sum, d) => sum + d.totalJobs, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dealer Performance</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and analyze dealer performance metrics</p>
            </div>
            <Button onClick={fetchPerformanceData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Dealers</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Avg Rating</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.averageRating.toFixed(1)} ⭐
                  </p>
                </div>
                <Star className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Avg Completion</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.averageCompletionRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Total Jobs</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{stats.totalJobs}</p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search dealers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="totalJobs">Sort by Total Jobs</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        ) : filteredDealers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No dealers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dealer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trust Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDealers.map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{dealer.name}</div>
                          <div className="text-sm text-gray-500">{dealer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className={`w-4 h-4 mr-1 ${getRatingColor(dealer.averageRating || 0)} fill-current`} />
                          <span className={`text-sm font-semibold ${getRatingColor(dealer.averageRating || 0)}`}>
                            {(dealer.averageRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Total: {dealer.totalJobs}</div>
                          <div className="text-xs text-gray-500">
                            Completed: {dealer.completedJobs} | Active: {dealer.activeJobs} | Cancelled: {dealer.cancelledJobs}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                dealer.completionRate >= 90
                                  ? "bg-green-600"
                                  : dealer.completionRate >= 70
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${dealer.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">{dealer.completionRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{(dealer.totalRevenue / 1000).toFixed(0)}K
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-sm font-semibold ${
                            dealer.trustScore >= 80 ? "text-green-600" :
                            dealer.trustScore >= 60 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {dealer.trustScore.toFixed(0)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(dealer.accountStatus)}`}>
                          {dealer.accountStatus.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

