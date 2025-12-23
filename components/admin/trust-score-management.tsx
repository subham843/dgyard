"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, TrendingDown, RefreshCw, History, 
  User, Search, Filter, X, AlertTriangle, CheckCircle2,
  Shield, BarChart3
} from "lucide-react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrustScoreUser {
  id: string;
  userId: string;
  userType: "DEALER" | "TECHNICIAN";
  trustScore: number;
  trustScoreStatus: string;
  lastTrustScoreUpdate: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  profile: {
    fullName: string;
    businessName?: string;
  };
}

interface TrustScoreHistory {
  id: string;
  userId: string;
  userType: string;
  oldScore: number;
  newScore: number;
  changeAmount: number;
  changeType: string;
  reason: string;
  changedBy: string | null;
  adminName: string | null;
  isManual: boolean;
  createdAt: string;
}

export function TrustScoreManagement() {
  const [users, setUsers] = useState<TrustScoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<TrustScoreUser | null>(null);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [showDecreaseModal, setShowDecreaseModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<TrustScoreHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    userType: "all",
    status: "all",
  });

  const [adjustmentData, setAdjustmentData] = useState({
    amount: "",
    reason: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.userType !== "all") params.append("userType", filters.userType);
      if (filters.status !== "all") params.append("status", filters.status);
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/trust-scores?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (!selectedUser || !adjustmentData.amount || !adjustmentData.reason) {
      toast.error("Please provide amount and reason");
      return;
    }

    const amount = parseFloat(adjustmentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    // Check admin permission (max ±5 for normal admin, unlimited for super admin)
    // This would be checked on the backend, but we can show a warning
    if (amount > 5) {
      if (!confirm("Amount exceeds normal admin limit (±5). Are you a super admin?")) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/trust-scores/${selectedUser.userId}/increase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reason: adjustmentData.reason,
          userType: selectedUser.userType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to increase trust score");
      }

      toast.success(`Trust score increased by ${amount} points`);
      // Close dialog first, then reset state
      setShowIncreaseModal(false);
      // Use setTimeout to ensure dialog closes before state reset
      setTimeout(() => {
        setAdjustmentData({ amount: "", reason: "" });
        setSelectedUser(null);
        fetchUsers();
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to increase trust score");
    }
  };

  const handleDecrease = async () => {
    if (!selectedUser || !adjustmentData.amount || !adjustmentData.reason) {
      toast.error("Please provide amount and reason");
      return;
    }

    const amount = parseFloat(adjustmentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    // Check admin permission
    if (amount > 5) {
      if (!confirm("Amount exceeds normal admin limit (±5). Are you a super admin?")) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/trust-scores/${selectedUser.userId}/decrease`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reason: adjustmentData.reason,
          userType: selectedUser.userType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decrease trust score");
      }

      toast.success(`Trust score decreased by ${amount} points`);
      // Close dialog first, then reset state
      setShowDecreaseModal(false);
      // Use setTimeout to ensure dialog closes before state reset
      setTimeout(() => {
        setAdjustmentData({ amount: "", reason: "" });
        setSelectedUser(null);
        fetchUsers();
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to decrease trust score");
    }
  };

  const handleReset = async () => {
    if (!selectedUser) return;

    if (!confirm("Are you sure you want to reset this trust score to 50? This action requires super admin privileges.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/trust-scores/${selectedUser.userId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: selectedUser.userType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset trust score");
      }

      toast.success("Trust score reset to 50");
      // Close dialog first, then reset state
      setShowResetModal(false);
      // Use setTimeout to ensure dialog closes before state reset
      setTimeout(() => {
        setSelectedUser(null);
        fetchUsers();
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset trust score");
    }
  };

  const handleViewHistory = async (user: TrustScoreUser) => {
    setSelectedUser(user);
    setShowHistoryModal(true);
    setLoadingHistory(true);

    try {
      const response = await fetch(`/api/admin/trust-scores/${user.userId}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRecalculate = async (user: TrustScoreUser) => {
    try {
      const response = await fetch(`/api/admin/trust-scores/${user.userId}/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: user.userType,
        }),
      });

      if (!response.ok) throw new Error("Failed to recalculate");

      const data = await response.json();
      toast.success(`Trust score recalculated: ${data.newScore.toFixed(1)}`);
      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to recalculate trust score");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      GOOD: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
      NORMAL: { bg: "bg-blue-100", text: "text-blue-700", icon: Shield },
      RISK: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle },
      CRITICAL: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
    };

    const badge = badges[status] || badges.NORMAL;
    const Icon = badge.icon;

    return (
      <span className={`px-2 py-1 text-xs ${badge.bg} ${badge.text} rounded-full flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trust Score Management</h1>
          <p className="text-gray-600 mt-1">
            Manage trust scores for dealers and technicians
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>User Type</Label>
            <Select
              value={filters.userType}
              onValueChange={(value) => setFilters({ ...filters, userType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEALER">Dealer</SelectItem>
                <SelectItem value="TECHNICIAN">Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="GOOD">Good (80+)</SelectItem>
                <SelectItem value="NORMAL">Normal (60-79)</SelectItem>
                <SelectItem value="RISK">Risk (40-59)</SelectItem>
                <SelectItem value="CRITICAL">Critical (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-sm">
                            {user.profile.fullName || user.user.name}
                          </div>
                          <div className="text-xs text-gray-500">{user.user.email}</div>
                          {user.profile.businessName && (
                            <div className="text-xs text-gray-400">{user.profile.businessName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-2xl font-bold ${getScoreColor(user.trustScore)}`}>
                        {user.trustScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">/ 100</div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(user.trustScoreStatus)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastTrustScoreUpdate
                        ? new Date(user.lastTrustScoreUpdate).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowIncreaseModal(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDecreaseModal(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHistory(user)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecalculate(user)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Increase Modal */}
      {selectedUser && (
        <Dialog 
          open={showIncreaseModal} 
          onOpenChange={(open) => {
            if (!open) {
              setShowIncreaseModal(false);
              setSelectedUser(null);
              setAdjustmentData({ amount: "", reason: "" });
            }
          }}
        >
            <DialogContent>
          <DialogHeader>
            <DialogTitle>Increase Trust Score</DialogTitle>
            <DialogDescription>
              Normal Admin: Max ±5 points. Super Admin: Unlimited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <p className="text-sm font-medium">
                {selectedUser?.profile.fullName || selectedUser?.user.name} ({selectedUser?.userType})
              </p>
              <p className="text-xs text-gray-500">Current Score: {selectedUser?.trustScore.toFixed(1)}</p>
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={adjustmentData.amount}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                placeholder="Enter amount to increase"
              />
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                placeholder="Explain why you're increasing the trust score..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowIncreaseModal(false);
              setTimeout(() => {
                setAdjustmentData({ amount: "", reason: "" });
                setSelectedUser(null);
              }, 100);
            }}>Cancel</Button>
            <Button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleIncrease();
            }}>Increase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Decrease Modal */}
      {selectedUser && (
        <Dialog 
          open={showDecreaseModal} 
          onOpenChange={(open) => {
            if (!open) {
              setShowDecreaseModal(false);
              setSelectedUser(null);
              setAdjustmentData({ amount: "", reason: "" });
            }
          }}
        >
            <DialogContent>
          <DialogHeader>
            <DialogTitle>Decrease Trust Score</DialogTitle>
            <DialogDescription>
              Normal Admin: Max ±5 points. Super Admin: Unlimited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <p className="text-sm font-medium">
                {selectedUser?.profile.fullName || selectedUser?.user.name} ({selectedUser?.userType})
              </p>
              <p className="text-xs text-gray-500">Current Score: {selectedUser?.trustScore.toFixed(1)}</p>
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={adjustmentData.amount}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                placeholder="Enter amount to decrease"
              />
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                placeholder="Explain why you're decreasing the trust score..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDecreaseModal(false);
              setTimeout(() => {
                setAdjustmentData({ amount: "", reason: "" });
                setSelectedUser(null);
              }, 100);
            }}>Cancel</Button>
            <Button variant="destructive" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDecrease();
            }}>Decrease</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Reset Modal */}
      {selectedUser && (
        <Dialog 
          open={showResetModal} 
          onOpenChange={(open) => {
            if (!open) {
              setShowResetModal(false);
              setSelectedUser(null);
            }
          }}
        >
            <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Trust Score</DialogTitle>
            <DialogDescription>
              This will reset the trust score to 50 (neutral). This action requires super admin privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <p className="text-sm font-medium">
                {selectedUser?.profile.fullName || selectedUser?.user.name} ({selectedUser?.userType})
              </p>
              <p className="text-xs text-gray-500">Current Score: {selectedUser?.trustScore.toFixed(1)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResetModal(false);
              setTimeout(() => {
                setSelectedUser(null);
              }, 100);
            }}>Cancel</Button>
            <Button variant="destructive" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReset();
            }}>Reset to 50</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* History Modal */}
      {selectedUser && (
        <Dialog 
          open={showHistoryModal} 
          onOpenChange={(open) => {
            if (!open) {
              setShowHistoryModal(false);
              setSelectedUser(null);
              setHistory([]);
            }
          }}
        >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trust Score History</DialogTitle>
            <DialogDescription>
              Complete history of trust score changes for {selectedUser?.profile.fullName || selectedUser?.user.name}
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No history found</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        entry.changeAmount > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {entry.changeAmount > 0 ? "+" : ""}{entry.changeAmount.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.oldScore.toFixed(1)} → {entry.newScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {entry.changeType.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Reason:</span> {entry.reason}
                  </div>
                  {entry.isManual && entry.adminName && (
                    <div className="text-xs text-gray-500">
                      Changed by: {entry.adminName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


