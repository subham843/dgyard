"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface MyJob {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  status: string;
  scheduledAt?: string;
  amount?: number;
  location: {
    city: string;
    state: string;
    address?: string;
  };
  dealer: {
    businessName: string;
    fullName?: string;
  };
  hasBid?: boolean;
  bidStatus?: string;
  bidId?: string;
  bidPrice?: number;
  isAssigned?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-800", icon: Briefcase },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: PlayCircle },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  NEGOTIATION_PENDING: { label: "Bid Pending", color: "bg-orange-100 text-orange-800", icon: Clock },
  WAITING_FOR_PAYMENT: { label: "Waiting for Payment", color: "bg-orange-100 text-orange-800", icon: DollarSign },
  COMPLETION_PENDING_APPROVAL: { label: "Pending Approval", color: "bg-indigo-100 text-indigo-800", icon: AlertCircle },
};

export function MyJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MyJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMyJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, statusFilter, jobs]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      // Fetch all jobs assigned to technician AND jobs with bids (excluding completed ones)
      const response = await fetch("/api/technician/jobs?includeBids=true");
      if (response.ok) {
        const data = await response.json();
        // Filter out completed jobs for "My Jobs" page
        const activeJobs = (data.jobs || []).filter((job: MyJob) => 
          job.status !== "COMPLETED" && job.status !== "CANCELLED"
        );
        setJobs(activeJobs);
        setFilteredJobs(activeJobs);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch jobs");
        console.error("Failed to fetch jobs:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.jobNumber.toLowerCase().includes(query) ||
        job.dealer.businessName.toLowerCase().includes(query) ||
        job.location.city.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
        <p className="text-gray-600">Manage your active job assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{jobs.length}</div>
            <div className="text-sm text-gray-600">Total Active Jobs</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts["ASSIGNED"] || 0}
            </div>
            <div className="text-sm text-gray-600">Assigned</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {statusCounts["IN_PROGRESS"] || 0}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ₹{jobs.reduce((sum, j) => sum + (j.amount || 0), 0).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6 border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search jobs by title, job number, dealer, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {jobs.length === 0 
                ? "No active jobs found. Check out job discovery to find new opportunities!"
                : "No jobs match your search criteria"}
            </p>
            {jobs.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = "/technician/jobs/discover"}
              >
                Discover Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const statusInfo = statusConfig[job.status] || {
              label: job.status,
              color: "bg-gray-100 text-gray-800",
              icon: Briefcase,
            };
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={job.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm flex-wrap text-muted-foreground">
                        <span className="font-mono text-xs">{job.jobNumber}</span>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {job.hasBid && !job.isAssigned && (
                          <Badge className="bg-green-100 text-green-800">
                            Bid: {job.bidStatus === "PENDING" ? "Pending" : 
                                  job.bidStatus === "COUNTERED" ? "Countered" :
                                  job.bidStatus === "ACCEPTED" ? "Accepted" : job.bidStatus}
                            {job.bidPrice && ` (₹${job.bidPrice.toLocaleString('en-IN')})`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{job.dealer.businessName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {job.location.city}
                          {job.location.state && `, ${job.location.state}`}
                        </span>
                      </div>
                      {job.scheduledAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Scheduled: {formatDate(job.scheduledAt)}</span>
                        </div>
                      )}
                      {job.amount && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{job.amount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/technician/jobs/${job.id}`}
                      >
                        View Details
                      </Button>
                      {job.status === "ASSIGNED" && job.isAssigned && (
                        <Button
                          onClick={() => window.location.href = `/technician/jobs/${job.id}?action=start`}
                        >
                          Start Job
                        </Button>
                      )}
                      {job.hasBid && !job.isAssigned && (
                        <Button
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                          onClick={() => window.location.href = `/technician/jobs/${job.id}`}
                        >
                          View Bid Status
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
