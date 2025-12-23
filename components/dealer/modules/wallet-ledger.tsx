"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function WalletLedger() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    servicePayments: 0,
    productSales: 0,
    warrantyHolds: 0,
    refunds: 0,
    total: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch service payments and product orders to create ledger
      const [paymentsRes, ordersRes] = await Promise.all([
        fetch("/api/dealer/payments"),
        fetch("/api/dealer/orders"),
      ]);

      const payments = paymentsRes.ok ? (await paymentsRes.json()).payments || [] : [];
      const orders = ordersRes.ok ? (await ordersRes.json()).orders || [] : [];

      const servicePayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const productSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const warrantyHolds = 0; // Calculate from warranty holds
      const refunds = 0; // Calculate from refunds

      setSummary({
        servicePayments,
        productSales,
        warrantyHolds,
        refunds,
        total: servicePayments + productSales - warrantyHolds - refunds,
      });

      // Create transaction list
      const txList = [
        ...payments.map((p: any) => ({
          id: p.id,
          type: "SERVICE_PAYMENT",
          description: `Service Payment - ${p.job?.title || "Job"}`,
          amount: p.amount,
          date: p.createdAt,
          status: p.status,
        })),
        ...orders.map((o: any) => ({
          id: o.id,
          type: "PRODUCT_SALE",
          description: `Product Sale - Order ${o.orderNumber}`,
          amount: o.total,
          date: o.createdAt,
          status: o.paymentStatus,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(txList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Read-Only Ledger</p>
            <p className="text-sm text-yellow-700 mt-1">
              This is a read-only view of all transactions. Dealer wallet does not support free balance or manual top-up.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Service Payments</p>
          <p className="text-2xl font-bold text-blue-600">₹{summary.servicePayments.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Product Sales</p>
          <p className="text-2xl font-bold text-green-600">₹{summary.productSales.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Warranty Holds</p>
          <p className="text-2xl font-bold text-orange-600">₹{summary.warrantyHolds.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Refunds</p>
          <p className="text-2xl font-bold text-red-600">₹{summary.refunds.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">₹{summary.total.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Ledger</h3>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(tx.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.type === "SERVICE_PAYMENT" ? "bg-blue-100 text-blue-800" :
                        tx.type === "PRODUCT_SALE" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {tx.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.description}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === "PAID" || tx.status === "RELEASED" ? "bg-green-100 text-green-800" :
                        tx.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {tx.status}
                      </span>
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
