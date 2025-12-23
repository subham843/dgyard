"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  CreditCard, 
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType: string;
  upiId?: string;
  isVerified: boolean;
}

export function BankDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    accountType: "SAVINGS",
    upiId: "",
    isVerified: false,
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/bank-details");
      if (response.ok) {
        const data = await response.json();
        if (data.bankDetails) {
          setBankDetails(data.bankDetails);
        }
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.bankName || 
        !bankDetails.accountNumber || !bankDetails.ifscCode) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/technician/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankDetails),
      });

      if (response.ok) {
        toast.success("Bank details saved successfully!");
        fetchBankDetails();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save bank details");
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank & Payment Details</h1>
          <p className="text-gray-600">Add your bank account for payouts</p>
        </div>

        {bankDetails.isVerified && (
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">Account Verified</div>
                  <div className="text-sm text-green-700">Your bank account is verified and ready for payouts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
            <CardDescription>
              {!bankDetails.isVerified && "⚠️ Only verified accounts are allowed for payouts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  type="password"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="ABCD0123456"
                    maxLength={11}
                  />
                </div>
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={bankDetails.branch}
                    onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                    placeholder="Branch name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <select
                  id="accountType"
                  value={bankDetails.accountType}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                </select>
              </div>

              <div>
                <Label htmlFor="upiId">UPI ID (Optional)</Label>
                <Input
                  id="upiId"
                  value={bankDetails.upiId}
                  onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Bank Details
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





