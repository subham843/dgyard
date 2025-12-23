"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, Search, Filter, Download, Eye, CheckCircle2, XCircle,
  DollarSign, Package, Clock, AlertTriangle, TrendingDown, FileText,
  ArrowRight, User, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Refund {
  id: string;
  refundNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  sellerName?: string;
  productName: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED" | "REFUNDED";
  type: "FULL_REFUND" | "PARTIAL_REFUND" | "REPLACEMENT";
  requestDate: Date;
  processedDate?: Date;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function RefundManagementPanel() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
    todayRequests: 0,
  });

  useEffect(() => {
    fetchRefunds();
  }, [selectedStatus, selectedType]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedType !== "all") params.append("type", selectedType);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/refunds?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRefunds(data.refunds || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refundId: string) => {
    if (!confirm("Approve this refund request? This will initiate the refund process.")) return;

    try {
      const response = await fetch(`/api/admin/refunds/${refundId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        fetchRefunds();
      }
    } catch (error) {
      console.error("Error approving refund:", error);
      alert("Failed to approve refund");
    }
  };

  const handleReject = async (refundId: string, reason: string) => {
    const rejectionReason = prompt("Enter rejection reason:", reason);
    if (!rejectionReason) return;

    try {
      const response = await fetch(`/api/admin/refunds/${refundId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (response.ok) {
        fetchRefunds();
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      alert("Failed to reject refund");
    }
  };

  const handleProcessRefund = async (refundId: string) => {
    if (!confirm("Process and execute this refund? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/admin/refunds/${refundId}/process`, {
        method: "POST",
      });
      if (response.ok) {
        fetchRefunds();
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      PROCESSED: "bg-purple-100 text-purple-800 border-purple-200",
      REFUNDED: "bg-green-100 text-green-800 border-green-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      FULL_REFUND: "bg-red-50 text-red-700 border-red-200",
      PARTIAL_REFUND: "bg-orange-50 text-orange-700 border-orange-200",
      REPLACEMENT: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return styles[type as keyof typeof styles] || "bg-gray-50 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage customer refunds, returns, and replacements</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={fetchRefunds}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Approved</div>
              <div className="text-2xl font-bold text-blue-900">{stats.approved}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">Rejected</div>
              <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-green-900">₹{(stats.totalAmount / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Today</div>
              <div className="text-2xl font-bold text-purple-900">{stats.todayRequests}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number, customer name, refund ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PROCESSED">Processed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="FULL_REFUND">Full Refund</option>
              <option value="PARTIAL_REFUND">Partial Refund</option>
              <option value="REPLACEMENT">Replacement</option>
            </select>
          </div>
        </div>

        {/* Refunds Table */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Loading refunds...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No refunds found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Refund</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Request Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{refund.refundNumber}</div>
                        <div className="text-xs text-gray-500 mt-1">{refund.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{refund.orderNumber}</div>
                        <div className="text-xs text-gray-500">{refund.items.length} item(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{refund.customerName}</div>
                        <div className="text-xs text-gray-500">{refund.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{refund.productName}</div>
                        {refund.sellerName && (
                          <div className="text-xs text-gray-500">Seller: {refund.sellerName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeBadge(refund.type)}`}>
                          {refund.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-red-600">-₹{refund.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{refund.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(refund.status)}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(refund.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {refund.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                onClick={() => handleApprove(refund.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleReject(refund.id, refund.reason)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {refund.status === "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => handleProcessRefund(refund.id)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Process
                            </Button>
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

