"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface JobInfo {
  id: string;
  jobNumber: string;
  title: string;
  dealerName: string;
  technicianName?: string;
  completedAt: string;
}

export function CustomerRatingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // OTP
  const [otp, setOtp] = useState("");
  
  // Dealer rating
  const [dealerRating, setDealerRating] = useState(0);
  const [dealerComment, setDealerComment] = useState("");
  
  // Technician rating
  const [technicianRating, setTechnicianRating] = useState(0);
  const [technicianComment, setTechnicianComment] = useState("");

  useEffect(() => {
    if (!jobId) {
      toast.error("Job ID is required");
      router.push("/");
      return;
    }
    fetchJobInfo();
  }, [jobId]);

  const fetchJobInfo = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job information");
      }
      const data = await response.json();
      setJobInfo(data.job);
    } catch (error: any) {
      toast.error(error.message || "Failed to load job information");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (dealerRating === 0) {
      toast.error("Please rate the dealer");
      return;
    }

    if (technicianRating === 0 && jobInfo?.technicianName) {
      toast.error("Please rate the technician");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/job/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp,
          dealerRating,
          dealerComment: dealerComment || undefined,
          technicianRating: jobInfo?.technicianName ? technicianRating : undefined,
          technicianComment: jobInfo?.technicianName ? (technicianComment || undefined) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit reviews");
      }

      toast.success("Thank you for your feedback! Reviews submitted successfully.");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit reviews");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void,
    label: string
  ) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="text-sm text-gray-600">
            {value === 1 && "Poor"}
            {value === 2 && "Fair"}
            {value === 3 && "Good"}
            {value === 4 && "Very Good"}
            {value === 5 && "Excellent"}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!jobInfo) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12 text-center">
                <div>
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Job not found</p>
                  <Button onClick={() => router.push("/")} className="mt-4">
                    Go Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Rate Your Experience</CardTitle>
            <CardDescription>
              Job #{jobInfo.jobNumber} - {jobInfo.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Verification */}
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  Enter OTP (sent to your phone/email)
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500">
                  Check your SMS or email for the completion OTP
                </p>
              </div>

              <div className="border-t pt-6 space-y-6">
                {/* Dealer Rating */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rate Dealer</h3>
                  <p className="text-sm text-gray-600">{jobInfo.dealerName}</p>
                  
                  {renderStarRating(dealerRating, setDealerRating, "Rating")}
                  
                  <div className="space-y-2">
                    <label htmlFor="dealer-comment" className="text-sm font-medium">
                      Comment (Optional)
                    </label>
                    <Textarea
                      id="dealer-comment"
                      placeholder="Share your experience with the dealer..."
                      value={dealerComment}
                      onChange={(e) => setDealerComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Technician Rating */}
                {jobInfo.technicianName && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-lg">Rate Technician</h3>
                    <p className="text-sm text-gray-600">{jobInfo.technicianName}</p>
                    
                    {renderStarRating(technicianRating, setTechnicianRating, "Rating")}
                    
                    <div className="space-y-2">
                      <label htmlFor="technician-comment" className="text-sm font-medium">
                        Comment (Optional)
                      </label>
                      <Textarea
                        id="technician-comment"
                        placeholder="Share your experience with the technician..."
                        value={technicianComment}
                        onChange={(e) => setTechnicianComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Reviews
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Once submitted, reviews cannot be edited or deleted. Warranty will start after submission.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

