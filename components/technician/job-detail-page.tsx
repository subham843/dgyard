"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Calendar, 
  DollarSign, 
  Clock, 
  User, 
  Phone, 
  Mail,
  PlayCircle,
  CheckCircle2,
  Loader2,
  FileText,
  AlertCircle,
  Navigation,
  X,
  Shield,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface JobDetail {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  status: string;
  scheduledAt?: string;
  amount?: number;
  warrantyDays?: number | null;
  paymentLocked?: boolean; // Payment status
  location: {
    city: string;
    state: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    placeName?: string | null;
    pincode?: string;
  };
  dealer: {
    businessName?: string;
    name?: string;
    fullName?: string;
    trustScore?: number;
    rating?: number;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  workDetails?: string;
  hasBid?: boolean;
  bidStatus?: string | null;
  hasCounterOffer?: boolean;
  counterOffer?: {
    id: string;
    offeredPrice: number;
    status: string;
    createdAt: string;
    roundNumber: number;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: "Assigned", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-800" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  WAITING_FOR_PAYMENT: { label: "Waiting for Payment", color: "bg-orange-100 text-orange-800" },
  COMPLETION_PENDING_APPROVAL: { label: "Pending Approval", color: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
};

export function JobDetailPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [accepting, setAccepting] = useState(false);
  // Map is always shown now, no need for show/hide toggle
  const [warrantyAccepted, setWarrantyAccepted] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    if (action === "start" && job?.status === "ASSIGNED") {
      handleStartJob();
    }
  }, [action, job]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technician/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch job details");
        if (response.status === 404) {
          router.push("/technician/jobs/my-jobs");
        }
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async () => {
    if (!job || job.status !== "ASSIGNED") {
      toast.error("Job cannot be started. Current status: " + job?.status);
      return;
    }

    setStarting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Job started successfully!");
        fetchJobDetails();
        // Remove action from URL
        router.replace(`/technician/jobs/${jobId}`);
      } else {
        toast.error(data.error || "Failed to start job");
      }
    } catch (error) {
      console.error("Error starting job:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setStarting(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!job || job.status !== "PENDING") {
      toast.error("Job is no longer available");
      return;
    }

    // Mandatory: Require acceptance of warranty terms and payment split disclosure
    if (job.amount && job.amount > 0 && !warrantyAccepted) {
      toast.error("Please accept the payment split and warranty terms to proceed");
      return;
    }

    setAccepting(true);
    try {
      // Direct accept endpoint - immediately accepts job and sets status to WAITING_FOR_PAYMENT
      const response = await fetch(`/api/technician/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Job accepted successfully! Waiting for dealer payment.");
        // Navigate back to discover page or refresh job details
        setTimeout(() => {
          router.push("/technician/jobs/discover");
        }, 1500);
      } else {
        toast.error(data.error || "Failed to accept job");
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectJob = () => {
    // Just navigate away - no API call needed for reject
    router.push("/technician/jobs/discover");
    toast.success("Job removed from your view");
  };

  const handleGetDirections = () => {
    if (job?.location.latitude && job.location.longitude) {
      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`;
      window.open(url, '_blank');
    } else if (job?.location.placeName) {
      // Fallback to place name search
      const placeName = encodeURIComponent(`${job.location.placeName}, ${job.location.city}, ${job.location.state}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${placeName}`;
      window.open(url, '_blank');
    } else if (job?.location.city && job.location.state) {
      // Fallback to city/state search
      const location = encodeURIComponent(`${job.location.city}, ${job.location.state}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location}`;
      window.open(url, '_blank');
    } else {
      toast.error("Location information not available");
    }
  };

  const handlePlaceBid = async () => {
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      toast.error("Please enter a valid bid price");
      return;
    }

    setBidding(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredPrice: parseFloat(bidPrice),
          message: bidMessage || "",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Bid placed successfully!");
        setShowBidForm(false);
        setBidPrice("");
        setBidMessage("");
        fetchJobDetails();
      } else {
        toast.error(data.error || "Failed to place bid");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      toast.error("Network error: Please check your connection");
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Job not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/technician/jobs/my-jobs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Jobs
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[job.status] || {
    label: job.status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/technician/jobs/my-jobs")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Jobs
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-gray-600">Job #{job.jobNumber}</p>
          </div>
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              {/* Work Details only shown after payment */}
              {job.paymentLocked && job.workDetails && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Work Details</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.workDetails}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    {/* Show only place name or city/state (not full address before payment) */}
                    <p className="font-medium text-gray-900">
                      {job.location.placeName || `${job.location.city}, ${job.location.state}`}
                    </p>
                    {job.location.placeName && (
                      <p className="text-sm text-gray-500 mt-1">{job.location.city}, {job.location.state}</p>
                    )}
                  </div>
                </div>
                
                {/* Map always shown (short location) */}
                {job.location.latitude && job.location.longitude && (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <LocationMapPicker
                        onLocationSelect={() => {}} // Empty function for read-only mode
                        initialLocation={{
                          address: job.location.address || job.location.placeName || `${job.location.city}, ${job.location.state}`,
                          lat: job.location.latitude!,
                          lng: job.location.longitude!,
                          placeName: job.location.placeName || `${job.location.city}, ${job.location.state}`,
                        }}
                        initialRadius={0}
                        readOnly={true}
                        height="300px"
                        showRadiusControl={false}
                      />
                    </div>
                    {/* Get Directions button only shown after payment */}
                    {job.paymentLocked && (
                      <Button
                        variant="outline"
                        onClick={handleGetDirections}
                        className="w-full"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information - Only shown after payment */}
          {job.paymentLocked && (job.customerName || job.customerPhone || job.customerEmail) && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.customerName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-5 h-5" />
                      <span>{job.customerName}</span>
                    </div>
                  )}
                  {job.customerPhone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-5 h-5" />
                      <a href={`tel:${job.customerPhone}`} className="hover:text-blue-600">
                        {job.customerPhone}
                      </a>
                    </div>
                  )}
                  {job.customerEmail && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-5 h-5" />
                      <a href={`mailto:${job.customerEmail}`} className="hover:text-blue-600">
                        {job.customerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Info */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dealer Trust Score and Rating - Always visible */}
              <div>
                <div className="text-sm text-gray-600 mb-1">Dealer Trust Score</div>
                {job.dealer.trustScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-lg">{job.dealer.trustScore}/100</span>
                    {job.dealer.rating !== undefined && (
                      <span className="text-xs text-gray-500">
                        (Rating: {job.dealer.rating.toFixed(1)})
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not available</p>
                )}
              </div>
              {/* Dealer Rating - Always visible */}
              {job.dealer.rating !== undefined && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Dealer Rating</div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{job.dealer.rating.toFixed(1)}/5</span>
                  </div>
                </div>
              )}
              {/* Dealer name only shown after payment */}
              {job.paymentLocked && (job.dealer.businessName || job.dealer.name) && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Dealer</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{job.dealer.businessName || job.dealer.name}</span>
                  </div>
                </div>
              )}
              {/* Amount - Always visible */}
              {job.amount && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Amount</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-lg">
                      ₹{job.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
              {/* Warranty - Always visible */}
              {job.warrantyDays && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Service Warranty</div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-blue-600">
                      {job.warrantyDays} days
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Warranty period starts after job completion
                  </p>
                </div>
              )}
              {/* Scheduled Date - Only shown after payment */}
              {job.paymentLocked && job.scheduledAt && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Scheduled Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(job.scheduledAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions - Always visible */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.status === "PENDING" && (
                <>
                  {/* Show waiting status if bid already placed */}
                  {job.hasBid && (
                    <div className="text-center text-sm text-gray-600 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="font-semibold text-yellow-800">Waiting for Dealer</p>
                      <p className="text-xs mt-1 text-yellow-700">
                        Your bid has been submitted. Waiting for dealer's response.
                      </p>
                      {job.hasCounterOffer && job.counterOffer && (
                        <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <p className="font-semibold text-orange-900">Counter Offer Received!</p>
                          </div>
                          <p className="text-sm text-orange-800 mb-2">
                            Dealer's Counter Offer: <span className="font-bold text-lg">₹{job.counterOffer.offeredPrice.toLocaleString("en-IN")}</span>
                          </p>
                          <p className="text-xs text-orange-700 mb-3">
                            Round {job.counterOffer.roundNumber} / 2
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/jobs/${jobId}/bids/${job.counterOffer?.id}/accept-technician`, {
                                    method: "POST",
                                  });
                                  if (response.ok) {
                                    toast.success("Counter offer accepted! Job assigned to you.");
                                    fetchJobDetails();
                                    setTimeout(() => {
                                      router.push("/technician/jobs/my-jobs");
                                    }, 1500);
                                  } else {
                                    const data = await response.json();
                                    toast.error(data.error || "Failed to accept counter offer");
                                  }
                                } catch (error) {
                                  console.error("Error accepting counter offer:", error);
                                  toast.error("Failed to accept counter offer");
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept Counter Offer
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/jobs/${jobId}/bids/${job.counterOffer?.id}/reject-technician`, {
                                    method: "POST",
                                  });
                                  if (response.ok) {
                                    toast.success("Counter offer rejected");
                                    fetchJobDetails();
                                  } else {
                                    const data = await response.json();
                                    toast.error(data.error || "Failed to reject counter offer");
                                  }
                                } catch (error) {
                                  console.error("Error rejecting counter offer:", error);
                                  toast.error("Failed to reject counter offer");
                                }
                              }}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show bidding options only if no bid placed */}
                  {!job.hasBid && (
                    <>
                      {/* Mandatory Warranty & Payment Disclosure - Always show */}
                      {job.amount && job.amount > 0 && (
                        <div className="mb-4 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-blue-900 mb-3">
                                  Payment & Warranty Disclosure
                                </h3>
                                
                                {/* Payment Split Information */}
                                <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
                                  <p className="text-sm font-semibold text-gray-700 mb-3">
                                    Total Job Amount: ₹{job.amount.toLocaleString('en-IN')}
                                  </p>
                                  <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      <span>
                                        <strong>80% (₹{Math.round(job.amount * 0.8).toLocaleString('en-IN')})</strong> will be credited after job completion
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                      <span>
                                        <strong>20% (₹{Math.round(job.amount * 0.2).toLocaleString('en-IN')})</strong> will be released after warranty period ends
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Warranty Information */}
                                {job.warrantyDays && (
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Shield className="w-5 h-5 text-blue-600" />
                                      <p className="text-sm font-semibold text-blue-900">
                                        Service Warranty: {job.warrantyDays} days
                                      </p>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                      Warranty period starts after job completion. The 20% hold amount will be released automatically after the warranty period if no complaints are raised.
                                    </p>
                                  </div>
                                )}

                                {/* Mandatory Acceptance Checkbox */}
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                  <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      required
                                      checked={warrantyAccepted}
                                      onChange={(e) => setWarrantyAccepted(e.target.checked)}
                                      className="w-5 h-5 mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <span className="text-sm text-blue-900 font-medium">
                                      I understand and accept the payment split (80% immediate, 20% warranty hold) and service warranty terms
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Accept/Bid buttons - Only show if no bid placed */}
                      <div className="space-y-2">
                        <Button
                          onClick={handleAcceptJob}
                          disabled={accepting || (job.amount && !warrantyAccepted)}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {accepting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept Job
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowBidForm(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Place Bid
                        </Button>
                        <Button
                          onClick={handleRejectJob}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject / Skip
                        </Button>
                      </div>
                    </>
                  )}
                  
                  <Dialog open={showBidForm} onOpenChange={setShowBidForm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Place Bid for Job</DialogTitle>
                        <DialogDescription>
                          Enter your bid price and optional message for this job.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="bidPrice">Bid Price (₹) *</Label>
                          <Input
                            id="bidPrice"
                            type="number"
                            min="1"
                            step="0.01"
                            value={bidPrice}
                            onChange={(e) => setBidPrice(e.target.value)}
                            placeholder="Enter your bid amount"
                            className="mt-1.5"
                          />
                          {job.amount && (
                            <p className="text-sm text-gray-500 mt-1">
                              Estimated cost: ₹{job.amount.toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="bidMessage">Message (Optional)</Label>
                          <Textarea
                            id="bidMessage"
                            rows={3}
                            value={bidMessage}
                            onChange={(e) => setBidMessage(e.target.value)}
                            placeholder="Add a message to the dealer..."
                            className="mt-1.5"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowBidForm(false);
                              setBidPrice("");
                              setBidMessage("");
                            }}
                            disabled={bidding}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handlePlaceBid}
                            disabled={bidding || !bidPrice || parseFloat(bidPrice) <= 0}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {bidding ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Placing Bid...
                              </>
                            ) : (
                              "Place Bid"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {job.status === "ASSIGNED" && (
                <Button
                  onClick={handleStartJob}
                  disabled={starting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Job
                    </>
                  )}
                </Button>
              )}
              {job.status === "IN_PROGRESS" && (
                <Button
                  onClick={() => {
                    try {
                      router.push(`/technician/jobs/${jobId}/complete`);
                    } catch (error) {
                      console.error("Error navigating to complete page:", error);
                      toast.error("Failed to navigate. Please try again.");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Job
                </Button>
              )}
              {job.status === "WAITING_FOR_PAYMENT" && (
                <div className="text-center text-sm text-gray-600">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p>Waiting for dealer payment</p>
                  <p className="text-xs mt-1">Job will start after payment</p>
                </div>
              )}
              {job.status === "COMPLETED" && (
                <div className="text-center text-sm text-gray-600">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p>Job completed successfully</p>
                </div>
              )}
              {job.status === "COMPLETION_PENDING_APPROVAL" && (
                <div className="text-center text-sm text-gray-600">
                  <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p>Waiting for dealer approval</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

