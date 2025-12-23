"use client";

import { useState, useEffect } from "react";
import { 
  AlertCircle, 
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  FileText,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface DisputedJob {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  disputeReason: string;
  disputeStatus: string;
  disputeDetails?: string;
  location: {
    city: string;
    state: string;
  };
  dealer: {
    businessName: string;
  };
  amount: number;
  createdAt: string;
}

export function DisputedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<DisputedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DisputedJob | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState("");

  useEffect(() => {
    fetchDisputedJobs();
  }, []);

  const fetchDisputedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/disputes");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        toast.error("Failed to fetch disputed jobs");
      }
    } catch (error) {
      console.error("Error fetching disputed jobs:", error);
      toast.error("Failed to load disputed jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedJob || !response.trim()) {
      toast.error("Please enter your response");
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/dispute/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        toast.success("Response submitted successfully");
        setShowResponseModal(false);
        setResponse("");
        fetchDisputedJobs();
      } else {
        toast.error("Failed to submit response");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Something went wrong");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading disputed jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Disputed Jobs</h1>
        <p className="text-gray-600">Manage job disputes and complaints</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No disputed jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="border-2 border-red-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="font-mono text-xs">{job.jobNumber}</span>
                      <Badge className={getStatusColor(job.disputeStatus)}>
                        {job.disputeStatus.replace("_", " ")}
                      </Badge>
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
                    {job.amount && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{job.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-semibold text-red-900 mb-2">Dispute Reason</div>
                    <div className="text-sm text-red-800">{job.disputeReason}</div>
                  </div>

                  {job.disputeDetails && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="font-semibold text-yellow-900 mb-2">Dispute Details</div>
                      <div className="text-sm text-yellow-800">{job.disputeDetails}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `/technician/jobs/${job.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Job Details
                    </Button>
                    {job.disputeStatus !== "RESOLVED" && (
                      <Button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowResponseModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Submit Response
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Dispute Response</DialogTitle>
            <DialogDescription>
              Provide your side of the story regarding this dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedJob && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold">{selectedJob.title}</div>
                <div className="text-sm text-gray-600">{selectedJob.jobNumber}</div>
              </div>
            )}
            <div>
              <Label htmlFor="response">Your Response *</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Explain your side of the dispute..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={!response.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

