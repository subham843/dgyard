"use client";

import { useState, useEffect } from "react";
import { Lock, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WarrantyHold {
  id: string;
  holdAmount: number;
  holdPercentage: number;
  warrantyDays: number;
  startDate: string;
  endDate: string;
  effectiveEndDate: string;
  status: "LOCKED" | "FROZEN" | "RELEASED" | "FORFEITED";
  isFrozen: boolean;
  frozenAt?: string;
  freezeReason?: string;
  releasedAt?: string;
  releaseReason?: string;
  job: {
    id: string;
    jobNumber: string;
    title: string;
    status: string;
    completedAt?: string;
  };
}

interface WarrantyHoldsListProps {
  showOnlyActive?: boolean;
}

export function WarrantyHoldsList({ showOnlyActive = false }: WarrantyHoldsListProps) {
  const [holds, setHolds] = useState<WarrantyHold[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWarrantyHolds();
  }, []);

  const fetchWarrantyHolds = async () => {
    try {
      setLoading(true);
      const url = showOnlyActive
        ? "/api/technician/warranty-holds?status=LOCKED&status=FROZEN"
        : "/api/technician/warranty-holds";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch warranty holds");
      }
      const data = await response.json();
      setHolds(data.warrantyHolds || []);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching warranty holds:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isFrozen: boolean) => {
    if (isFrozen || status === "FROZEN") {
      return <Badge variant="destructive">Frozen</Badge>;
    }
    switch (status) {
      case "LOCKED":
        return <Badge variant="default">Locked</Badge>;
      case "RELEASED":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Released</Badge>;
      case "FORFEITED":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Forfeited</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warranty Holds</CardTitle>
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
          <CardTitle>Warranty Holds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayHolds = showOnlyActive
    ? holds.filter((h) => h.status === "LOCKED" || h.status === "FROZEN")
    : holds;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warranty Holds</CardTitle>
        <CardDescription>
          {summary && (
            <>
              {summary.locked} locked, {summary.frozen} frozen, {summary.released} released
              {summary.totalHoldAmount > 0 && (
                <> • Total locked: {formatPrice(summary.totalHoldAmount)}</>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayHolds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No warranty holds found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayHolds.map((hold) => {
              const daysRemaining = getDaysRemaining(hold.effectiveEndDate);
              return (
                <div
                  key={hold.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{hold.job.jobNumber}</h4>
                        {getStatusBadge(hold.status, hold.isFrozen)}
                      </div>
                      <p className="text-sm text-muted-foreground">{hold.job.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatPrice(hold.holdAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {hold.holdPercentage}% hold
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Warranty Period:</span>
                      <div className="font-medium">{hold.warrantyDays} days</div>
                    </div>
                    {hold.status === "LOCKED" && (
                      <div>
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {daysRemaining} days
                        </div>
                      </div>
                    )}
                    {hold.status === "FROZEN" && hold.freezeReason && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Frozen Reason:</span>
                        <div className="font-medium text-orange-600">{hold.freezeReason}</div>
                      </div>
                    )}
                    {hold.releasedAt && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Released:</span>
                        <div className="font-medium">
                          {formatDate(hold.releasedAt)}
                          {hold.releaseReason && (
                            <span className="text-muted-foreground ml-2">
                              - {hold.releaseReason}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {hold.startDate && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Started: {formatDate(hold.startDate)} • Ends: {formatDate(hold.effectiveEndDate)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}





