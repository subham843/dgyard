"use client";

import { useState, useEffect } from "react";
import { CreditCard, DollarSign, Building2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: "ONLINE" | "CASH" | "BANK_TRANSFER", cashProofUrl?: string) => void;
  amount: number;
  jobNumber: string;
}

export function PaymentMethodDialog({
  isOpen,
  onClose,
  onSelect,
  amount,
  jobNumber,
}: PaymentMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"ONLINE" | "CASH" | "BANK_TRANSFER" | null>(null);
  const [cashProofFile, setCashProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setCashProofFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payment-proofs");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setCashProofFile(file);
      toast.success("File uploaded successfully");
      return data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedMethod === "CASH" && !cashProofFile) {
      toast.error("Please upload cash payment proof");
      return;
    }

    let proofUrl: string | undefined;
    if (selectedMethod === "CASH" && cashProofFile) {
      const url = await handleFileUpload(cashProofFile);
      if (!url) {
        return;
      }
      proofUrl = url;
    }

    onSelect(selectedMethod, proofUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Payment Method</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Payment Amount</p>
            <p className="text-2xl font-bold text-blue-900">
              ₹{amount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-blue-700 mt-1">Job: {jobNumber}</p>
          </div>

          {/* Payment Method Options */}
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod("ONLINE")}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                selectedMethod === "ONLINE"
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === "ONLINE" ? "bg-primary text-white" : "bg-gray-100"
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Online Payment</p>
                  <p className="text-sm text-gray-600">Pay via Razorpay (UPI, Card, Net Banking)</p>
                </div>
                {selectedMethod === "ONLINE" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("CASH")}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                selectedMethod === "CASH"
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === "CASH" ? "bg-primary text-white" : "bg-gray-100"
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Cash Payment</p>
                  <p className="text-sm text-gray-600">Cash payment with proof upload</p>
                </div>
                {selectedMethod === "CASH" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod("BANK_TRANSFER")}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                selectedMethod === "BANK_TRANSFER"
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === "BANK_TRANSFER" ? "bg-primary text-white" : "bg-gray-100"
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-sm text-gray-600">Direct bank transfer (NEFT/RTGS/IMPS)</p>
                </div>
                {selectedMethod === "BANK_TRANSFER" && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Cash Proof Upload */}
          {selectedMethod === "CASH" && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Upload Cash Payment Proof
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                Upload receipt, photo, or screenshot as proof of cash payment
              </p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCashProofFile(file);
                  }
                }}
                className="text-sm"
              />
              {cashProofFile && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ {cashProofFile.name} selected
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedMethod || (selectedMethod === "CASH" && !cashProofFile) || uploading}
              className="flex-1"
              style={{ backgroundColor: '#3A59FF' }}
            >
              {uploading ? "Uploading..." : "Confirm & Proceed"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

