"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, AlertTriangle, XCircle, Loader2, Search } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface WarrantyHold {
  id: string;
  holdAmount: number;
  warrantyDays: number;
  startDate: string;
  endDate: string;
  effectiveEndDate: string;
  status: "LOCKED" | "FROZEN" | "RELEASED" | "FORFEITED";
  isFrozen: boolean;
  freezeReason?: string;
  job: {
    id: string;
    jobNumber: string;
    title: string;
  };
}

export function WarrantyManagement() {
  const [holds, setHolds] = useState<WarrantyHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHold, setSelectedHold] = useState<WarrantyHold | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<"release" | "forfeit" | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWarrantyHolds();
  }, []);

  const fetchWarrantyHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/warranty-holds");
      if (!response.ok) {
        throw new Error("Failed to fetch warranty holds");
      }
      const data = await response.json();
      setHolds(data.warrantyHolds || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch warranty holds");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedHold || !action) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/warranty-holds/${selectedHold.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason: reason || "Admin action",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process action");
      }

      toast.success(`Warranty hold ${action === "release" ? "released" : "forfeited"} successfully`);
      setActionDialogOpen(false);
      setSelectedHold(null);
      setReason("");
      setAction(null);
      fetchWarrantyHolds();
    } catch (error: any) {
      toast.error(error.message || "Failed to process action");
    } finally {
      setProcessing(false);
    }
  };

  const filteredHolds = holds.filter(
    (hold) =>
      hold.job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hold.job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warranty Hold Management</CardTitle>
        <CardDescription>Manage warranty holds - release, freeze, or forfeit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredHolds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No warranty holds found</p>
            </div>
          ) : (
            filteredHolds.map((hold) => (
              <div key={hold.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{hold.job.jobNumber}</h4>
                      <Badge
                        variant={
                          hold.status === "LOCKED"
                            ? "default"
                            : hold.status === "FROZEN"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {hold.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{hold.job.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatPrice(hold.holdAmount)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Warranty Period:</span>
                    <div className="font-medium">{hold.warrantyDays} days</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <div className="font-medium">{formatDate(hold.effectiveEndDate)}</div>
                  </div>
                  {hold.freezeReason && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Freeze Reason:</span>
                      <div className="font-medium text-orange-600">{hold.freezeReason}</div>
                    </div>
                  )}
                </div>

                {(hold.status === "LOCKED" || hold.status === "FROZEN") && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedHold(hold);
                        setAction("release");
                        setActionDialogOpen(true);
                      }}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Release
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedHold(hold);
                        setAction("forfeit");
                        setActionDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Forfeit
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "release" ? "Release Warranty Hold" : "Forfeit Warranty Hold"}
              </DialogTitle>
              <DialogDescription>
                {selectedHold && (
                  <>
                    Job: {selectedHold.job.jobNumber} • Amount: {formatPrice(selectedHold.holdAmount)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing}
                variant={action === "forfeit" ? "destructive" : "default"}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : action === "release" ? (
                  "Release"
                ) : (
                  "Forfeit"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}





