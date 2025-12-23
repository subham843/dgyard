"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Shield,
  Star,
  FileText,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface CompletedJob {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  completedAt: string;
  amount: number;
  rating?: number;
  review?: string;
  location: {
    city: string;
    state: string;
  };
  dealer: {
    businessName: string;
  };
  warrantyDays?: number;
  warrantyEndDate?: string;
}

export function CompletedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<CompletedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, jobs]);

  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/jobs?status=COMPLETED");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch completed jobs");
        console.error("Failed to fetch completed jobs:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.jobNumber.toLowerCase().includes(query) ||
      job.dealer.businessName.toLowerCase().includes(query) ||
      job.location.city.toLowerCase().includes(query)
    );
    setFilteredJobs(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading completed jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Jobs</h1>
        <p className="text-gray-600">View your completed work history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{jobs.length}</div>
            <div className="text-sm text-gray-600">Total Completed</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              ₹{jobs.reduce((sum, j) => sum + (j.amount || 0), 0).toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-600">Total Earnings</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.rating && j.rating >= 4).length}
            </div>
            <div className="text-sm text-gray-600">High Ratings (4+)</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {jobs.filter(j => j.warrantyEndDate && new Date(j.warrantyEndDate) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Active Warranties</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 border-2">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search completed jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No completed jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="font-mono text-xs">{job.jobNumber}</span>
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                      {job.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{job.rating}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{job.dealer.businessName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location.city}, {job.location.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Completed: {formatDate(job.completedAt)}</span>
                    </div>
                    {job.amount && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{job.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {job.warrantyDays && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Warranty: {job.warrantyDays} days</span>
                      </div>
                    )}
                  </div>

                  {job.review && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs font-semibold text-blue-900 mb-1">Customer Review</div>
                      <div className="text-sm text-blue-800">{job.review}</div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/technician/jobs/${job.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

