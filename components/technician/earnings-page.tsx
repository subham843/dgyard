"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Wallet, 
  Lock, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface EarningsData {
  lifetimeEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  lockedAmount: number;
  penalties: number;
  jobPayments: Array<{
    id: string;
    jobNumber: string;
    jobTitle: string;
    amount: number;
    immediatePayment: number;
    holdAmount: number;
    status: string;
    warrantyEndDate?: string;
    createdAt: string;
  }>;
}

export function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<EarningsData>({
    lifetimeEarnings: 0,
    paidAmount: 0,
    pendingAmount: 0,
    lockedAmount: 0,
    penalties: 0,
    jobPayments: [],
  });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/technician/earnings", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const responseText = await response.text();
      console.log("API Response Status:", response.status);
      console.log("API Response Text:", responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error("API Error:", errorData);
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
      
      const data = JSON.parse(responseText);
      console.log("Earnings data received:", data);
      
      // Ensure data has all required fields
      setEarnings({
        lifetimeEarnings: data.lifetimeEarnings || 0,
        paidAmount: data.paidAmount || 0,
        pendingAmount: data.pendingAmount || 0,
        lockedAmount: data.lockedAmount || 0,
        penalties: data.penalties || 0,
        jobPayments: data.jobPayments || [],
      });
    } catch (error: any) {
      console.error("Error fetching earnings:", error);
      setError(error.message || "Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "LOCKED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Overview</h1>
          <p className="text-gray-600">Track your payments and earnings</p>
        </div>
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Earnings</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={fetchEarnings}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Overview</h1>
        <p className="text-gray-600">Track your payments and earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Lifetime Earnings</CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{earnings.lifetimeEarnings.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Paid Amount</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{earnings.paidAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Pending Amount</CardTitle>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{earnings.pendingAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Locked (Warranty)</CardTitle>
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{earnings.lockedAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600 mt-1">Held until warranty ends</p>
          </CardContent>
        </Card>
      </div>

      {/* Job-wise Payments */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Job-wise Payment View</CardTitle>
          <CardDescription>Detailed payment breakdown for each job</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.jobPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No payment records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.jobPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{payment.jobTitle}</div>
                      <div className="text-sm text-gray-600 font-mono">{payment.jobNumber}</div>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Job Amount</div>
                      <div className="font-semibold">₹{payment.amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Immediate Payment</div>
                      <div className="font-semibold text-green-600">
                        ₹{payment.immediatePayment.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Hold Amount</div>
                      <div className="font-semibold text-orange-600">
                        ₹{payment.holdAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    {payment.warrantyEndDate && (
                      <div>
                        <div className="text-gray-600 mb-1">Warranty Ends</div>
                        <div className="font-semibold text-sm">
                          {formatDate(payment.warrantyEndDate)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    Payment Date: {formatDate(payment.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




