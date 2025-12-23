"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, DollarSign, TrendingUp, TrendingDown, RefreshCw,
  Search, Filter, Eye, Lock, Unlock, User, Building2, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Wallet {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  balance: number;
  holdAmount: number;
  availableBalance: number;
  totalCredits: number;
  totalDebits: number;
  lastTransaction?: Date;
}

export function WalletManagementPanel() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    totalHolds: 0,
    totalAvailable: 0,
  });

  useEffect(() => {
    fetchWallets();
  }, [filterRole]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole !== "all") params.append("role", filterRole);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/wallets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "DEALER":
        return Building2;
      case "TECHNICIAN":
        return Wrench;
      default:
        return User;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
              <p className="text-sm text-gray-600 mt-1">View and manage user wallets and balances</p>
            </div>
            <Button variant="outline" onClick={fetchWallets}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Total Wallets</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalWallets}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Total Balance</div>
              <div className="text-2xl font-bold text-green-900">₹{(stats.totalBalance / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">Total Holds</div>
              <div className="text-2xl font-bold text-orange-900">₹{(stats.totalHolds / 1000).toFixed(1)}K</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Available</div>
              <div className="text-2xl font-bold text-purple-900">₹{(stats.totalAvailable / 1000).toFixed(1)}K</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by user name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="DEALER">Dealers</option>
              <option value="TECHNICIAN">Technicians</option>
              <option value="CUSTOMER">Customers</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Loading wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No wallets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Holds</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Available</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Credits</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Debits</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.map((wallet) => {
                    const RoleIcon = getRoleIcon(wallet.userRole);
                    return (
                      <tr key={wallet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <RoleIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{wallet.userName}</div>
                              <div className="text-sm text-gray-500">{wallet.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">₹{wallet.balance.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-orange-600">₹{wallet.holdAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">₹{wallet.availableBalance.toLocaleString()}</td>
                        <td className="px-6 py-4 text-green-600">+₹{wallet.totalCredits.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-600">-₹{wallet.totalDebits.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

