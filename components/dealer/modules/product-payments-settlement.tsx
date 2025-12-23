"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Download, Filter, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { exportPaymentsToCSV } from "@/lib/export-utils";

interface ProductPaymentsSettlementProps {
  onStatsUpdate?: () => void;
}

export function ProductPaymentsSettlement({ onStatsUpdate }: ProductPaymentsSettlementProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingSettlement: 0,
    settled: 0,
    commission: 0,
    netPayable: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dealer/orders?status=DELIVERED");
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        // Calculate summary
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const commissionRate = 0.1; // 10% commission
        const commission = totalRevenue * commissionRate;
        const netPayable = totalRevenue - commission;
        
        setSummary({
          totalRevenue,
          pendingSettlement: totalRevenue, // Assuming all are pending for now
          settled: 0,
          commission,
          netPayable,
        });

        // Transform orders to payment records
        const paymentRecords = orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          amount: order.total,
          commission: order.total * commissionRate,
          netAmount: order.total - (order.total * commissionRate),
          status: "PENDING",
          settlementDate: null,
          orderDate: order.createdAt,
          customer: order.user?.name,
        }));

        setPayments(paymentRecords);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payments & Settlement</h2>
        <p className="text-gray-500 mt-1">Track payments and settlements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₹{summary.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Platform Commission</p>
          <p className="text-2xl font-bold text-orange-600">₹{summary.commission.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Net Payable</p>
          <p className="text-2xl font-bold text-green-600">₹{summary.netPayable.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Settlement</p>
          <p className="text-2xl font-bold text-yellow-600">₹{summary.pendingSettlement.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Settled</p>
          <p className="text-2xl font-bold text-blue-600">₹{summary.settled.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Settlement Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Settlement Information</p>
            <p className="text-sm text-blue-700 mt-1">
              Product payments are settled on T+7 days basis (7 days after order delivery). 
              Service warranty holds apply only to service jobs, not product orders.
            </p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment Ledger</h3>
          <Button variant="outline" size="sm" onClick={() => exportPaymentsToCSV(payments)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Payable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settlement Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No payment records found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{payment.orderNumber}</p>
                      <p className="text-sm text-gray-500">{payment.customer}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.orderDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600">
                      ₹{payment.commission.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ₹{payment.netAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === "SETTLED" 
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.settlementDate 
                        ? new Date(payment.settlementDate).toLocaleDateString("en-IN")
                        : "Pending"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
