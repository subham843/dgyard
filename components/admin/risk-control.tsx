"use client";

import { useState, useEffect } from "react";
import { 
  Shield, AlertTriangle, Users, TrendingDown, Ban, 
  CheckCircle2, XCircle, Search, RefreshCw, Eye, Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RiskData {
  id: string;
  type: "TECHNICIAN" | "DEALER" | "JOB" | "PAYMENT";
  name: string;
  email?: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  issues: string[];
  lastUpdated: Date;
}

export function RiskControl() {
  const [risks, setRisks] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/risk-control");
      if (response.ok) {
        const data = await response.json();
        setRisks(data.risks || []);
      }
    } catch (error) {
      console.error("Error fetching risk data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRisks = risks
    .filter((r) => {
      const matchesSearch = 
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || r.type === filterType;
      const matchesLevel = filterLevel === "all" || r.riskLevel === filterLevel;
      return matchesSearch && matchesType && matchesLevel;
    })
    .sort((a, b) => {
      const levelOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return levelOrder[b.riskLevel] - levelOrder[a.riskLevel];
    });

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "bg-red-100 text-red-800 border-red-300",
      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
      LOW: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const stats = {
    total: risks.length,
    critical: risks.filter((r) => r.riskLevel === "CRITICAL").length,
    high: risks.filter((r) => r.riskLevel === "HIGH").length,
    medium: risks.filter((r) => r.riskLevel === "MEDIUM").length,
    low: risks.filter((r) => r.riskLevel === "LOW").length,
    averageRiskScore: risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Control</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and manage platform risks</p>
            </div>
            <Button onClick={fetchRiskData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Risks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Critical</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">High</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{stats.high}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Medium</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.medium}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Low</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.low}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Avg Risk</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.averageRiskScore.toFixed(0)}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search risks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="TECHNICIAN">Technicians</option>
              <option value="DEALER">Dealers</option>
              <option value="JOB">Jobs</option>
              <option value="PAYMENT">Payments</option>
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading risk data...</p>
          </div>
        ) : filteredRisks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No risks found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{risk.name}</div>
                          {risk.email && (
                            <div className="text-sm text-gray-500">{risk.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {risk.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${getRiskScoreColor(risk.riskScore)}`}>
                          {risk.riskScore.toFixed(0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskLevelColor(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {risk.issues.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {risk.issues.slice(0, 2).map((issue, idx) => (
                                <li key={idx} className="text-xs">{issue}</li>
                              ))}
                              {risk.issues.length > 2 && (
                                <li className="text-xs text-gray-500">
                                  +{risk.issues.length - 2} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-gray-400">No issues</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(risk.lastUpdated).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

