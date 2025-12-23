"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard, DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle,
  Filter, Search, RefreshCw, Eye, Lock, Unlock, TrendingUp, TrendingDown,
  Download, FileText, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  type: "JOB" | "ORDER" | "WALLET";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "HOLD";
  method: string;
  userId: string;
  userName: string;
  description: string;
  createdAt: Date;
}

interface LedgerEntry {
  id: string;
  userId: string;
  userName: string;
  type: "CREDIT" | "DEBIT" | "HOLD" | "RELEASE";
  amount: number;
  status: "LOCKED" | "RELEASED" | "FORFEITED";
  reason: string;
  createdAt: Date;
}

export function PaymentControlPanel() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"payments" | "ledger">("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalHolds: 0,
    totalCredits: 0,
    totalDebits: 0,
  });

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    } else {
      fetchLedger();
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ledger");
      if (response.ok) {
        const data = await response.json();
        setLedgerEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      FAILED: "bg-red-100 text-red-800 border-red-200",
      HOLD: "bg-orange-100 text-orange-800 border-orange-200",
      LOCKED: "bg-red-100 text-red-800 border-red-200",
      RELEASED: "bg-green-100 text-green-800 border-green-200",
      FORFEITED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CREDIT":
        return TrendingUp;
      case "DEBIT":
        return TrendingDown;
      case "HOLD":
        return Lock;
      case "RELEASE":
        return Unlock;
      default:
        return DollarSign;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment & Ledger Control</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all payments, wallets, and ledger entries</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={activeTab === "payments" ? fetchPayments : fetchLedger}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-blue-900">{stats.pendingPayments}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-2xl font-bold text-green-900">{stats.completedPayments}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">Failed</div>
              <div className="text-2xl font-bold text-red-900">{stats.failedPayments}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">Holds</div>
              <div className="text-2xl font-bold text-orange-900">{stats.totalHolds}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Credits</div>
              <div className="text-2xl font-bold text-purple-900">₹{(stats.totalCredits / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-sm text-indigo-600 font-medium">Debits</div>
              <div className="text-2xl font-bold text-indigo-900">₹{(stats.totalDebits / 1000).toFixed(1)}K</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "payments"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <CreditCard className="w-4 h-4 inline-block mr-2" />
              Payments
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "ledger"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              Ledger Management
            </button>
          </div>

          <div className="p-6">
            {activeTab === "payments" ? (
              <PaymentsView payments={payments} loading={loading} getStatusBadge={getStatusBadge} />
            ) : (
              <LedgerView entries={ledgerEntries} loading={loading} getStatusBadge={getStatusBadge} getTypeIcon={getTypeIcon} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsView({ 
  payments, 
  loading, 
  getStatusBadge 
}: { 
  payments: Payment[]; 
  loading: boolean;
  getStatusBadge: (status: string) => string;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No payments found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-mono text-gray-600">{payment.id.slice(0, 8)}...</td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{payment.userName}</div>
                <div className="text-sm text-gray-500">{payment.description}</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {payment.type}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(payment.status)}`}>
                  {payment.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(payment.createdAt).toLocaleDateString()}
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

function LedgerView({ 
  entries, 
  loading, 
  getStatusBadge, 
  getTypeIcon 
}: { 
  entries: LedgerEntry[]; 
  loading: boolean;
  getStatusBadge: (status: string) => string;
  getTypeIcon: (type: string) => any;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading ledger entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No ledger entries found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Ledger Management (Read-Only + Override)</p>
            <p className="text-sm text-yellow-700 mt-1">
              All actions are logged. Manual adjustments require mandatory reason. No delete option available.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => {
              const Icon = getTypeIcon(entry.type);
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${
                        entry.type === "CREDIT" || entry.type === "RELEASE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{entry.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{entry.userName}</td>
                  <td className={`px-6 py-4 font-semibold ${
                    entry.type === "CREDIT" || entry.type === "RELEASE"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {entry.type === "DEBIT" || entry.type === "HOLD" ? "-" : "+"}
                    ₹{entry.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{entry.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {entry.status === "LOCKED" && (
                        <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                          <Unlock className="w-4 h-4 mr-1" />
                          Release
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

