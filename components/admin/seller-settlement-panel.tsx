"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Building2, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, Search, Filter, Download, Calendar, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Settlement {
  id: string;
  sellerId: string;
  sellerName: string;
  period: string;
  totalSales: number;
  commission: number;
  deductions: number;
  settlementAmount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "ON_HOLD";
  settlementDate: Date;
  paidDate?: Date;
  cycle: string;
}

export function SellerSettlementPanel() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stats, setStats] = useState({
    pending: 0,
    totalPending: 0,
    thisMonth: 0,
    totalPaid: 0,
  });

  useEffect(() => {
    fetchSettlements();
  }, [selectedStatus]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(`/api/admin/settlement?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSettlements(data.settlements || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (settlementId: string) => {
    if (!confirm("Approve this settlement?")) return;

    try {
      const response = await fetch(`/api/admin/settlement/${settlementId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        fetchSettlements();
      }
    } catch (error) {
      console.error("Error approving settlement:", error);
    }
  };

  const handleHold = async (settlementId: string) => {
    const reason = prompt("Enter reason for hold:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/settlement/${settlementId}/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        fetchSettlements();
      }
    } catch (error) {
      console.error("Error holding settlement:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
      PAID: "bg-green-100 text-green-800 border-green-200",
      ON_HOLD: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Settlement</h1>
              <p className="text-sm text-gray-600 mt-1">Manage seller settlements and payouts (T+X cycle)</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={fetchSettlements}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <div className="text-xs text-yellow-700 mt-1">₹{(stats.totalPending / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">This Month</div>
              <div className="text-2xl font-bold text-blue-900">{stats.thisMonth}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Total Paid</div>
              <div className="text-2xl font-bold text-green-900">₹{(stats.totalPaid / 100000).toFixed(2)}L</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Avg Cycle</div>
              <div className="text-2xl font-bold text-purple-900">T+7</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Loading settlements...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No settlements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Seller</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Period</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Sales</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Commission</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Deductions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Settlement</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Cycle</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{settlement.sellerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{settlement.period}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{settlement.totalSales.toLocaleString()}</td>
                      <td className="px-6 py-4 text-orange-600">-₹{settlement.commission.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-600">-₹{settlement.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-green-600">₹{settlement.settlementAmount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(settlement.status)}`}>
                          {settlement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{settlement.cycle}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {settlement.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300"
                                onClick={() => handleApprove(settlement.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300"
                                onClick={() => handleHold(settlement.id)}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Hold
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
          )}
        </div>
      </div>
    </div>
  );
}

