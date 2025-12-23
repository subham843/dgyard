"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, Star, Edit, Trash2, Eye, EyeOff, AlertTriangle, 
  Filter, X, Calendar, User, Briefcase, RefreshCw,
  FileText, Image as ImageIcon, CheckCircle2, XCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobReview {
  id: string;
  jobId: string;
  reviewType: string;
  reviewerId: string;
  reviewerRole: string;
  revieweeId: string;
  revieweeType: string;
  rating: number;
  comment: string | null;
  otpVerified: boolean;
  isLocked: boolean;
  isHidden: boolean;
  isFlagged: boolean;
  isDisputed: boolean;
  disputeReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  job: {
    id: string;
    jobNumber: string;
    title: string;
    beforePhotos: string[];
    afterPhotos: string[];
    completionOtp: string | null;
    otpVerifiedAt: string | null;
  };
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function RatingManagement() {
  const [reviews, setReviews] = useState<JobReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<JobReview | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    role: "all",
    star: "all",
    jobId: "",
    dateFrom: "",
    dateTo: "",
    status: "all", // all, hidden, disputed, flagged
  });

  const [editData, setEditData] = useState({
    rating: 5,
    comment: "",
    adminNotes: "",
  });

  const [hideReason, setHideReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    fetchRatings();
  }, [filters, search]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role !== "all") params.append("role", filters.role);
      if (filters.star !== "all") params.append("star", filters.star);
      if (filters.jobId) params.append("jobId", filters.jobId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.status !== "all") params.append("status", filters.status);
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/ratings?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch ratings");
      
      const data = await response.json();
      setReviews(data.ratings || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (review: JobReview) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const handleEdit = (review: JobReview) => {
    setSelectedReview(review);
    setEditData({
      rating: review.rating,
      comment: review.comment || "",
      adminNotes: review.adminNotes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReview) return;

    try {
      const response = await fetch(`/api/admin/ratings/${selectedReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editData.rating,
          comment: editData.comment,
          adminNotes: editData.adminNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to update rating");

      toast.success("Rating updated successfully");
      setShowEditModal(false);
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update rating");
    }
  };

  const handleHide = async () => {
    if (!selectedReview || !hideReason) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      const response = await fetch(`/api/admin/ratings/${selectedReview.id}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: hideReason }),
      });

      if (!response.ok) throw new Error("Failed to hide rating");

      toast.success("Rating hidden successfully");
      setShowHideModal(false);
      setHideReason("");
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to hide rating");
    }
  };

  const handleUnhide = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/ratings/${reviewId}/unhide`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to unhide rating");

      toast.success("Rating unhidden successfully");
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to unhide rating");
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    try {
      const response = await fetch(`/api/admin/ratings/${selectedReview.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete rating");

      toast.success("Rating deleted successfully. Trust scores will be recalculated.");
      setShowDeleteModal(false);
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rating");
    }
  };

  const handleMarkDisputed = async () => {
    if (!selectedReview || !disputeReason) {
      toast.error("Please provide a dispute reason");
      return;
    }

    try {
      const response = await fetch(`/api/admin/ratings/${selectedReview.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      });

      if (!response.ok) throw new Error("Failed to mark as disputed");

      toast.success("Rating marked as disputed");
      setShowDisputeModal(false);
      setDisputeReason("");
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as disputed");
    }
  };

  const handleRemoveDispute = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/ratings/${reviewId}/dispute`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove dispute");

      toast.success("Dispute removed");
      fetchRatings();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove dispute");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
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
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
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

  const getStatusBadge = (review: JobReview) => {
    if (review.isHidden) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
          <EyeOff className="w-3 h-3" />
          Hidden
        </span>
      );
    }
    if (review.isDisputed) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Disputed
        </span>
      );
    }
    if (review.isFlagged) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Flagged
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rating Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all ratings between customers, dealers, and technicians
          </p>
        </div>
        <Button onClick={fetchRatings} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by job, reviewer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters({ ...filters, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="DEALER">Dealer</SelectItem>
                <SelectItem value="TECHNICIAN">Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Star Rating</Label>
            <Select
              value={filters.star}
              onValueChange={(value) => setFilters({ ...filters, star: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Job ID</Label>
            <Input
              placeholder="Filter by Job ID"
              value={filters.jobId}
              onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
            />
          </div>

          <div>
            <Label>Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <Label>Date To</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  role: "all",
                  star: "all",
                  jobId: "",
                  dateFrom: "",
                  dateTo: "",
                  status: "all",
                });
                setSearch("");
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Ratings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading ratings...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ratings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">{review.reviewer.name || review.reviewer.email}</div>
                          <div className="text-xs text-gray-500">{review.reviewerRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getReviewTypeLabel(review.reviewType)}</td>
                    <td className="px-4 py-3">{renderStars(review.rating)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono">{review.job.jobNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(review)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(review)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(review)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {review.isHidden ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnhide(review.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowHideModal(true);
                            }}
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}
                        {review.isDisputed ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDispute(review.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setShowDisputeModal(true);
                            }}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReview && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rating Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reviewer</Label>
                  <p className="text-sm">{selectedReview.reviewer.name || selectedReview.reviewer.email}</p>
                  <p className="text-xs text-gray-500">{selectedReview.reviewerRole}</p>
                </div>
                <div>
                  <Label>Review Type</Label>
                  <p className="text-sm">{getReviewTypeLabel(selectedReview.reviewType)}</p>
                </div>
                <div>
                  <Label>Rating</Label>
                  {renderStars(selectedReview.rating)}
                </div>
                <div>
                  <Label>OTP Verified</Label>
                  <p className="text-sm">{selectedReview.otpVerified ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label>Job Number</Label>
                  <p className="text-sm font-mono">{selectedReview.job.jobNumber}</p>
                </div>
                <div>
                  <Label>Job Title</Label>
                  <p className="text-sm">{selectedReview.job.title}</p>
                </div>
              </div>
              
              {selectedReview.comment && (
                <div>
                  <Label>Review Comment</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedReview.comment}</p>
                </div>
              )}

              <div>
                <Label>OTP Source</Label>
                <p className="text-sm">
                  {selectedReview.job.otpVerifiedAt 
                    ? `Verified at ${new Date(selectedReview.job.otpVerifiedAt).toLocaleString()}`
                    : "Not verified"}
                </p>
              </div>

              {selectedReview.job.afterPhotos && selectedReview.job.afterPhotos.length > 0 && (
                <div>
                  <Label>Photos Uploaded</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedReview.job.afterPhotos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedReview.adminNotes && (
                <div>
                  <Label>Admin Notes</Label>
                  <p className="text-sm bg-blue-50 p-3 rounded">{selectedReview.adminNotes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {selectedReview && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rating</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={editData.rating}
                onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Comment</Label>
              <Textarea
                value={editData.comment}
                onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
              />
            </div>
            <div>
              <Label>Admin Notes (Internal Only)</Label>
              <Textarea
                value={editData.adminNotes}
                onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                placeholder="Internal notes for admin reference..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Hide Modal */}
      {selectedReview && (
        <Dialog open={showHideModal} onOpenChange={setShowHideModal}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide Rating</DialogTitle>
            <DialogDescription>
              Provide a reason for hiding this rating. It will not be visible to users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason *</Label>
              <Select
                value={hideReason}
                onValueChange={setHideReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fake_review">Fake Review</SelectItem>
                  <SelectItem value="abuse_language">Abusive Language</SelectItem>
                  <SelectItem value="duplicate">Duplicate Review</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHideModal(false)}>Cancel</Button>
            <Button onClick={handleHide}>Hide Rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Delete Modal */}
      {selectedReview && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rating</DialogTitle>
            <DialogDescription>
              This will permanently delete the rating and recalculate trust scores. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Dispute Modal */}
      {selectedReview && (
        <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Disputed</DialogTitle>
            <DialogDescription>
              Mark this rating as disputed. It will be flagged for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dispute Reason *</Label>
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this rating is disputed..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeModal(false)}>Cancel</Button>
            <Button onClick={handleMarkDisputed}>Mark as Disputed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}


