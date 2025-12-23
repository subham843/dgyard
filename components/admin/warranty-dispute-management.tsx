"use client";

import { useState, useEffect } from "react";
import {
  Shield, AlertTriangle, MessageSquare, Clock, CheckCircle2, XCircle,
  Lock, Unlock, DollarSign, Eye, RefreshCw, Filter, Search, TrendingUp,
  FileText, User, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Warranty {
  id: string;
  jobId: string;
  jobNumber: string;
  customerName: string;
  technicianName: string;
  serviceType: string;
  warrantyEndsAt: Date;
  daysRemaining: number;
  status: "ACTIVE" | "EXPIRED" | "CLAIMED";
  claimCount: number;
}

interface Dispute {
  id: string;
  jobId: string;
  jobNumber: string;
  customerName: string;
  technicianName: string;
  type: "WARRANTY" | "COMPLAINT" | "PAYMENT";
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
  amount: number;
  description: string;
  evidence: string[];
  createdAt: Date;
  resolution?: string;
}

export function WarrantyDisputeManagement() {
  const [activeTab, setActiveTab] = useState<"warranties" | "disputes">("warranties");
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeWarranties: 0,
    expiringSoon: 0,
    openDisputes: 0,
    totalHoldAmount: 0,
  });

  useEffect(() => {
    if (activeTab === "warranties") {
      fetchWarranties();
    } else {
      fetchDisputes();
    }
  }, [activeTab]);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/warranties");
      if (response.ok) {
        const data = await response.json();
        setWarranties(data.warranties || []);
        setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Error fetching warranties:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/disputes");
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeHold = async (disputeId: string) => {
    if (!confirm("Freeze hold amount for this dispute?")) return;
    // Implement freeze hold
    alert("Freeze hold functionality");
  };

  const handleReleaseHold = async (disputeId: string) => {
    if (!confirm("Release hold amount?")) return;
    // Implement release hold
    alert("Release hold functionality");
  };

  const handleCloseDispute = async (disputeId: string, resolution: string) => {
    const res = prompt("Enter resolution details:", resolution);
    if (!res) return;

    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: res }),
      });
      if (response.ok) {
        fetchDisputes();
      }
    } catch (error) {
      console.error("Error closing dispute:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warranty & Dispute Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage warranties, complaints, and disputes</p>
            </div>
            <Button variant="outline" onClick={activeTab === "warranties" ? fetchWarranties : fetchDisputes}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Active Warranties</div>
              <div className="text-2xl font-bold text-blue-900">{stats.activeWarranties}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Expiring Soon</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.expiringSoon}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600 font-medium">Open Disputes</div>
              <div className="text-2xl font-bold text-red-900">{stats.openDisputes || 0}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">Total Hold Amount</div>
              <div className="text-2xl font-bold text-orange-900">₹{(stats.totalHoldAmount / 1000).toFixed(1)}K</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("warranties")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "warranties"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-2" />
              Warranties ({stats.activeWarranties})
            </button>
            <button
              onClick={() => setActiveTab("disputes")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "disputes"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline-block mr-2" />
              Disputes ({stats.openDisputes})
            </button>
          </div>

          <div className="p-6">
            {activeTab === "warranties" ? (
              <WarrantiesView warranties={warranties} loading={loading} />
            ) : (
              <DisputesView
                disputes={disputes}
                loading={loading}
                onFreezeHold={handleFreezeHold}
                onReleaseHold={handleReleaseHold}
                onCloseDispute={handleCloseDispute}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WarrantiesView({ warranties, loading }: { warranties: Warranty[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading warranties...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Job</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Technician</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Remaining</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {warranties.map((warranty) => (
            <tr key={warranty.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{warranty.jobNumber}</div>
                <div className="text-sm text-gray-500">{warranty.serviceType}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{warranty.customerName}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{warranty.technicianName}</td>
              <td className="px-6 py-4">
                <span className={`font-semibold ${
                  warranty.daysRemaining < 7 ? "text-red-600" : warranty.daysRemaining < 30 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {warranty.daysRemaining} days
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  warranty.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : warranty.status === "EXPIRED"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }`}>
                  {warranty.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisputesView({
  disputes,
  loading,
  onFreezeHold,
  onReleaseHold,
  onCloseDispute,
}: {
  disputes: Dispute[];
  loading: boolean;
  onFreezeHold: (id: string) => void;
  onReleaseHold: (id: string) => void;
  onCloseDispute: (id: string, resolution: string) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading disputes...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Job</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {disputes.map((dispute) => (
            <tr key={dispute.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{dispute.jobNumber}</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {dispute.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{dispute.customerName}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">₹{dispute.amount.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    dispute.status === "OPEN"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : dispute.status === "UNDER_REVIEW"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }`}>
                  {dispute.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(dispute.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {(dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW") && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onFreezeHold(dispute.id)} className="text-red-600">
                        <Lock className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onCloseDispute(dispute.id, dispute.resolution || "")} className="text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

