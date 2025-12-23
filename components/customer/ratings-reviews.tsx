"use client";

import { useState, useEffect } from "react";
import {
  Star,
  User,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Package,
  Wrench,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Review {
  id: string;
  type: "SERVICE" | "PRODUCT";
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful?: number;
}

interface ReviewableItem {
  id: string;
  type: "SERVICE" | "PRODUCT";
  name: string;
  completedAt: string;
  canReview: boolean;
}

export function RatingsReviews() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewableItems, setReviewableItems] = useState<ReviewableItem[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewableItem | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    fetchReviews();
    fetchReviewableItems();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reviews");
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewableItems = async () => {
    try {
      // Fetch completed services and delivered products that can be reviewed
      const [servicesRes, ordersRes] = await Promise.all([
        fetch("/api/bookings?status=COMPLETED"),
        fetch("/api/orders?status=DELIVERED"),
      ]);

      const servicesData = await servicesRes.json();
      const ordersData = await ordersRes.json();

      const services = (servicesData.bookings || []).map((s: any) => ({
        id: s.id,
        type: "SERVICE" as const,
        name: `${s.serviceType} - ${s.bookingNumber}`,
        completedAt: s.completedAt || s.updatedAt,
        canReview: true,
      }));

      const products = (ordersData.orders || []).flatMap((order: any) =>
        order.items.map((item: any) => ({
          id: item.productId,
          type: "PRODUCT" as const,
          name: item.product.name,
          completedAt: order.deliveredAt || order.updatedAt,
          canReview: true,
        }))
      );

      setReviewableItems([...services, ...products]);
    } catch (error) {
      console.error("Error fetching reviewable items:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!reviewForm.comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedItem.type,
          targetId: selectedItem.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Review submitted successfully!");
        setShowReviewForm(false);
        setSelectedItem(null);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews();
        fetchReviewableItems();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      // TODO: Implement helpful functionality
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    return review.type === filter;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ratings & Reviews</h1>
            <p className="text-gray-600">Share your experience and view past reviews</p>
          </div>
          {reviewableItems.length > 0 && (
            <Button onClick={() => setShowReviewForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Write Review
            </Button>
          )}
        </div>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">{reviews.length} review{reviews.length > 1 ? "s" : ""}</div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter((r) => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-sm font-medium">{rating}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>
              {selectedItem
                ? `Review: ${selectedItem.name}`
                : "Select an item to review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedItem ? (
              <div className="space-y-3">
                <Label>Select Item to Review</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {reviewableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="w-full p-3 border rounded-lg hover:bg-gray-50 text-left flex items-center gap-3"
                    >
                      {item.type === "SERVICE" ? (
                        <Wrench className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Package className="w-5 h-5 text-green-600" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <Label>Rating *</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {reviewForm.rating} out of 5
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Review Comment *</Label>
                  <Textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows={5}
                    className="mt-1"
                    placeholder="Share your experience..."
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Submit Review</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setSelectedItem(null);
                      setReviewForm({ rating: 5, comment: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="SERVICE">Service Reviews</TabsTrigger>
          <TabsTrigger value="PRODUCT">Product Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't written any reviews yet"
                : `No ${filter.toLowerCase()} reviews found`}
            </p>
            {reviewableItems.length > 0 && (
              <Button onClick={() => setShowReviewForm(true)}>
                Write Your First Review
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{review.targetName}</h4>
                          <Badge variant="outline">
                            {review.type === "SERVICE" ? (
                              <Wrench className="w-3 h-3 mr-1" />
                            ) : (
                              <Package className="w-3 h-3 mr-1" />
                            )}
                            {review.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Helpful ({review.helpful || 0})
                      </button>
                    </div>
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





