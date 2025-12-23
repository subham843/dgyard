"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Briefcase, Star, CheckCircle2, Clock, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface JobWithRating {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  dealerName: string;
  technicianName: string | null;
  completedAt: string | null;
  canRate: boolean;
  hasRated: boolean;
  ratingStatus: {
    dealer: string;
    technician: string;
  };
  dealerReview: { rating: number } | null;
  technicianReview: { rating: number } | null;
}

export function ServiceHistory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchJobs();
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/customer/jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load service history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETION_PENDING_APPROVAL: "bg-orange-100 text-orange-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderRatingStatus = (ratingStatus: string, review: { rating: number } | null) => {
    if (ratingStatus === "RATED" && review) {
      return (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{review.rating}/5</span>
        </div>
      );
    } else if (ratingStatus === "PENDING") {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Rate Now
        </Badge>
      );
    } else if (ratingStatus === "NOT_AVAILABLE") {
      return <span className="text-xs text-gray-400">N/A</span>;
    } else {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service History</h1>
        <p className="text-gray-600">View and rate your completed services</p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No services found</p>
              <p className="text-gray-600">You haven't booked any services yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {job.title}
                    </CardTitle>
                    <CardDescription>
                      Job #{job.jobNumber} • {job.dealerName}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Job Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Technician:</span>
                      <span className="ml-2 font-medium">
                        {job.technicianName || "Not assigned"}
                      </span>
                    </div>
                    {job.completedAt && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(job.completedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rating Status */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Dealer Rating</p>
                        {renderRatingStatus(job.ratingStatus.dealer, job.dealerReview)}
                      </div>
                      {job.technicianName && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Technician Rating</p>
                          {renderRatingStatus(job.ratingStatus.technician, job.technicianReview)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {job.canRate && !job.hasRated && (
                      <Button
                        size="sm"
                        onClick={() => {
                          router.push(`/reviews/rate?jobId=${job.id}`);
                        }}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Rate Service
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
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

