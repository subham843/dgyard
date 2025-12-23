"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { 
  Star, Eye, EyeOff, Flag, AlertTriangle, CheckCircle2, 
  Loader2, MessageSquare, User, Briefcase, Filter
} from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  id: string;
  reviewType: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  isFlagged: boolean;
  isLocked: boolean;
  aiConfidenceScore: number | null;
  aiFlags: string[];
  createdAt: string;
  job: {
    id: string;
    jobNumber: string;
    title: string;
  };
  reviewer: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export function ReviewModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReviews(activeTab);
  }, [activeTab]);

  const fetchReviews = async (filter: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reviews/moderation?filter=${filter}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await response.json();
      setReviews(data.reviews || []);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reviewId: string, action: string, reason?: string) => {
    try {
      const response = await fetch("/api/admin/reviews/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update review");
      }

      toast.success(data.message || "Review updated successfully");
      fetchReviews(activeTab);
    } catch (error: any) {
      toast.error(error.message || "Failed to update review");
    }
  };

  const getReviewTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CUSTOMER_TO_DEALER: "Customer → Dealer",
      CUSTOMER_TO_TECHNICIAN: "Customer → Technician",
      DEALER_TO_TECHNICIAN: "Dealer → Technician",
      TECHNICIAN_TO_DEALER: "Technician → Dealer",
    };
    return labels[type] || type;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Review Moderation</h1>
        <p className="text-gray-600">Manage and moderate job reviews</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Reviews ({total})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged {reviews.filter((r) => r.isFlagged && !r.isHidden).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reviews.filter((r) => r.isFlagged && !r.isHidden).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hidden">Hidden</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No reviews found</p>
                  <p className="text-gray-600">
                    {activeTab === "all" && "No reviews have been submitted yet."}
                    {activeTab === "flagged" && "No flagged reviews."}
                    {activeTab === "hidden" && "No hidden reviews."}
                    {activeTab === "pending" && "No pending reviews."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className={review.isFlagged ? "border-red-200 bg-red-50/50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {getReviewTypeLabel(review.reviewType)}
                        </CardTitle>
                        {review.isFlagged && (
                          <Badge variant="destructive">
                            <Flag className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        {review.isHidden && (
                          <Badge variant="secondary">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Job: #{review.job.jobNumber} - {review.job.title}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {renderStars(review.rating)}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Reviewer Info */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {review.reviewer.name || review.reviewer.email}
                        </span>
                        <Badge variant="outline">{review.reviewer.role}</Badge>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {review.aiFlags && review.aiFlags.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">AI Flags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {review.aiFlags.map((flag, idx) => (
                            <Badge key={idx} variant="outline" className="text-yellow-700 border-yellow-300">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                        {review.aiConfidenceScore && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Confidence: {(review.aiConfidenceScore * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {!review.isHidden ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt("Reason for hiding (optional):");
                            handleAction(review.id, "hide", reason || undefined);
                          }}
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(review.id, "unhide")}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Unhide
                        </Button>
                      )}
                      {review.isFlagged ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(review.id, "unflag")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Unflag
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(review.id, "flag")}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Flag
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

