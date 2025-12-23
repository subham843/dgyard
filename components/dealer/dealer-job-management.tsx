"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Search, Filter, Eye, Clock, CheckCircle2, AlertCircle, Loader2, User, Phone, MapPin, Calendar, CreditCard, DollarSign, Plus, MessageSquare, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { JobBiddingPanel } from "./job-bidding-panel";

interface DealerJobManagementProps {
  onStatsUpdate?: () => void;
  onNavigateToPostJob?: () => void;
}

const jobStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  WAITING_FOR_PAYMENT: "bg-orange-100 text-orange-800",
  ASSIGNED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPUTED: "bg-orange-100 text-orange-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function DealerJobManagement({ onStatsUpdate, onNavigateToPostJob }: DealerJobManagementProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showBids, setShowBids] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const paymentProcessingRef = useRef<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/dealer/jobs${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch jobs (${response.status})`;
        
        if (response.status === 401) {
          toast.error("Please login to view jobs");
        } else if (response.status === 403) {
          toast.error("You don't have permission to view jobs");
        } else {
          toast.error(errorMessage);
        }
        console.error("Error fetching jobs:", response.status, errorData);
        return;
      }
      
      const data = await response.json();
      // Extra safety: Ensure technician is null when payment not locked
      const safeJobs = (data.jobs || []).map((job: any) => {
        if (!job.paymentLocked) {
          // Explicitly remove technician info if payment not locked
          return {
            ...job,
            technician: null,
            bids: job.bids?.map((bid: any) => ({
              ...bid,
              technician: null,
            })) || [],
          };
        }
        return job;
      });
      setJobs(safeJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Real-time updates every 30 seconds
  useRealtimeNotifications({
    interval: 30000,
    enabled: true,
    onUpdate: fetchJobs,
  });

  const viewJobDetail = (job: any) => {
    // Extra safety: Ensure technician is null when payment not locked
    const safeJob = {
      ...job,
      technician: job.paymentLocked ? job.technician : null,
      bids: job.bids?.map((bid: any) => ({
        ...bid,
        technician: job.paymentLocked ? bid.technician : null,
      })) || [],
    };
    setSelectedJob(safeJob);
    setShowDetail(true);
  };

  const handlePayment = async (job: any) => {
    if (!job || job.status !== "WAITING_FOR_PAYMENT") {
      toast.error("Job is not ready for payment");
      return;
    }

    const totalAmount = job.finalPrice || job.estimatedCost || 0;
    if (totalAmount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    setProcessingPayment(job.id);

    try {
      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Create Razorpay order for job payment
      const paymentResponse = await fetch("/api/payments/create-job-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          amount: totalAmount,
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        toast.error(paymentData.error || "Failed to initialize payment");
        setProcessingPayment(null);
        return;
      }

      // Initialize Razorpay checkout
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        name: "D.G.Yard",
        description: `Payment for Job ${job.jobNumber}`,
        order_id: paymentData.orderId,
        prefill: {
          name: paymentData.prefill?.name || "",
          email: paymentData.prefill?.email || "",
        },
        theme: {
          color: "#3A59FF",
        },
        handler: async function (response: any) {
          // Prevent duplicate processing using ref (synchronous check)
          const paymentKey = `${job.id}_${response.razorpay_payment_id}`;
          if (paymentProcessingRef.current.has(paymentKey)) {
            console.log("Payment already being processed, ignoring duplicate call");
            return;
          }

          try {
            // Mark payment as processing
            paymentProcessingRef.current.add(paymentKey);
            
            // Call lock-payment API with payment details
            const lockPaymentResponse = await fetch(`/api/jobs/${job.id}/lock-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                totalAmount: totalAmount,
                paymentMethod: "ONLINE",
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              }),
            });

            const lockPaymentData = await lockPaymentResponse.json();
            if (!lockPaymentResponse.ok) {
              toast.error(lockPaymentData.error || "Failed to process payment");
              setProcessingPayment(null);
              paymentProcessingRef.current.delete(paymentKey);
              return;
            }

            // Check if payment was already processed (idempotent response)
            if (lockPaymentData.alreadyProcessed) {
              toast.success("Payment already processed. Updating job status...");
            } else {
              toast.success("Payment Locked Successfully. Your payment has been secured by D.G.Yard. The technician will be paid after job completion and approval.");
            }
            
            setProcessingPayment(null);
            // Remove payment flag after successful processing
            paymentProcessingRef.current.delete(paymentKey);
            
            // Force refresh jobs to get updated status
            await fetchJobs();
            if (onStatsUpdate) onStatsUpdate();
            
            // If viewing job detail, close it to force refresh
            if (showDetail && selectedJob?.id === job.id) {
              setShowDetail(false);
              setSelectedJob(null);
            }
            if (showDetail && selectedJob?.id === job.id) {
              setShowDetail(false);
              setSelectedJob(null);
            }
          } catch (error: any) {
            console.error("Error locking payment:", error);
            toast.error("Payment successful but failed to update job. Please contact support.");
            setProcessingPayment(null);
            // Remove payment flag on error
            paymentProcessingRef.current.delete(paymentKey);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(null);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment");
      setProcessingPayment(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    // Filter by status
    if (statusFilter === "REJECTED") {
      if (job.status !== "CANCELLED" || !job.rejectedAt) return false;
    } else if (statusFilter === "CANCELLED") {
      if (job.status !== "CANCELLED" || job.rejectedAt) return false;
    } else if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    const matchesSearch = 
      job.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerPhone?.includes(searchQuery);
    return matchesSearch;
  });

  // Separate rejected jobs (CANCELLED with rejectedAt)
  const rejectedJobs = jobs.filter(j => j.status === "CANCELLED" && j.rejectedAt);
  const cancelledJobs = jobs.filter(j => j.status === "CANCELLED" && !j.rejectedAt);

  const statusCounts = {
    all: jobs.length,
    PENDING: jobs.filter(j => j.status === "PENDING").length,
    APPROVED: jobs.filter(j => j.status === "APPROVED").length,
    WAITING_FOR_PAYMENT: jobs.filter(j => j.status === "WAITING_FOR_PAYMENT").length,
    ASSIGNED: jobs.filter(j => j.status === "ASSIGNED").length,
    IN_PROGRESS: jobs.filter(j => j.status === "IN_PROGRESS").length,
    COMPLETED: jobs.filter(j => j.status === "COMPLETED").length,
    CANCELLED: cancelledJobs.length,
    REJECTED: rejectedJobs.length,
    DISPUTED: jobs.filter(j => j.status === "DISPUTED").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32 border border-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Service Jobs</h2>
          <p className="text-gray-600 font-serif text-sm mt-1">Manage your service job posts and track their progress</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (onNavigateToPostJob) {
                onNavigateToPostJob();
              } else {
                router.push("/dashboard/jobs");
              }
            }}
            className="font-serif bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
          <Button
            onClick={fetchJobs}
            variant="outline"
            className="font-serif"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by job number, title, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-serif"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-serif text-sm font-semibold transition-colors ${
              statusFilter === status
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()} ({count})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-serif">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 p-6 transition-all"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-serif">
                        Job #: {job.jobNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-serif font-semibold ${jobStatusColors[job.status as keyof typeof jobStatusColors] || "bg-gray-100 text-gray-800"}`}>
                        {job.status}
                      </span>
                      {job.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-serif font-semibold ${priorityColors[job.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}`}>
                          {job.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="font-serif">{job.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="font-serif">{job.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="font-serif">{job.city}, {job.state}</span>
                    </div>
                    {job.scheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-serif">
                          {new Date(job.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {job.description && (
                    <p className="text-sm text-gray-600 font-serif line-clamp-2 mb-4">
                      {job.description}
                    </p>
                  )}

                  {/* Rejection Details for Rejected Jobs */}
                  {job.rejectedAt && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 mb-1">
                            Job Permanently Rejected
                          </p>
                          <p className="text-sm text-red-800 mb-2">
                            Rejected on: {new Date(job.rejectedAt).toLocaleString()}
                          </p>
                          {job.rejectionReason && (
                            <p className="text-sm text-red-700 mb-2">
                              <strong>Reason:</strong> {job.rejectionReason}
                            </p>
                          )}
                          {job.timeoutReasons && job.timeoutReasons.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-red-900 mb-1">
                                Timeout Reasons:
                              </p>
                              <ul className="text-xs text-red-700 space-y-1">
                                {job.timeoutReasons.map((reason: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>
                                      {reason === "SOFT_LOCK_TIMEOUT" && 
                                        "Dealer did not confirm within 45 seconds"}
                                      {reason === "PAYMENT_DEADLINE_TIMEOUT" && 
                                        "Dealer did not complete payment within 30 minutes"}
                                      {reason === "NEGOTIATION_TIMEOUT" && 
                                        "Technician did not respond to counter-offer within 5 minutes"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {job.repostCount !== undefined && (
                            <p className="text-xs text-red-600 mt-2">
                              Repost attempts: {job.repostCount} / {job.maxReposts || 3}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Only show technician info if payment is locked */}
                  {job.paymentLocked && job.technician && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <div className="flex items-center gap-4 flex-wrap">
                        {job.technician.fullName && (
                          <span className="font-serif font-semibold">
                            Assigned to: {job.technician.fullName}
                          </span>
                        )}
                        {job.technician.trustScore !== undefined && (
                          <span className="font-serif">Trust Score: {job.technician.trustScore}/100</span>
                        )}
                        {job.technician.rating !== undefined && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-serif">Rating: {job.technician.rating.toFixed(1)}/5</span>
                          </div>
                        )}
                        {job.technician.serviceArea?.placeName && (
                          <div className="text-xs text-gray-500">
                            <span className="font-serif">Service Area: {job.technician.serviceArea.placeName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {job.bids && job.bids.length > 0 && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-serif font-semibold">{job.bids.length} bid(s) received</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  {job.status === "PENDING" && job.bids && job.bids.length > 0 && (
                    <Button
                      onClick={() => {
                        // Extra safety: Ensure technician is null when payment not locked
                        const safeJob = {
                          ...job,
                          technician: job.paymentLocked ? job.technician : null,
                          bids: job.bids?.map((bid: any) => ({
                            ...bid,
                            technician: job.paymentLocked ? bid.technician : null,
                          })) || [],
                        };
                        setSelectedJob(safeJob);
                        setShowBids(true);
                      }}
                      className="font-serif w-full lg:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View & Manage Bids ({job.bids.length})
                    </Button>
                  )}
                  {job.status === "WAITING_FOR_PAYMENT" && (
                    <Button
                      onClick={() => handlePayment(job)}
                      disabled={processingPayment === job.id}
                      className="font-serif w-full lg:w-auto bg-green-600 hover:bg-green-700"
                    >
                      {processingPayment === job.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now (₹{(job.finalPrice || job.estimatedCost || 0).toLocaleString('en-IN')})
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => viewJobDetail(job)}
                    variant="outline"
                    className="font-serif w-full lg:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      {showDetail && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                  {selectedJob.title}
                </h2>
                <p className="text-sm text-gray-500 font-serif">
                  Job #: {selectedJob.jobNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedJob(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-serif font-semibold ${jobStatusColors[selectedJob.status as keyof typeof jobStatusColors] || "bg-gray-100 text-gray-800"}`}>
                    {selectedJob.status}
                  </span>
                </div>
                {selectedJob.priority && (
                  <div>
                    <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Priority</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-serif font-semibold ${priorityColors[selectedJob.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}`}>
                      {selectedJob.priority}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Name</label>
                    <p className="text-gray-900 font-serif">{selectedJob.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Phone</label>
                    <p className="text-gray-900 font-serif">{selectedJob.customerPhone}</p>
                  </div>
                  {selectedJob.customerEmail && (
                    <div>
                      <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Email</label>
                      <p className="text-gray-900 font-serif">{selectedJob.customerEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Address</h3>
                <p className="text-gray-900 font-serif">
                  {selectedJob.address}, {selectedJob.city}, {selectedJob.state} - {selectedJob.pincode}
                </p>
                {selectedJob.placeName && (
                  <p className="text-gray-600 font-serif text-sm mt-1">{selectedJob.placeName}</p>
                )}
              </div>

              {/* Job Details */}
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-2">
                  {selectedJob.description && (
                    <div>
                      <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Description</label>
                      <p className="text-gray-900 font-serif">{selectedJob.description}</p>
                    </div>
                  )}
                  {selectedJob.workDetails && (
                    <div>
                      <label className="text-sm font-serif font-semibold text-gray-700 mb-1 block">Work Details</label>
                      <p className="text-gray-900 font-serif whitespace-pre-wrap">{selectedJob.workDetails}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Technician - Only show if payment is locked */}
              {selectedJob.paymentLocked && selectedJob.technician && (
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Assigned Technician</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedJob.technician.fullName && (
                      <p className="font-serif font-semibold text-gray-900 mb-2">{selectedJob.technician.fullName}</p>
                    )}
                    {selectedJob.technician.mobile && (
                      <p className="text-sm text-gray-600 font-serif">{selectedJob.technician.mobile}</p>
                    )}
                    {selectedJob.technician.email && (
                      <p className="text-sm text-gray-600 font-serif">{selectedJob.technician.email}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {selectedJob.technician.trustScore !== undefined && (
                        <span className="text-sm font-serif font-medium">Trust Score: {selectedJob.technician.trustScore}/100</span>
                      )}
                      {selectedJob.technician.rating !== undefined && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-serif font-medium">Rating: {selectedJob.technician.rating.toFixed(1)}/5</span>
                        </div>
                      )}
                    </div>
                    {selectedJob.technician.serviceArea?.placeName && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-serif mb-1">Service Area:</p>
                        <p className="text-sm text-gray-700 font-serif">{selectedJob.technician.serviceArea.placeName}</p>
                      </div>
                    )}
                    {selectedJob.technician.skills && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-serif mb-1">Skills:</p>
                        <p className="text-sm text-gray-700 font-serif">
                          {Array.isArray(selectedJob.technician.skills) 
                            ? selectedJob.technician.skills.map((s: any) => s.skill || s).join(", ")
                            : "Available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bids */}
              {selectedJob.bids && selectedJob.bids.length > 0 && (
                <div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">
                    Bids ({selectedJob.bids.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedJob.bids.map((bid: any) => (
                      <div key={bid.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            {/* Only show technician info if payment is locked */}
                            {selectedJob.paymentLocked && bid.technician ? (
                              <>
                                {bid.technician.fullName && (
                                  <p className="font-serif font-semibold text-gray-900 mb-1">
                                    {bid.technician.fullName}
                                  </p>
                                )}
                                {bid.technician.mobile && (
                                  <p className="text-sm text-gray-600 font-serif">
                                    {bid.technician.mobile}
                                  </p>
                                )}
                                {bid.technician.email && (
                                  <p className="text-sm text-gray-600 font-serif">
                                    {bid.technician.email}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  {bid.technician.trustScore !== undefined && (
                                    <span className="text-sm font-serif">Trust Score: {bid.technician.trustScore}/100</span>
                                  )}
                                  {bid.technician.rating !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                      <span className="text-sm font-serif">Rating: {bid.technician.rating.toFixed(1)}/5</span>
                                    </div>
                                  )}
                                </div>
                                {bid.technician.serviceArea?.placeName && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 font-serif mb-1">Service Area:</p>
                                    <p className="text-sm text-gray-700 font-serif">{bid.technician.serviceArea.placeName}</p>
                                  </div>
                                )}
                                {bid.technician.skills && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 font-serif mb-1">Skills:</p>
                                    <p className="text-sm text-gray-700 font-serif">
                                      {Array.isArray(bid.technician.skills) 
                                        ? bid.technician.skills.map((s: any) => s.skill || s).join(", ")
                                        : "Available"}
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-500 font-serif mb-2">Technician details will be available after payment</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            {(bid.quotedAmount || bid.offeredPrice) && (
                              <p className="font-serif font-bold text-gray-900 text-lg">
                                ₹{(bid.quotedAmount || bid.offeredPrice).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {bid.message && (
                          <p className="text-sm text-gray-600 font-serif mt-2">{bid.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Section */}
              {selectedJob.status === "WAITING_FOR_PAYMENT" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                        Payment Required
                      </h3>
                      <p className="text-sm text-gray-600 font-serif">
                        Please complete the payment to proceed with the job
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-serif mb-1">Total Amount</p>
                      <p className="text-2xl font-serif font-bold text-gray-900">
                        ₹{(selectedJob.finalPrice || selectedJob.estimatedCost || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePayment(selectedJob)}
                    disabled={processingPayment === selectedJob.id}
                    className="w-full bg-green-600 hover:bg-green-700 font-serif"
                    size="lg"
                  >
                    {processingPayment === selectedJob.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Dates */}
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-serif">Created:</span>
                    <span className="text-gray-900 font-serif">
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedJob.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-serif">Scheduled:</span>
                      <span className="text-gray-900 font-serif">
                        {new Date(selectedJob.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedJob.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-serif">Last Updated:</span>
                      <span className="text-gray-900 font-serif">
                        {new Date(selectedJob.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bidding Panel Modal */}
      {showBids && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <JobBiddingPanel
              job={selectedJob}
              onBack={() => {
                setShowBids(false);
                setSelectedJob(null);
                fetchJobs(); // Refresh jobs list
              }}
              onAccept={() => {
                setShowBids(false);
                setSelectedJob(null);
                fetchJobs(); // Refresh jobs list
                if (onStatsUpdate) onStatsUpdate(); // Update stats
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
