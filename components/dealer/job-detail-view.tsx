"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MapPin, Clock, DollarSign, Shield, AlertCircle, CheckCircle2, Navigation, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";
import { PaymentButton } from "@/components/payments/payment-button";
import { PaymentMethodDialog } from "./payment-method-dialog";
import { PaymentBreakdownPreview } from "./payment-breakdown-preview";

export function JobDetailView({ 
  job, 
  onBack, 
  onStatsUpdate 
}: { 
  job: any; 
  onBack: () => void; 
  onStatsUpdate?: () => void;
}) {
  const [jobData, setJobData] = useState(job);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [techLocation, setTechLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [paymentExists, setPaymentExists] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [paymentLocked, setPaymentLocked] = useState(false);
  const [softLockCountdown, setSoftLockCountdown] = useState<number | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    // Mark page as loaded after component mounts
    setPageLoaded(true);
    
    fetchJobDetails();
    checkPaymentStatus();
    if (jobData.status === "IN_PROGRESS" || jobData.status === "ASSIGNED") {
      startLocationTracking();
    }
  }, [jobData.id]);

  // Reset soft lock timer when page loads and job is SOFT_LOCKED
  useEffect(() => {
    const resetSoftLockTimer = async () => {
      if (pageLoaded && jobData.status === "SOFT_LOCKED") {
        try {
          const response = await fetch(`/api/jobs/${jobData.id}/reset-soft-lock`, {
            method: "POST",
          });
          
          if (response.ok) {
            const data = await response.json();
            // Start countdown from 45 seconds
            setSoftLockCountdown(45);
          } else {
            console.error("Failed to reset soft lock timer");
            // Still show countdown based on existing expiry time
            if (jobData.softLockExpiresAt) {
              const expiresAt = new Date(jobData.softLockExpiresAt).getTime();
              const now = Date.now();
              const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
              setSoftLockCountdown(remaining);
            }
          }
        } catch (error) {
          console.error("Error resetting soft lock timer:", error);
          // Fallback: use existing expiry time
          if (jobData.softLockExpiresAt) {
            const expiresAt = new Date(jobData.softLockExpiresAt).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setSoftLockCountdown(remaining);
          }
        }
      }
    };

    resetSoftLockTimer();
  }, [pageLoaded, jobData.status, jobData.id, jobData.softLockExpiresAt]);

  // Update countdown timer every second
  useEffect(() => {
    if (softLockCountdown === null || softLockCountdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSoftLockCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [softLockCountdown]);

  const fetchJobDetails = async () => {
    try {
      // Try dealer-specific endpoint first for better data
      const dealerResponse = await fetch(`/api/dealer/jobs`);
      if (dealerResponse.ok) {
        const dealerData = await dealerResponse.json();
        const dealerJob = dealerData.jobs?.find((j: any) => j.id === jobData.id);
        if (dealerJob) {
          setJobData(dealerJob);
          setPaymentLocked(dealerJob.paymentLocked || false);
          return;
        }
      }
      // Fallback to general endpoint
      const response = await fetch(`/api/jobs/${jobData.id}`);
      if (response.ok) {
        const data = await response.json();
        setJobData(data.job);
        // Check payment status separately
        await checkPaymentStatus();
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const startLocationTracking = () => {
    // Poll for technician location every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobData.id}/tracking`);
        if (response.ok) {
          const data = await response.json();
          if (data.location) {
            setTechLocation(data.location);
            setEta(data.eta);
          }
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP verified! Job marked as completed.");
        setJobData(data.job);
        onStatsUpdate?.();
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTPResend = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobData.id}/otp`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("OTP resent to customer");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Something went wrong");
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobData.id}/payment-split`);
      if (response.ok) {
        setPaymentExists(true);
        setPaymentLocked(true);
      } else if (response.status === 404) {
        setPaymentExists(false);
        // Check if payment is locked by checking job status
        // Payment is locked if status is ASSIGNED, IN_PROGRESS, or beyond
        const statusesWithPayment = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "COMPLETION_PENDING_APPROVAL"];
        if (statusesWithPayment.includes(jobData.status)) {
          setPaymentLocked(true);
        } else {
          setPaymentLocked(false);
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentExists(false);
      // Check status as fallback
      const statusesWithPayment = ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "COMPLETION_PENDING_APPROVAL"];
      setPaymentLocked(statusesWithPayment.includes(jobData.status));
    }
  };

  const handleApproveJobWithPayment = async () => {
    if (!jobData.finalPrice && !jobData.estimatedCost) {
      toast.error("Please set a final price before approving");
      return;
    }

    setPaymentLoading(true);
    try {
      const totalAmount = jobData.finalPrice || jobData.estimatedCost || 0;
      
      // First approve the job (without creating payment split)
      const response = await fetch(`/api/jobs/${jobData.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: totalAmount,
          holdPercentage: 20, // Default 20%
          warrantyDays: jobData.warrantyDays || 30,
          skipPaymentSplit: true, // Don't create payment split yet
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Job approved! Please select payment method.");
        setJobData(data.job);
        onStatsUpdate?.();
        fetchJobDetails();
        // Show payment method dialog
        setShowPaymentMethodDialog(true);
      } else {
        toast.error(data.error || "Failed to approve job");
      }
    } catch (error) {
      console.error("Error approving job:", error);
      toast.error("Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApproveJob = async () => {
    if (!jobData.finalPrice && !jobData.estimatedCost) {
      toast.error("Please set a final price before approving");
      return;
    }

    setPaymentLoading(true);
    try {
      const totalAmount = jobData.finalPrice || jobData.estimatedCost || 0;
      
      const response = await fetch(`/api/jobs/${jobData.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: totalAmount,
          holdPercentage: 20, // Default 20%
          warrantyDays: jobData.warrantyDays || 30,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Job approved! Payment split created. Please complete payment.");
        setJobData(data.job);
        setPaymentExists(true);
        onStatsUpdate?.();
        fetchJobDetails();
        // Show payment method dialog
        setShowPaymentMethodDialog(true);
      } else {
        toast.error(data.error || "Failed to approve job");
      }
    } catch (error) {
      console.error("Error approving job:", error);
      toast.error("Something went wrong");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (
    method: "ONLINE" | "CASH" | "BANK_TRANSFER",
    cashProofUrl?: string
  ) => {
    if (!jobData.finalPrice && !jobData.estimatedCost) {
      toast.error("Please set a final price before creating payment");
      return;
    }

    setPaymentLoading(true);
    const totalAmount = jobData.finalPrice || jobData.estimatedCost || 0;

    // If job is pending approval, approve it first
    if (jobData.status === "COMPLETION_PENDING_APPROVAL") {
      try {
        const approveResponse = await fetch(`/api/jobs/${jobData.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalAmount,
            holdPercentage: 20,
            warrantyDays: jobData.warrantyDays || 30,
          }),
        });

        if (!approveResponse.ok) {
          const errorData = await approveResponse.json();
          throw new Error(errorData.error || "Failed to approve job");
        }

        const approveData = await approveResponse.json();
        setJobData(approveData.job);
        onStatsUpdate?.();
        fetchJobDetails();
      } catch (error: any) {
        console.error("Error approving job:", error);
        toast.error(error.message || "Failed to approve job");
        setPaymentLoading(false);
        return;
      }
    }

    try {
      if (method === "ONLINE") {
        // Online payment via Razorpay - use job-specific endpoint
        const paymentResponse = await fetch(`/api/jobs/${jobData.id}/create-payment-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
          }),
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.error || "Failed to create payment order");
        }

        const paymentData = await paymentResponse.json();

        // Load Razorpay script
        const loadRazorpayScript = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            if ((window as any).Razorpay) {
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay script"));
            document.body.appendChild(script);
          });
        };

        await loadRazorpayScript();

        // Open Razorpay checkout
        const razorpay = new (window as any).Razorpay({
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency || "INR",
          name: "D.G.Yard",
          description: `Payment for Job ${jobData.jobNumber}`,
          order_id: paymentData.orderId,
          prefill: paymentData.prefill || {},
          theme: { color: "#3A59FF" },
          handler: async function (response: any) {
            await createPaymentSplitWithMethod(
              totalAmount,
              "ONLINE",
              response.razorpay_order_id,
              response.razorpay_payment_id
            );
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled");
              setPaymentLoading(false);
            },
          },
        });

        razorpay.open();
      } else {
        // Cash or Bank Transfer - Create payment split directly
        await createPaymentSplitWithMethod(
          totalAmount,
          method,
          undefined,
          undefined,
          cashProofUrl
        );
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment");
      setPaymentLoading(false);
    }
  };

  const createPaymentSplitWithMethod = async (
    totalAmount: number,
    paymentMethod: "ONLINE" | "CASH" | "BANK_TRANSFER",
    razorpayOrderId?: string,
    razorpayPaymentId?: string,
    cashProofUrl?: string
  ) => {
    try {
      // If job is WAITING_FOR_PAYMENT, create escrow payment first
      if (jobData.status === "WAITING_FOR_PAYMENT") {
        const escrowResponse = await fetch(`/api/jobs/${jobData.id}/lock-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: razorpayPaymentId,
            cashProofUrl: cashProofUrl,
          }),
        });

        if (!escrowResponse.ok) {
          const errorData = await escrowResponse.json();
          throw new Error(errorData.error || "Failed to lock payment");
        }

        const escrowData = await escrowResponse.json();
        if (escrowData.alreadyProcessed) {
          toast.success("Payment already processed. Updating job status...");
        } else {
          toast.success("Payment Locked Successfully. Your payment has been secured by D.G.Yard. The technician will be paid after job completion and approval.");
        }
        // Force refresh job details to get updated status
        await fetchJobDetails();
        onStatsUpdate?.();
        setPaymentLoading(false);
        return;
      }

      // For completed jobs, create payment split
      const splitResponse = await fetch(`/api/jobs/${jobData.id}/payment-split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: totalAmount,
          holdPercentage: 20, // 20% for 10 days
          warrantyDays: 10, // Changed to 10 days as per requirement
          paymentMethod: paymentMethod,
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId,
          cashProofUrl: cashProofUrl,
        }),
      });

      if (splitResponse.ok) {
        toast.success(
          paymentMethod === "ONLINE"
            ? "Payment successful! Payment split created."
            : `Payment split created. Payment method: ${paymentMethod.replace("_", " ")}`
        );
        checkPaymentStatus();
        fetchJobDetails();
        onStatsUpdate?.();
      } else {
        const errorData = await splitResponse.json();
        toast.error(`Failed to create payment split: ${errorData.error}`);
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    const description = prompt("Please describe your dispute:");
    if (!description) return;

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobData.id,
          type: "OTHER",
          title: "Dispute for " + jobData.jobNumber,
          description: description,
          evidenceUrls: [],
        }),
      });

      if (response.ok) {
        toast.success("Dispute raised successfully. Admin will review it.");
        fetchJobDetails();
        onStatsUpdate?.();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to raise dispute");
      }
    } catch (error) {
      console.error("Error raising dispute:", error);
      toast.error("Something went wrong");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(jobData.status)}`}>
            {jobData.status.replace("_", " ")}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{jobData.title}</h1>
        <p className="text-gray-600">Job #: {jobData.jobNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{jobData.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Work Details</p>
                <p className="text-gray-900">{jobData.workDetails}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Priority</p>
                  <p className="text-gray-900">{jobData.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estimated Duration</p>
                  <p className="text-gray-900">{jobData.estimatedDuration || "N/A"} hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-gray-900">{jobData.customerName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <a href={`tel:${jobData.customerPhone}`} className="text-primary hover:underline">
                    {jobData.customerPhone}
                  </a>
                </div>
                {jobData.customerEmail && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a href={`mailto:${jobData.customerEmail}`} className="text-primary hover:underline">
                      {jobData.customerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            <div className="space-y-2">
              <p className="text-gray-900">{jobData.address}</p>
              <p className="text-gray-600">
                {jobData.city}, {jobData.state} - {jobData.pincode}
              </p>
              {jobData.latitude && jobData.longitude && (
                <div className="mt-4">
                  <a
                    href={`https://www.google.com/maps?q=${jobData.latitude},${jobData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Live Technician Tracking */}
          {(jobData.status === "ASSIGNED" || jobData.status === "IN_PROGRESS") && jobData.technician && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Live Technician Tracking
              </h2>
              {techLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Technician is on the way</span>
                  </div>
                  {eta && (
                    <p className="text-sm text-gray-600">Estimated arrival: {eta}</p>
                  )}
                  <div className="mt-4 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Map view will be integrated here</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Fetching technician location...</p>
                </div>
              )}
            </div>
          )}

          {/* OTP & Job Completion */}
          {jobData.status === "IN_PROGRESS" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Job Completion</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Enter the OTP provided by the customer to complete the job
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      style={{ backgroundColor: '#3A59FF' }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRequestOTPResend}
                  className="w-full"
                >
                  Request OTP Resend
                </Button>
                <p className="text-xs text-gray-500">
                  ⚠️ Job cannot be closed without OTP verification
                </p>
              </div>
            </div>
          )}

          {/* Timeout Reasons & Repost Section */}
          {(jobData.timeoutReasons && jobData.timeoutReasons.length > 0) && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Job Timeout Information
              </h2>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-orange-900 mb-2">
                    Why technicians couldn't complete this job:
                  </p>
                  <ul className="space-y-2 text-sm text-orange-800">
                    {jobData.timeoutReasons.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600">•</span>
                        <span>
                          {reason === "SOFT_LOCK_TIMEOUT" && 
                            "Dealer did not confirm within 45 seconds after technician accepted"}
                          {reason === "PAYMENT_DEADLINE_TIMEOUT" && 
                            "Dealer did not complete payment within 30 minutes deadline"}
                          {reason === "NEGOTIATION_TIMEOUT" && 
                            "Technician did not respond to counter-offer within 5 minutes"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Repost Count</p>
                    <p className="text-lg font-semibold">
                      {jobData.repostCount || 0} / {jobData.maxReposts || 3}
                    </p>
                  </div>
                  {(jobData.repostCount || 0) < (jobData.maxReposts || 3) ? (
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/jobs/${jobData.id}/repost`, {
                            method: "POST",
                          });

                          if (response.ok) {
                            const data = await response.json();
                            toast.success(data.message || "Job reposted successfully");
                            await fetchJobDetails();
                            onStatsUpdate?.();
                          } else {
                            const errorData = await response.json();
                            if (errorData.permanentlyRejected) {
                              toast.error(errorData.error || "Job permanently rejected");
                              await fetchJobDetails();
                              onStatsUpdate?.();
                            } else {
                              toast.error(errorData.error || "Failed to repost job");
                            }
                          }
                        } catch (error) {
                          console.error("Error reposting job:", error);
                          toast.error("Something went wrong");
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Repost Job
                    </Button>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">Maximum Reposts Reached</p>
                      <p className="text-xs text-gray-500">Job cannot be reposted</p>
                    </div>
                  )}
                </div>
                {(jobData.repostCount || 0) >= (jobData.maxReposts || 3) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      This job has exceeded the maximum repost limit. It has been permanently rejected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Soft Lock Timer - When Technician Has Accepted */}
          {jobData.status === "SOFT_LOCKED" && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                Technician Has Accepted - Action Required
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-900">
                      Time Remaining to Confirm:
                    </p>
                    {softLockCountdown !== null && softLockCountdown > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold text-blue-600">
                          {softLockCountdown}
                        </div>
                        <span className="text-sm text-blue-600">seconds</span>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 font-semibold">
                        Time Expired
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: softLockCountdown !== null ? `${(softLockCountdown / 45) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    A technician has accepted this job. Please confirm within {softLockCountdown !== null && softLockCountdown > 0 ? `${softLockCountdown} seconds` : "the time limit"} to proceed with payment.
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    If you don't confirm within the time limit, the job will be returned to the pool and available for other technicians.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/jobs/${jobData.id}/confirm-soft-lock`, {
                        method: "POST",
                      });

                      if (response.ok) {
                        toast.success("Confirmed! Please proceed with payment.");
                        await fetchJobDetails();
                        onStatsUpdate?.();
                      } else {
                        const data = await response.json();
                        toast.error(data.error || "Failed to confirm");
                      }
                    } catch (error) {
                      console.error("Error confirming soft lock:", error);
                      toast.error("Something went wrong");
                    }
                  }}
                  className="w-full"
                  style={{ backgroundColor: '#3A59FF' }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm & Proceed to Payment
                </Button>
              </div>
            </div>
          )}

          {/* Payment Required - Waiting for Payment Status */}
          {jobData.status === "WAITING_FOR_PAYMENT" && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-800">
                <CreditCard className="w-5 h-5" />
                Payment Required
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Technician has accepted the job. Please complete payment to proceed. Payment will be locked in escrow until job completion.
                </p>
                <PaymentBreakdownPreview
                  jobId={jobData.id}
                  totalAmount={jobData.finalPrice || jobData.estimatedCost || 0}
                  jobType={jobData.serviceType}
                  city={jobData.city}
                  region={jobData.state}
                />
                <Button
                  onClick={() => setShowPaymentMethodDialog(true)}
                  disabled={paymentLoading || !(jobData.finalPrice || jobData.estimatedCost)}
                  className="w-full"
                  style={{ backgroundColor: '#3A59FF' }}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now & Lock Payment
                    </>
                  )}
                </Button>
                {!(jobData.finalPrice || jobData.estimatedCost) && (
                  <p className="text-xs text-red-600">
                    ⚠️ Please set final price before payment
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  💡 Payment will be held in escrow. 80% will be released after job approval, 20% will be held for 10 days warranty.
                </p>
              </div>
            </div>
          )}

          {/* Job Approval - Pending Approval Status */}
          {jobData.status === "COMPLETION_PENDING_APPROVAL" && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Job Pending Approval
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Job has been completed by technician. Please review and approve to proceed with payment.
                </p>
                <PaymentBreakdownPreview
                  jobId={jobData.id}
                  totalAmount={jobData.finalPrice || jobData.estimatedCost || 0}
                  jobType={jobData.serviceType}
                  city={jobData.city}
                  region={jobData.state}
                />
                <Button
                  onClick={() => {
                    if (!(jobData.finalPrice || jobData.estimatedCost)) {
                      toast.error("Please set final price before approving");
                      return;
                    }
                    // Show payment method dialog first, then approve
                    setShowPaymentMethodDialog(true);
                  }}
                  disabled={paymentLoading || !(jobData.finalPrice || jobData.estimatedCost)}
                  className="w-full"
                  style={{ backgroundColor: '#3A59FF' }}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve Job & Select Payment Method
                    </>
                  )}
                </Button>
                {!(jobData.finalPrice || jobData.estimatedCost) && (
                  <p className="text-xs text-red-600">
                    ⚠️ Please set final price before approving
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Section - Completed Job */}
          {jobData.status === "COMPLETED" && !paymentExists && (
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-800">
                <CreditCard className="w-5 h-5" />
                Complete Payment
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Job has been completed. Please select payment method and complete payment to release funds to technician.
                </p>
                <PaymentBreakdownPreview
                  jobId={jobData.id}
                  totalAmount={jobData.finalPrice || jobData.estimatedCost || 0}
                  jobType={jobData.serviceType}
                  city={jobData.city}
                  region={jobData.state}
                />
                <Button
                  onClick={() => setShowPaymentMethodDialog(true)}
                  disabled={paymentLoading}
                  className="w-full"
                  style={{ backgroundColor: '#3A59FF' }}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Select Payment Method
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  Choose between Online, Cash, or Bank Transfer payment
                </p>
              </div>
            </div>
          )}

          {/* Payment Details - If Payment Exists */}
          {jobData.status === "COMPLETED" && paymentExists && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Details
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Payment has been processed. View payment breakdown and warranty hold details.
                </p>
                <Link href={`/api/jobs/${jobData.id}/payment-details`} target="_blank">
                  <Button variant="outline" className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Payment Details
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Warranty Information */}
          {jobData.status === "COMPLETED" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Warranty Information
              </h2>
              <div className="space-y-3">
                {jobData.warrantyDays ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Warranty Period</p>
                      <p className="text-gray-900">{jobData.warrantyDays} days</p>
                    </div>
                    {jobData.warrantyStartDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Warranty Start Date</p>
                        <p className="text-gray-900">
                          {new Date(jobData.warrantyStartDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => toast.info("Report warranty issue form will open here")}
                      className="w-full"
                    >
                      Report Issue
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm">No warranty information available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Technician Information */}
          {jobData.technician && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Assigned Technician</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="text-gray-900 font-medium">{jobData.technician.fullName || "N/A"}</p>
                </div>
                {/* Service Location - Always visible */}
                {jobData.technician.serviceArea?.placeName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service Area</p>
                    <p className="text-gray-900">
                      {jobData.technician.serviceArea.placeName}
                      {jobData.technician.serviceArea.serviceRadiusKm && 
                        ` (${jobData.technician.serviceArea.serviceRadiusKm}km radius)`}
                    </p>
                  </div>
                )}
                {/* Contact details - Only after payment */}
                {paymentLocked && jobData.technician.mobile && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Contact</p>
                      <a
                        href={`tel:${jobData.technician.mobile}`}
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        {jobData.technician.mobile}
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`tel:${jobData.technician.mobile}`, "_self")}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Technician
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      ⚠️ Contact only through platform for payments
                    </p>
                  </>
                )}
                {!paymentLocked && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-800">
                        Complete payment to view technician contact details and other information.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Price Information
            </h2>
            <div className="space-y-3">
              {jobData.finalPrice ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Final Locked Price</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{jobData.finalPrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {jobData.priceLocked && (
                    <p className="text-xs text-red-600">
                      ⚠️ Price is locked and cannot be changed
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Expected Price</p>
                    <p className="text-xl font-semibold">
                      ₹{jobData.estimatedCost?.toLocaleString("en-IN") || "Not set"}
                    </p>
                  </div>
                  {jobData.allowBargaining && (
                    <p className="text-xs text-gray-500">
                      Price bargaining is enabled
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRaiseDispute}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Raise Dispute
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.info("View evidence feature coming soon")}
              >
                View Evidence
              </Button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Posted</p>
                <p className="text-gray-900">
                  {new Date(jobData.createdAt).toLocaleString()}
                </p>
              </div>
              {jobData.assignedAt && (
                <div>
                  <p className="text-gray-600">Assigned</p>
                  <p className="text-gray-900">
                    {new Date(jobData.assignedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {jobData.startedAt && (
                <div>
                  <p className="text-gray-600">Started</p>
                  <p className="text-gray-900">
                    {new Date(jobData.startedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {jobData.completedAt && (
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="text-gray-900">
                    {new Date(jobData.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        isOpen={showPaymentMethodDialog}
        onClose={() => setShowPaymentMethodDialog(false)}
        onSelect={handlePaymentMethodSelect}
        amount={jobData.finalPrice || jobData.estimatedCost || 0}
        jobNumber={jobData.jobNumber}
      />
    </div>
  );
}
