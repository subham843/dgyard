"use client";

import { useState } from "react";
import { 
  UserX, 
  Power,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

export function AccountControlPage() {
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      setProcessing(true);
      const response = await fetch("/api/technician/account/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        toast.success("Account deactivated successfully");
        setShowDeactivateModal(false);
        setReason("");
      } else {
        toast.error("Failed to deactivate account");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    if (!confirm("Are you absolutely sure? This action cannot be undone!")) {
      return;
    }
    try {
      setProcessing(true);
      const response = await fetch("/api/technician/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        toast.success("Account deletion requested");
        setShowDeleteModal(false);
        setReason("");
      } else {
        toast.error("Failed to request deletion");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Control</h1>
          <p className="text-gray-600">Manage your account status</p>
        </div>

        {/* Temporarily Deactivate */}
        <Card className="mb-6 border-2 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5 text-yellow-600" />
              Temporarily Deactivate Account
            </CardTitle>
            <CardDescription>
              Temporarily disable your account. You can reactivate it later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateModal(true)}
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              Deactivate Account
            </Button>
          </CardContent>
        </Card>

        {/* Request Permanent Deletion */}
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Request Permanent Deletion
            </CardTitle>
            <CardDescription>
              Permanently delete your account. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="w-full"
            >
              Request Account Deletion
            </Button>
          </CardContent>
        </Card>

        {/* Deactivate Modal */}
        <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Account</DialogTitle>
              <DialogDescription>
                Your account will be temporarily disabled. You can reactivate it anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deactivateReason">Reason *</Label>
                <Textarea
                  id="deactivateReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you deactivating your account?"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeactivate}
                disabled={processing || !reason.trim()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deactivate"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Account Permanently</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All your data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete your account, all jobs, earnings, and data.
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="deleteReason">Reason *</Label>
                <Textarea
                  id="deleteReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you deleting your account?"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={processing || !reason.trim()}
                variant="destructive"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}





