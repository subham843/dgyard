"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Wallet, 
  Lock, 
  TrendingUp,
  Bell,
  AlertCircle,
  Power,
  PowerOff,
  Search,
  FileText,
  Shield,
  MapPin,
  Calendar,
  User,
  Building2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import Link from "next/link";

interface DashboardStats {
  activeJobs: number;
  upcomingJobs: number;
  openBiddingJobs: number;
  totalEarnings: number;
  availableBalance: number;
  warrantyHoldBalance: number;
  trustScore: number;
  trustBadge?: string;
  trustBadgeColor?: string;
  averageRating?: number;
  totalReviews?: number;
  isOnline: boolean;
  alerts: number;
}

export function TechnicianDashboardComplete() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    upcomingJobs: 0,
    openBiddingJobs: 0,
    totalEarnings: 0,
    availableBalance: 0,
    warrantyHoldBalance: 0,
    trustScore: 0,
    isOnline: true,
    alerts: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentBids, setRecentBids] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (showToast = false) => {
    try {
      if (!showToast) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Fetch stats with cache-busting
      try {
        const statsRes = await fetch("/api/technician/dashboard/stats", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
          },
        });
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          console.log("Dashboard stats received:", statsData);
          setStats(statsData);
        } else {
          let errorData = {};
          try {
            errorData = await statsRes.json();
          } catch (e) {
            console.error("Could not parse error response:", e);
          }
          console.error("Failed to fetch stats:", statsRes.status, statsRes.statusText, errorData);
          // Don't show error toast on initial load, only log
          if (showToast) {
            toast.error(errorData.error || `Failed to load dashboard stats (${statsRes.status})`);
          }
        }
      } catch (fetchError) {
        console.error("Error fetching stats:", fetchError);
        if (showToast) {
          toast.error("Network error: Could not connect to server");
        }
      }

      // Fetch recent jobs (assigned jobs) with cache-busting  
      const jobsRes = await fetch("/api/jobs?limit=5", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setRecentJobs(jobsData.jobs || []);
      } else {
        console.error("Failed to fetch jobs:", jobsRes.status, jobsRes.statusText);
      }

      // Fetch recent bids with cache-busting
      const bidsRes = await fetch("/api/technician/bids?limit=5", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json();
        setRecentBids(bidsData.bids || []);
      } else {
        console.error("Failed to fetch bids:", bidsRes.status, bidsRes.statusText);
      }

      // Fetch notifications with cache-busting
      const notifRes = await fetch("/api/notifications?limit=10&unreadOnly=false", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      } else {
        console.error("Failed to fetch notifications:", notifRes.status, notifRes.statusText);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
    toast.success("Refreshing dashboard...");
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh removed - manual refresh button available
  }, [fetchDashboardData]);

  const toggleAvailability = async () => {
    try {
      const response = await fetch("/api/technician/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: !stats.isOnline }),
      });

      if (response.ok) {
        setStats(prev => ({ ...prev, isOnline: !prev.isOnline }));
        toast.success(`You are now ${!stats.isOnline ? 'online' : 'offline'}`);
      } else {
        toast.error("Failed to update availability");
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleAvailability}
              variant={stats.isOnline ? "default" : "outline"}
              className={`${stats.isOnline ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {stats.isOnline ? (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Online
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Offline
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/technician/notifications">
              <Button variant="outline" className="relative">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                {stats.alerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.alerts}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Jobs */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeJobs ?? 0}</div>
            <Link href="/technician/jobs/my-jobs" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Jobs</CardTitle>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingJobs ?? 0}</div>
            <Link href="/technician/jobs/my-jobs?filter=upcoming" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Open Bidding Jobs */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Open Bidding</CardTitle>
              <Search className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.openBiddingJobs ?? 0}</div>
            <Link href="/technician/jobs/discover" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
              Browse jobs <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Trust Score & Rating */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Trust Score & Rating</CardTitle>
              <Shield className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-3xl font-bold text-gray-900">{stats.trustScore ?? 0}/100</div>
                  {(stats.trustBadge || stats.trustBadgeColor) && (
                    <Badge 
                      className={`${
                        stats.trustBadgeColor === "green" ? "bg-green-100 text-green-800" :
                        stats.trustBadgeColor === "yellow" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}
                    >
                      {stats.trustBadge || "NORMAL"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">Trust Score</p>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {(stats.averageRating ?? 0).toFixed(1)} ⭐
                  </div>
                  <span className="text-sm text-gray-600">
                    ({(stats.totalReviews ?? 0)} {(stats.totalReviews ?? 0) === 1 ? "review" : "reviews"})
                  </span>
                </div>
                <p className="text-xs text-gray-600">Average Rating</p>
              </div>
              <Link href="/technician/trust-score" className="text-sm text-green-600 hover:underline flex items-center gap-1 mt-2">
                View details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings */}
        <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Total Earnings</CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{stats.totalEarnings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600">Lifetime earnings</p>
          </CardContent>
        </Card>

        {/* Available Balance */}
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Available Balance</CardTitle>
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{stats.availableBalance.toLocaleString('en-IN')}
            </div>
            <Link href="/technician/withdraw">
              <Button size="sm" className="mt-2 w-full bg-blue-600 hover:bg-blue-700">
                Withdraw Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Warranty Hold */}
        <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Warranty Hold</CardTitle>
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{stats.warrantyHoldBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600">Locked until warranty period ends</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Jobs */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Your latest job activities</CardDescription>
              </div>
              <Link href="/technician/jobs/my-jobs">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{job.title || job.jobNumber}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3" />
                        {job.dealer?.businessName || "N/A"}
                      </div>
                    </div>
                    <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Bids</CardTitle>
                <CardDescription>Your latest bidding activities</CardDescription>
              </div>
              <Link href="/technician/jobs/discover">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent bids</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{bid.job?.title || bid.job?.jobNumber}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <DollarSign className="w-3 h-3" />
                        ₹{(bid.offeredPrice || bid.bidAmount)?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Badge variant={
                      bid.status === 'ACCEPTED' ? 'default' : 
                      bid.status === 'REJECTED' ? 'destructive' : 
                      'secondary'
                    }>
                      {bid.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/technician/jobs/discover">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Search className="w-6 h-6" />
                <span>Browse Jobs</span>
              </Button>
            </Link>
            <Link href="/technician/jobs/my-jobs">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Briefcase className="w-6 h-6" />
                <span>My Jobs</span>
              </Button>
            </Link>
            <Link href="/technician/earnings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <DollarSign className="w-6 h-6" />
                <span>Earnings</span>
              </Button>
            </Link>
            <Link href="/technician/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <User className="w-6 h-6" />
                <span>Profile</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

