"use client";

import { useState } from "react";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

interface WithdrawalRequestDialogProps {
  jobId: string;
  availableBalance: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function WithdrawalRequestDialog({
  jobId,
  availableBalance,
  onSuccess,
  trigger,
}: WithdrawalRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bankAccountNumber: "",
    bankIFSC: "",
    bankName: "",
    accountHolderName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseFloat(formData.amount) > availableBalance) {
      toast.error("Amount cannot exceed available balance");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          amount: parseFloat(formData.amount),
          bankAccountNumber: formData.bankAccountNumber,
          bankIFSC: formData.bankIFSC,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create withdrawal request");
      }

      toast.success("Withdrawal request created successfully");
      setOpen(false);
      setFormData({
        amount: "",
        bankAccountNumber: "",
        bankIFSC: "",
        bankName: "",
        accountHolderName: "",
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create withdrawal request");
      console.error("Error creating withdrawal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Wallet className="h-4 w-4 mr-2" />
            Request Withdrawal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold">{formatPrice(availableBalance)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={availableBalance}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder={`Max: ${formatPrice(availableBalance)}`}
              />
            </div>

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                required
                placeholder="e.g., State Bank of India"
              />
            </div>

            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                required
                placeholder="Account holder name as per bank records"
              />
            </div>

            <div>
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                required
                placeholder="Bank account number"
              />
            </div>

            <div>
              <Label htmlFor="bankIFSC">IFSC Code</Label>
              <Input
                id="bankIFSC"
                value={formData.bankIFSC}
                onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value.toUpperCase() })}
                required
                placeholder="e.g., SBIN0001234"
                maxLength={11}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





