"use client";

import { useState, useEffect } from "react";
import { DollarSign, AlertCircle, Shield, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentBreakdownPreviewProps {
  jobId: string;
  totalAmount: number;
  jobType?: string;
  city?: string;
  region?: string;
}

export function PaymentBreakdownPreview({
  jobId,
  totalAmount,
  jobType,
  city,
  region,
}: PaymentBreakdownPreviewProps) {
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreakdown();
  }, [jobId, totalAmount]);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/payment-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount,
          jobType,
          city,
          region,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBreakdown(data);
      }
    } catch (error) {
      console.error("Error fetching payment breakdown:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !breakdown) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Payment Breakdown
        </CardTitle>
        <CardDescription>Platform fee and net service value breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Job Amount</span>
            <span className="text-lg font-bold text-gray-900">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-blue-200">
            <span className="text-sm font-medium text-orange-700 flex items-center gap-1">
              <Info className="w-4 h-4" />
              Platform Service Fee
            </span>
            <span className="text-lg font-bold text-orange-600">
              ₹{breakdown.platformFee.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-green-200">
            <span className="text-sm font-medium text-green-700 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Net Service Value
            </span>
            <span className="text-lg font-bold text-green-600">
              ₹{breakdown.netServiceAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-800">
                <p className="font-semibold mb-1">Warranty Protection Included</p>
                <p className="text-green-700">
                  A portion of the net service value will be held for warranty protection as per platform policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

