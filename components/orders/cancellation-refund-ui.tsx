"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  checkCancellationEligibility,
  checkRefundEligibility,
  formatTimeRemaining,
  canRequestRefund,
} from "@/lib/cancellation-refund-utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface CancellationRefundUIProps {
  order: any;
}

export function CancellationRefundUI({ order }: CancellationRefundUIProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancellationEligibility, setCancellationEligibility] = useState<any>(null);
  const [refundEligibility, setRefundEligibility] = useState<any>(null);

  useEffect(() => {
    if (!order) return;

    // Check cancellation eligibility
    if (order.status !== "CANCELLED" && order.status !== "REFUNDED") {
      const orderPlacedDate = order.orderPlacedAt 
        ? new Date(order.orderPlacedAt)
        : new Date(order.createdAt);
      
      const eligibility = checkCancellationEligibility(
        orderPlacedDate,
        order.technicianAssignedAt ? new Date(order.technicianAssignedAt) : null,
        order.workStartedAt ? new Date(order.workStartedAt) : null,
        order.status,
        order.deliveryAt ? new Date(order.deliveryAt) : null
      );
      setCancellationEligibility(eligibility);
    }

    // Check refund eligibility
    if (canRequestRefund(order.status, order.paymentStatus, order.cancelApprovedAt)) {
      const eligibility = checkRefundEligibility(
        order.cancelApprovedAt ? new Date(order.cancelApprovedAt) : null,
        order.deliveryAt ? new Date(order.deliveryAt) : null,
        order.damagedProductReportedAt ? new Date(order.damagedProductReportedAt) : null,
        order.refundStatus || "NONE"
      );
      setRefundEligibility(eligibility);
    }
  }, [order]);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Cancellation request submitted successfully");
        setShowCancelModal(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to cancel order");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for refund request");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Refund request submitted successfully");
        setShowRefundModal(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to request refund");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRefundStatusBadge = () => {
    if (!order.refundStatus || order.refundStatus === "NONE") return null;

    const statusConfig: Record<string, { color: string; icon: any; text: string }> = {
      REQUESTED: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Refund Requested",
      },
      APPROVED: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        text: "Refund Approved",
      },
      REJECTED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Refund Rejected",
      },
      PROCESSING: {
        color: "bg-purple-100 text-purple-800",
        icon: RefreshCw,
        text: "Refund Processing",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Refund Completed",
      },
    };

    const config = statusConfig[order.refundStatus];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Refund Status Badge */}
      {getRefundStatusBadge()}

      {/* Cancellation Section */}
      {order.status !== "CANCELLED" &&
        order.status !== "REFUNDED" &&
        cancellationEligibility && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold mb-2">Cancel Order</h3>
            {cancellationEligibility.eligible ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  You can cancel this order within{" "}
                  {cancellationEligibility.timeRemaining &&
                    formatTimeRemaining(cancellationEligibility.timeRemaining)}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{cancellationEligibility.reason}</p>
              </div>
            )}
          </div>
        )}

      {/* Refund Section */}
      {(order.status === "CANCELLED" || (order.status === "DELIVERED" && order.paymentStatus === "PAID")) &&
        canRequestRefund(order.status, order.paymentStatus, order.cancelApprovedAt) &&
        refundEligibility && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold mb-2">Request Refund</h3>
            {refundEligibility.eligible ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {order.status === "DELIVERED"
                    ? "Report damaged or incorrect product within "
                    : "You can request a refund within "}
                  {refundEligibility.timeRemaining &&
                    formatTimeRemaining(refundEligibility.timeRemaining)}
                </p>
                {(!order.refundStatus || order.refundStatus === "NONE") && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRefundModal(true)}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {order.status === "DELIVERED" ? "Report Issue & Request Refund" : "Request Refund"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{refundEligibility.reason}</p>
              </div>
            )}
          </div>
        )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Cancel Order</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancellation:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading || !reason.trim()}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Request Refund</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for refund request:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter refund reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false);
                  setReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={loading || !reason.trim()}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Refund Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

