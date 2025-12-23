"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Star, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  User,
  Building2,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface JobInfo {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  dealer?: {
    businessName: string;
  };
  technician?: {
    fullName: string;
  };
  customerName?: string;
}

type ReviewType = "DEALER_TO_TECHNICIAN" | "CUSTOMER_TO_TECHNICIAN" | "CUSTOMER_TO_DEALER";

export function JobReviewPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewType = searchParams.get("type") as ReviewType | null;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  useEffect(() => {
    if (!reviewType) {
      toast.error("Invalid review type");
      router.push("/");
      return;
    }
    fetchJobInfo();
  }, [jobId, reviewType]);

  const fetchJobInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJobInfo(data.job);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch job information");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Network error: Please check your connection");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5 stars");
      return;
    }

    setSubmitting(true);

    try {
      let response;
      let body: any = { rating, comment: comment.trim() || null };

      if (reviewType === "DEALER_TO_TECHNICIAN") {
        // Dealer reviewing technician
        response = await fetch(`/api/reviews/technician/${jobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (reviewType === "CUSTOMER_TO_TECHNICIAN") {
        // Customer reviewing technician - single review
        response = await fetch(`/api/reviews/job/${jobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technicianRating: rating,
            technicianComment: comment.trim() || null,
          }),
        });
      } else if (reviewType === "CUSTOMER_TO_DEALER") {
        // Customer reviewing dealer - single review
        response = await fetch(`/api/reviews/job/${jobId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealerRating: rating,
            dealerComment: comment.trim() || null,
          }),
        });
      } else {
        toast.error("Invalid review type");
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      if (response.ok) {
        toast.success("Review submitted successfully!");
        setSubmitted(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewTitle = () => {
    switch (reviewType) {
      case "DEALER_TO_TECHNICIAN":
        return "Review Technician";
      case "CUSTOMER_TO_TECHNICIAN":
        return "Review Technician";
      case "CUSTOMER_TO_DEALER":
        return "Review Dealer";
      default:
        return "Submit Review";
    }
  };

  const getReviewDescription = () => {
    switch (reviewType) {
      case "DEALER_TO_TECHNICIAN":
        return `Please rate the technician who completed job ${jobInfo?.jobNumber}`;
      case "CUSTOMER_TO_TECHNICIAN":
        return `Please rate the technician who completed your service ${jobInfo?.jobNumber}`;
      case "CUSTOMER_TO_DEALER":
        return `Please rate the dealer for service ${jobInfo?.jobNumber}`;
      default:
        return "Submit your review";
    }
  };

  const getRevieweeName = () => {
    if (reviewType === "DEALER_TO_TECHNICIAN" || reviewType === "CUSTOMER_TO_TECHNICIAN") {
      return jobInfo?.technician?.fullName || "Technician";
    } else if (reviewType === "CUSTOMER_TO_DEALER") {
      return jobInfo?.dealer?.businessName || "Dealer";
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </div>
    );
  }

  if (!reviewType || !jobInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Invalid review link</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full border-2">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your feedback. Your review has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{getReviewTitle()}</CardTitle>
            <CardDescription>{getReviewDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Job #{jobInfo.jobNumber}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{jobInfo.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                {reviewType === "DEALER_TO_TECHNICIAN" || reviewType === "CUSTOMER_TO_TECHNICIAN" ? (
                  <>
                    <User className="w-4 h-4" />
                    <span>Technician: {getRevieweeName()}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Dealer: {getRevieweeName()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Rating */}
            <div>
              <Label>Rating *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} {rating === 1 ? "star" : "stars"}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="mt-1"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

