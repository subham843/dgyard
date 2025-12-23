"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Search, CheckCircle2, X, AlertCircle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface ReturnsRefundsRMAProps {
  onStatsUpdate?: () => void;
}

export function ReturnsRefundsRMA({ onStatsUpdate }: ReturnsRefundsRMAProps) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      // Fetch orders with refund status
      const response = await fetch("/api/dealer/orders");
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        const returnRequests = orders.filter((o: any) => o.refundStatus && o.refundStatus !== "NONE");
        setReturns(returnRequests);
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAction = async (returnId: string, action: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      const response = await fetch(`/api/dealer/orders/${returnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundStatus: action,
          adminNotes: reason,
        }),
      });

      if (response.ok) {
        toast.success(`Return ${action.toLowerCase()}`);
        fetchReturns();
        onStatsUpdate?.();
      } else {
        toast.error("Failed to update return status");
      }
    } catch (error) {
      console.error("Error updating return:", error);
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Returns, Refunds & RMA</h2>
        <p className="text-gray-500 mt-1">Manage return requests and refunds</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-12">
          Returns & Refunds management - Integration with order refund system. 
          Return requests will appear here when customers request returns.
        </p>
        {returns.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">{returns.length} return request(s) found</p>
          </div>
        )}
      </div>
    </div>
  );
}
