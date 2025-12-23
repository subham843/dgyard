"use client";

import { useState, useEffect } from "react";
import { Shield, AlertCircle, CheckCircle2, Clock, Loader2, FileText, Calendar, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export function DealerWarranty() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired" | "issue">("all");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [issueDescription, setIssueDescription] = useState("");

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      const response = await fetch("/api/dealer/warranty");
      if (response.ok) {
        const data = await response.json();
        setWarranties(data.warranties || []);
      }
    } catch (error) {
      console.error("Error fetching warranties:", error);
      toast.error("Failed to fetch warranty information");
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      toast.error("Please describe the warranty issue");
      return;
    }

    try {
      const response = await fetch(`/api/dealer/warranty/${selectedWarranty.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: issueDescription }),
      });

      if (response.ok) {
        toast.success("Warranty issue reported successfully");
        setShowReportDialog(false);
        setIssueDescription("");
        setSelectedWarranty(null);
        fetchWarranties();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to report issue");
      }
    } catch (error) {
      console.error("Error reporting warranty issue:", error);
      toast.error("Something went wrong");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 border-green-200";
      case "EXPIRED": return "bg-gray-100 text-gray-800 border-gray-200";
      case "ISSUE_REPORTED": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REWORK_IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "REWORK_COMPLETED": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredWarranties = warranties.filter((warranty) => {
    const remainingDays = getRemainingDays(warranty.endDate);
    switch (filter) {
      case "active":
        return warranty.status === "ACTIVE";
      case "expiring":
        return warranty.status === "ACTIVE" && remainingDays <= 7 && remainingDays > 0;
      case "expired":
        return warranty.status === "EXPIRED" || remainingDays <= 0;
      case "issue":
        return warranty.status === "ISSUE_REPORTED" || warranty.status === "REWORK_IN_PROGRESS";
      default:
        return true;
    }
  });

  const stats = {
    total: warranties.length,
    active: warranties.filter(w => w.status === "ACTIVE").length,
    expiring: warranties.filter(w => {
      const days = getRemainingDays(w.endDate);
      return w.status === "ACTIVE" && days <= 7 && days > 0;
    }).length,
    issues: warranties.filter(w => w.status === "ISSUE_REPORTED" || w.status === "REWORK_IN_PROGRESS").length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading warranty information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Warranties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 ring-2 ring-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Issues</p>
              <p className="text-2xl font-bold text-red-600">{stats.issues}</p>
            </div>
            <FileText className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filter === "expiring" ? "default" : "outline"}
            onClick={() => setFilter("expiring")}
            size="sm"
          >
            Expiring Soon
          </Button>
          <Button
            variant={filter === "expired" ? "default" : "outline"}
            onClick={() => setFilter("expired")}
            size="sm"
          >
            Expired
          </Button>
          <Button
            variant={filter === "issue" ? "default" : "outline"}
            onClick={() => setFilter("issue")}
            size="sm"
          >
            Issues
          </Button>
        </div>
      </div>

      {/* Warranties List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Warranty Management</h2>
        {filteredWarranties.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No warranty records found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filter !== "all" ? "Try adjusting your filter" : "Warranties will appear here once jobs are completed"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWarranties.map((warranty) => {
              const remainingDays = getRemainingDays(warranty.endDate);
              const isExpiring = remainingDays <= 7 && remainingDays > 0;
              const isExpired = remainingDays <= 0;

              return (
                <div
                  key={warranty.id}
                  className={`
                    border-2 rounded-xl p-6 hover:shadow-md transition-all duration-300
                    ${isExpiring && warranty.status === "ACTIVE" ? "border-yellow-300 bg-yellow-50" : ""}
                    ${isExpired ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"}
                    ${warranty.issueDescription ? "border-red-300 bg-red-50" : ""}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Job: {warranty.job?.jobNumber || "N/A"}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(warranty.status)}`}>
                          {warranty.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{warranty.job?.title || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Warranty Period
                      </p>
                      <p className="font-bold text-gray-900">{warranty.warrantyDays} days</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(warranty.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">End Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(warranty.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${isExpiring ? "bg-yellow-100" : isExpired ? "bg-gray-100" : "bg-green-50"}`}>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Remaining
                      </p>
                      <p className={`font-bold ${isExpiring ? "text-yellow-700" : isExpired ? "text-gray-600" : "text-green-700"}`}>
                        {remainingDays > 0 ? `${remainingDays} days` : "Expired"}
                      </p>
                    </div>
                  </div>

                  {isExpiring && warranty.status === "ACTIVE" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-yellow-800">
                          ⚠️ Warranty expiring in {remainingDays} days
                        </p>
                      </div>
                    </div>
                  )}

                  {warranty.issueDescription && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Issue Reported
                      </p>
                      <p className="text-sm text-red-700 mb-2">{warranty.issueDescription}</p>
                      {warranty.reworkTechnician && (
                        <p className="text-xs text-red-600">
                          Rework assigned to: <span className="font-semibold">{warranty.reworkTechnician.fullName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {warranty.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWarranty(warranty);
                          setShowReportDialog(true);
                        }}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Report Issue
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Issue Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Report Warranty Issue</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">
                  Job: {selectedWarranty?.job?.jobNumber || "N/A"}
                </Label>
                <Label htmlFor="issueDescription" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Issue Description *
                </Label>
                <textarea
                  id="issueDescription"
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Please describe the warranty issue in detail..."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleReportIssue}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Submit Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportDialog(false);
                    setIssueDescription("");
                    setSelectedWarranty(null);
                  }}
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







