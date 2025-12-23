"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Loader2,
  Search,
  Eye,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AvailableJob {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  workDetails?: string;
  status: string;
  priority?: string;
  scheduledAt?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  amount?: number; // Commission-deducted amount for technicians
  location: {
    city: string;
    state: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  dealer: {
    businessName?: string;
    name?: string;
    trustScore?: number;
    rating?: number;
  };
  serviceCategory?: {
    title: string;
  };
  serviceSubCategory?: {
    title: string;
  };
  serviceDomain?: {
    title: string;
  };
}

export function JobDiscoveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<AvailableJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAvailableJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, jobs]);

  const fetchAvailableJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs?status=available", {
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Jobs API Response:", data);
        console.log("Jobs count:", data.jobs?.length || 0);
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch available jobs");
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.jobNumber.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.location.city.toLowerCase().includes(query) ||
        job.location.state.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "NORMAL":
        return "bg-blue-100 text-blue-800";
      case "LOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading available jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Jobs</h1>
        <p className="text-gray-600">Browse available job opportunities matching your skills and location</p>
      </div>

      {/* Search */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search jobs by title, job number, or location..."
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
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {jobs.length === 0 
                ? "No available jobs at the moment"
                : "No jobs match your search criteria"}
            </p>
            {jobs.length === 0 && (
              <p className="text-sm text-gray-500">
                Check back later for new job opportunities
              </p>
            )}
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
                    <div className="flex items-center gap-4 text-sm flex-wrap text-muted-foreground">
                      <span className="font-mono text-xs">{job.jobNumber}</span>
                      <Badge className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                      {job.priority && (
                        <Badge className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 mb-2">{job.description}</p>
                    {job.workDetails && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Work Details:</p>
                        <p className="text-sm text-gray-600">{job.workDetails}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Location</p>
                        <p className="text-sm text-gray-900">
                          {job.location.placeName || `${job.location.city}, ${job.location.state}`}
                        </p>
                      </div>
                    </div>

                    {/* Show dealer trust score instead of name (before payment) */}
                    {job.dealer?.trustScore !== undefined && (
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Dealer Trust Score</p>
                          <p className="text-sm text-gray-900">
                            {job.dealer.trustScore}/100
                            {job.dealer.rating !== undefined && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Rating: {job.dealer.rating.toFixed(1)})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show amount (commission-deducted) - this is the net payout for technician */}
                    {job.amount && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Job Payout</p>
                          <p className="text-sm text-gray-900">
                            ₹{job.amount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.estimatedDuration && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Estimated Duration</p>
                          <p className="text-sm text-gray-900">{job.estimatedDuration} hours</p>
                        </div>
                      </div>
                    )}

                    {job.scheduledAt && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Scheduled</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(job.scheduledAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => router.push(`/technician/jobs/${job.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
