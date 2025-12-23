"use client";

import { useState, useEffect } from "react";
import { DollarSign, Clock, CheckCircle2, AlertCircle, Loader2, Check, Filter, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export function DealerPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    releasedPayments: 0,
    warrantyHolds: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/dealer/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setSummary(data.summary || summary);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to approve and release this payment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/dealer/payments/${paymentId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment approved and released successfully!");
        fetchPayments();
      } else {
        toast.error(data.error || "Failed to approve payment");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesFilter = filter === "all" || payment.status === filter;
    const matchesSearch = 
      payment.job?.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.paymentType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Earnings"
          value={`₹${summary.totalEarnings.toLocaleString("en-IN")}`}
          icon={DollarSign}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          highlight
        />
        <SummaryCard
          title="Pending Payments"
          value={`₹${summary.pendingPayments.toLocaleString("en-IN")}`}
          icon={Clock}
          gradient="from-yellow-500 to-yellow-600"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          urgent={summary.pendingPayments > 0}
        />
        <SummaryCard
          title="Released Payments"
          value={`₹${summary.releasedPayments.toLocaleString("en-IN")}`}
          icon={CheckCircle2}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Warranty Holds"
          value={`₹${summary.warrantyHolds.toLocaleString("en-IN")}`}
          icon={AlertCircle}
          gradient="from-orange-500 to-orange-600"
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by job number or payment type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "PENDING" ? "default" : "outline"}
              onClick={() => setFilter("PENDING")}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filter === "RELEASED" ? "default" : "outline"}
              onClick={() => setFilter("RELEASED")}
              size="sm"
            >
              Released
            </Button>
            <Button
              variant={filter === "ESCROW_HOLD" ? "default" : "outline"}
              onClick={() => setFilter("ESCROW_HOLD")}
              size="sm"
            >
              Escrow
            </Button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No payments found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery || filter !== "all" 
                ? "Try adjusting your filters" 
                : "Payments will appear here once transactions are made"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Job</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Commission</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">Net Amount</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {payment.job?.jobNumber || "N/A"}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {payment.paymentType.replace("_", " ")}
                    </td>
                    <td className="p-4 text-sm text-right font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-sm text-right text-gray-600">
                      {payment.commissionAmount 
                        ? `₹${payment.commissionAmount.toLocaleString("en-IN")}` 
                        : "N/A"}
                    </td>
                    <td className="p-4 text-sm text-right font-bold text-emerald-600">
                      {payment.netAmount 
                        ? `₹${payment.netAmount.toLocaleString("en-IN")}` 
                        : "N/A"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === "RELEASED" 
                          ? "bg-green-100 text-green-800" 
                          : payment.status === "PENDING" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : payment.status === "ESCROW_HOLD" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {payment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-4 text-center">
                      {(payment.status === "PENDING" || payment.status === "ESCROW_HOLD") && (
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayment(payment.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {payment.status === "RELEASED" && (
                        <span className="text-xs text-gray-500 font-medium">Released</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  iconBg, 
  iconColor, 
  highlight, 
  urgent 
}: any) {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200 p-6 
      hover:shadow-md transition-all duration-300
      ${highlight ? 'ring-2 ring-emerald-200' : ''}
      ${urgent ? 'ring-2 ring-yellow-200' : ''}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} ${iconColor} p-3 rounded-xl shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        {urgent && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            Action Required
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}



