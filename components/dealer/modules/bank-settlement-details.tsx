"use client";

import { useState, useEffect } from "react";
import { Building2, CreditCard, Save, Edit, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface BankSettlementDetailsProps {
  dealerInfo: any;
  onUpdate?: () => void;
}

export function BankSettlementDetails({ dealerInfo, onUpdate }: BankSettlementDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    accountHolderName: (dealerInfo?.bankDetails as any)?.accountHolderName || "",
    accountNumber: (dealerInfo?.bankDetails as any)?.accountNumber || "",
    ifsc: (dealerInfo?.bankDetails as any)?.ifsc || "",
    bankName: (dealerInfo?.bankDetails as any)?.bankName || "",
    branchName: (dealerInfo?.bankDetails as any)?.branchName || "",
    upiId: (dealerInfo?.bankDetails as any)?.upiId || "",
    settlementCycle: (dealerInfo?.bankDetails as any)?.settlementCycle || "7",
  });

  useEffect(() => {
    if (dealerInfo?.bankDetails) {
      const bankDetails = dealerInfo.bankDetails as any;
      setFormData({
        accountHolderName: bankDetails.accountHolderName || "",
        accountNumber: bankDetails.accountNumber || "",
        ifsc: bankDetails.ifsc || "",
        bankName: bankDetails.bankName || "",
        branchName: bankDetails.branchName || "",
        upiId: bankDetails.upiId || "",
        settlementCycle: bankDetails.settlementCycle || "7",
      });
    }
  }, [dealerInfo]);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/dealer/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Bank details saved successfully");
        setEditing(false);
        onUpdate?.();
      } else {
        toast.error("Failed to save bank details");
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bank & Settlement Details</h2>
        <p className="text-gray-500 mt-1">Manage bank account and settlement information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Account Holder Name *</Label>
              <Input
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                disabled={!editing}
                required
              />
            </div>
            <div>
              <Label>Account Number *</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                disabled={!editing}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>IFSC Code *</Label>
              <Input
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                disabled={!editing}
                required
                maxLength={11}
              />
            </div>
            <div>
              <Label>Bank Name *</Label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                disabled={!editing}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Branch Name</Label>
              <Input
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label>UPI ID (Optional)</Label>
              <Input
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                disabled={!editing}
                placeholder="yourname@upi"
              />
            </div>
          </div>

          <div>
            <Label>Settlement Cycle (Days) *</Label>
            <select
              value={formData.settlementCycle}
              onChange={(e) => setFormData({ ...formData, settlementCycle: e.target.value })}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">T+7 days</option>
              <option value="14">T+14 days</option>
              <option value="30">T+30 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Settlement will be processed after the selected number of days from order delivery
            </p>
          </div>

          {editing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => {
                setEditing(false);
                setFormData({
                  accountHolderName: dealerInfo?.bankDetails?.accountHolderName || "",
                  accountNumber: dealerInfo?.bankDetails?.accountNumber || "",
                  ifsc: dealerInfo?.bankDetails?.ifsc || "",
                  bankName: dealerInfo?.bankDetails?.bankName || "",
                  branchName: dealerInfo?.bankDetails?.branchName || "",
                  upiId: dealerInfo?.bankDetails?.upiId || "",
                  settlementCycle: dealerInfo?.bankDetails?.settlementCycle || "7",
                });
              }}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {dealerInfo?.bankDetails && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">
              Bank details are saved. Settlements will be processed to the provided account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
