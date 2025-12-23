"use client";

import { useState, useEffect } from "react";
import { DollarSign, Lock, Wallet, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  lockedWarrantyHoldAmount: number;
  commissionDeducted: number;
  pendingWithdrawalAmount: number;
  netEarnings: number;
}

export function EarningsOverview() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/earnings");
      if (!response.ok) {
        throw new Error("Failed to fetch earnings");
      }
      const data = await response.json();
      setEarnings(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earnings) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Available Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(earnings.availableBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ready for withdrawal
          </p>
        </CardContent>
      </Card>

      {/* Locked Warranty Holds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locked Warranty Holds</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(earnings.lockedWarrantyHoldAmount)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Under warranty protection
          </p>
        </CardContent>
      </Card>

      {/* Total Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(earnings.totalEarnings)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gross earnings (before commission)
          </p>
        </CardContent>
      </Card>

      {/* Commission Deducted */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commission</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatPrice(earnings.commissionDeducted)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Platform commission deducted
          </p>
        </CardContent>
      </Card>

      {/* Net Earnings */}
      {earnings.netEarnings !== undefined && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Net Earnings</CardTitle>
            <CardDescription>
              Total earnings after commission: {formatPrice(earnings.netEarnings)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Available:</span>{" "}
                <span className="font-semibold text-green-600">
                  {formatPrice(earnings.availableBalance)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Locked:</span>{" "}
                <span className="font-semibold text-orange-600">
                  {formatPrice(earnings.lockedWarrantyHoldAmount)}
                </span>
              </div>
              {earnings.pendingWithdrawalAmount > 0 && (
                <div>
                  <span className="text-muted-foreground">Pending Withdrawal:</span>{" "}
                  <span className="font-semibold text-blue-600">
                    {formatPrice(earnings.pendingWithdrawalAmount)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





