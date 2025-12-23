"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Lock,
  Unlock,
  FileText,
  Calendar,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  reference: string;
  createdAt: string;
  status: string;
  remarks?: string;
}

interface WalletData {
  availableBalance: number;
  lockedBalance: number;
  totalCredits: number;
  totalDebits: number;
  ledgerEntries: LedgerEntry[];
}

export function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData>({
    availableBalance: 0,
    lockedBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    ledgerEntries: [],
  });
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchQuery, typeFilter, wallet.ledgerEntries]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/technician/wallet");
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
        setFilteredEntries(data.ledgerEntries || []);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = wallet.ledgerEntries;

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((entry) => entry.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.description.toLowerCase().includes(query) ||
          entry.reference.toLowerCase().includes(query) ||
          entry.remarks?.toLowerCase().includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet & Ledger</h1>
        <p className="text-gray-600">View your transaction history (Read-only)</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Available Balance</CardTitle>
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{wallet.availableBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600 mt-1">Withdrawable amount</p>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Locked Balance</CardTitle>
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{wallet.lockedBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600 mt-1">Warranty holds</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Net Balance</CardTitle>
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{(wallet.availableBalance + wallet.lockedBalance).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-sm">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{wallet.totalCredits.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-sm">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{wallet.totalDebits.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("CREDIT")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === "CREDIT"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setTypeFilter("DEBIT")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === "DEBIT"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Debits
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
          <CardDescription>All credit and debit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 border rounded-lg ${
                    entry.type === "CREDIT"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {entry.type === "CREDIT" ? (
                        <ArrowDownCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{entry.description}</div>
                        <div className="text-sm text-gray-600 mt-1">{entry.reference}</div>
                        {entry.remarks && (
                          <div className="text-sm text-gray-500 mt-1 italic">
                            {entry.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          entry.type === "CREDIT" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.type === "CREDIT" ? "+" : "-"}₹
                        {entry.amount.toLocaleString("en-IN")}
                      </div>
                      <Badge className="mt-1" variant="secondary">
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





