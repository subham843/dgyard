"use client";

import { useState, useEffect } from "react";
import { DollarSign, Lock, Calendar, AlertCircle, Loader2, FileText } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WithdrawalRequestDialog } from "./withdrawal-request-dialog";

interface JobPaymentDetailsProps {
  jobId: string;
  showWithdrawalButton?: boolean;
}

export function JobPaymentDetails({ jobId, showWithdrawalButton = false }: JobPaymentDetailsProps) {
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [jobId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/payment-details`);
      if (!response.ok) {
        throw new Error("Failed to fetch payment details");
      }
      const data = await response.json();
      setPaymentDetails(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentDetails || !paymentDetails.payment) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No payment information available for this job</p>
        </CardContent>
      </Card>
    );
  }

  const { payment, warrantyHold, availableBalance } = paymentDetails;

  return (
    <div className="space-y-4">
      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Breakdown</CardTitle>
          <CardDescription>Job: {paymentDetails.job.jobNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-semibold">{formatPrice(payment.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Immediate Payment</p>
              <p className="text-xl font-semibold text-green-600">
                {formatPrice(payment.immediateAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warranty Hold</p>
              <p className="text-xl font-semibold text-orange-600">
                {formatPrice(payment.warrantyHoldAmount)} ({payment.holdPercentage}%)
              </p>
            </div>
            {/* Commission details - only shown to dealers/admins, not technicians */}
            {payment.commissionAmount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Platform Fee ({payment.commissionRate}%)</p>
                <p className="text-xl font-semibold text-orange-600">
                  {formatPrice(payment.commissionAmount)}
                </p>
              </div>
            )}
            <div className="col-span-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">Net Amount (After Commission)</p>
              <p className="text-2xl font-bold">{formatPrice(payment.netAmount)}</p>
            </div>
          </div>

          {availableBalance > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available for Withdrawal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(availableBalance)}
                  </p>
                </div>
                {showWithdrawalButton && (
                  <WithdrawalRequestDialog
                    jobId={jobId}
                    availableBalance={availableBalance}
                    onSuccess={fetchPaymentDetails}
                  />
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Payment Method: {payment.paymentMethod}</p>
            {payment.paidAt && <p>Paid At: {formatDate(payment.paidAt)}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Warranty Hold Details */}
      {warrantyHold && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Warranty Hold Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hold Amount</p>
                <p className="text-xl font-semibold">{formatPrice(warrantyHold.holdAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Period</p>
                <p className="text-xl font-semibold">{warrantyHold.warrantyDays} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    warrantyHold.status === "LOCKED"
                      ? "default"
                      : warrantyHold.status === "FROZEN"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {warrantyHold.status}
                </Badge>
              </div>
              {warrantyHold.status === "LOCKED" && (
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-xl font-semibold">{warrantyHold.daysRemaining} days</p>
                </div>
              )}
            </div>

            {warrantyHold.isFrozen && warrantyHold.freezeReason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-800">Frozen</p>
                <p className="text-sm text-orange-700">{warrantyHold.freezeReason}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Started: {formatDate(warrantyHold.startDate)}</p>
              <p>Ends: {formatDate(warrantyHold.effectiveEndDate)}</p>
              {warrantyHold.releasedAt && (
                <p>Released: {formatDate(warrantyHold.releasedAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

