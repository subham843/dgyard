"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Wallet, 
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  Calendar,
  Building2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface WithdrawalData {
  availableBalance: number;
  minimumWithdrawLimit: number;
  payoutTimeline: string;
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  } | null;
  withdrawalHistory: Array<{
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
    bankReference?: string;
    upiReference?: string;
  }>;
}

export function WithdrawPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WithdrawalData>({
    availableBalance: 0,
    minimumWithdrawLimit: 500,
    payoutTimeline: "3-5 business days",
    bankDetails: null,
    withdrawalHistory: [],
  });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchWithdrawalData();
  }, []);

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/withdraw");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching withdrawal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < data.minimumWithdrawLimit) {
      toast.error(`Minimum withdrawal amount is ₹${data.minimumWithdrawLimit}`);
      return;
    }

    if (amount > data.availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!data.bankDetails) {
      toast.error("Please add bank details first");
      window.location.href = "/technician/bank-details";
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmWithdrawal = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/technician/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
        }),
      });

      if (response.ok) {
        toast.success("Withdrawal request submitted successfully!");
        setShowConfirmModal(false);
        setWithdrawAmount("");
        fetchWithdrawalData();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw Funds</h1>
          <p className="text-gray-600">Request payout to your bank account</p>
        </div>

        {/* Available Balance */}
        <Card className="mb-6 border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-700">Available Balance</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{data.availableBalance.toLocaleString('en-IN')}
                </div>
              </div>
              <Wallet className="w-12 h-12 text-blue-600" />
            </div>
          </CardHeader>
        </Card>

        {/* Bank Details Check */}
        {!data.bankDetails && (
          <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Bank Details Required</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Please add your bank account details to request withdrawals.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/technician/bank-details"}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Add Bank Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal Form */}
        {data.bankDetails && (
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Minimum withdrawal: ₹{data.minimumWithdrawLimit} | 
                Payout timeline: {data.payoutTimeline}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={data.minimumWithdrawLimit}
                    max={data.availableBalance}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Available: ₹{data.availableBalance.toLocaleString('en-IN')} | 
                    Min: ₹{data.minimumWithdrawLimit}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Bank Account Details</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><strong>Account:</strong> {data.bankDetails.accountHolderName}</div>
                    <div><strong>Bank:</strong> {data.bankDetails.bankName}</div>
                    <div><strong>Account No:</strong> ****{data.bankDetails.accountNumber.slice(-4)}</div>
                    <div><strong>IFSC:</strong> {data.bankDetails.ifscCode}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.location.href = "/technician/bank-details"}
                  >
                    Update Bank Details
                  </Button>
                </div>

                <Button
                  onClick={handleWithdrawRequest}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) < data.minimumWithdrawLimit}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Request Withdrawal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdrawal History */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
            <CardDescription>Track your payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            {data.withdrawalHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.withdrawalHistory.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          ₹{withdrawal.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Requested: {formatDate(withdrawal.requestedAt)}
                        </div>
                        {withdrawal.processedAt && (
                          <div className="text-sm text-gray-600">
                            Processed: {formatDate(withdrawal.processedAt)}
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status}
                      </Badge>
                    </div>
                    {withdrawal.bankReference && (
                      <div className="text-xs text-gray-500">
                        Bank Ref: {withdrawal.bankReference}
                      </div>
                    )}
                    {withdrawal.upiReference && (
                      <div className="text-xs text-gray-500">
                        UPI Ref: {withdrawal.upiReference}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw ₹{withdrawAmount}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-2">
                <div><strong>Amount:</strong> ₹{parseFloat(withdrawAmount).toLocaleString('en-IN')}</div>
                <div><strong>Bank:</strong> {data.bankDetails?.bankName}</div>
                <div><strong>Timeline:</strong> {data.payoutTimeline}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmWithdrawal}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





