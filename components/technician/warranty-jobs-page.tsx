"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Camera,
  MapPin,
  Building2,
  Loader2,
  RefreshCw,
  WifiOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface WarrantyJob {
  id: string;
  jobNumber: string;
  title: string;
  warrantyDaysLeft: number;
  holdAmount: number;
  complaintStatus: string;
  complaintDetails?: string;
  location: {
    city: string;
    state: string;
  };
  dealer: {
    businessName: string;
  };
}

export function WarrantyJobsPage() {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<WarrantyJob[]>([]);

  useEffect(() => {
    fetchWarrantyJobs();
  }, []);

  const fetchWarrantyJobs = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/technician/warranty", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to fetch warranty jobs";
        let errorDetails: any = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          errorDetails = errorData;
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = "Please login to view warranty jobs";
          } else if (response.status === 404) {
            errorMessage = "Technician profile not found";
          } else if (response.status === 500) {
            errorMessage = errorData.details || errorData.message || "Server error. Please try again later";
          }
        } catch (parseError) {
          // If JSON parsing fails, use status-based message
          if (response.status === 401) {
            errorMessage = "Please login to view warranty jobs";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later";
          } else if (response.status >= 400 && response.status < 500) {
            errorMessage = "Invalid request. Please refresh the page";
          }
        }
        
        setError(errorMessage);
        setJobs([]);
        
        if (showToast) {
          toast.error(errorMessage, {
            duration: 4000,
            icon: <AlertCircle className="w-5 h-5" />,
          });
        }
        
        console.error("Error fetching warranty jobs:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails,
        });
        
        return;
      }
      
      const data = await response.json();
      const warrantyJobs = data.jobs || [];
      
      setJobs(warrantyJobs);
      setError(null);
      
      if (showToast && warrantyJobs.length > 0) {
        toast.success(`Loaded ${warrantyJobs.length} warranty job${warrantyJobs.length > 1 ? 's' : ''}`, {
          duration: 2000,
        });
      }
    } catch (error: any) {
      let errorMessage = "Failed to fetch warranty jobs";
      
      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setJobs([]);
      
      if (showToast) {
        toast.error(errorMessage, {
          duration: 4000,
          icon: <WifiOff className="w-5 h-5" />,
        });
      }
      
      console.error("Error fetching warranty jobs:", {
        error,
        message: errorMessage,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await fetchWarrantyJobs(true);
  };

  if (loading && !retrying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading warranty jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Warranty & Complaint Management</h1>
          <p className="text-gray-600">Manage warranty jobs and complaints</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={loading || retrying}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || retrying) ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && !loading ? (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Warranty Jobs</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying..." : "Try Again"}
            </Button>
          </CardContent>
        </Card>
      ) : jobs.length === 0 && !loading ? (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Warranty Jobs Found</h3>
            <p className="text-gray-600 mb-4">
              You don't have any active warranty jobs at the moment.
            </p>
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {retrying && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="py-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Refreshing warranty jobs...</span>
                </div>
              </CardContent>
            </Card>
          )}
          {jobs.map((job) => (
            <Card key={job.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription className="font-mono text-xs">{job.jobNumber}</CardDescription>
                  </div>
                  <Badge className={job.complaintStatus === "RESOLVED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {job.complaintStatus || "ACTIVE"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Warranty Days Left</div>
                      <div className="font-semibold text-orange-600">{job.warrantyDaysLeft} days</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Hold Amount</div>
                      <div className="font-semibold">₹{job.holdAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{job.dealer.businessName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location.city}, {job.location.state}</span>
                    </div>
                  </div>

                  {job.complaintDetails && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="font-semibold text-yellow-900 mb-1">Complaint Details</div>
                      <div className="text-sm text-yellow-800">{job.complaintDetails}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {job.complaintStatus !== "RESOLVED" && (
                      <>
                        <Button variant="outline" size="sm">
                          Acknowledge
                        </Button>
                        <Button variant="outline" size="sm">
                          Visit Confirmation
                        </Button>
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Upload Fix Proof
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Mark Resolved
                        </Button>
                      </>
                    )}
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




