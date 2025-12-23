"use client";

import { useState } from "react";
import { AlertTriangle, Power, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface AccountControlProps {
  dealerInfo: any;
}

export function AccountControl({ dealerInfo }: AccountControlProps) {
  const [reason, setReason] = useState("");
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    toast.info("Account deactivation feature will be available soon");
    setShowDeactivateDialog(false);
  };

  const handleCloseAccount = () => {
    if (confirm("Are you sure you want to permanently close your account? This action cannot be undone.")) {
      toast.info("Account closure feature will be available soon");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Control</h2>
        <p className="text-gray-500 mt-1">Deactivate or close your account</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Important Notice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Account deactivation will temporarily disable your store. You can reactivate it later.
              Account closure is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Temporarily Deactivate Store</h3>
        <p className="text-gray-600 mb-4">
          Deactivate your store temporarily. Your account data will be preserved and you can reactivate anytime.
        </p>
        <Button
          variant="outline"
          onClick={() => setShowDeactivateDialog(true)}
          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
        >
          <Power className="w-4 h-4 mr-2" />
          Deactivate Store
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Close Seller Account</h3>
        <p className="text-red-700 mb-4">
          Permanently close your seller account. This action cannot be undone and all your data will be deleted.
        </p>
        <Button
          variant="outline"
          onClick={handleCloseAccount}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Close Account
        </Button>
      </div>

      {/* Deactivate Dialog */}
      {showDeactivateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Deactivate Store</h3>
            <div className="space-y-4">
              <div>
                <Label>Reason for Deactivation</Label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="temporary">Temporary closure</option>
                  <option value="maintenance">Store maintenance</option>
                  <option value="personal">Personal reasons</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeactivate}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  disabled={!reason}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeactivateDialog(false);
                    setReason("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
