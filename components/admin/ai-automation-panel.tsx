"use client";

import { useState, useEffect } from "react";
import {
  Zap, Settings, Activity, Shield, TrendingUp, FileText, CheckCircle2,
  XCircle, RefreshCw, Edit, Save, AlertTriangle, BarChart3, Eye,
  ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIRule {
  id: string;
  name: string;
  type: "TRUST_SCORE" | "HOLD_PERCENT" | "AUTO_RELEASE" | "AUTO_FREEZE" | "FRAUD_DETECTION";
  enabled: boolean;
  formula: string;
  conditions: string[];
  action: string;
  lastTriggered?: Date;
  triggerCount: number;
}

interface AILog {
  id: string;
  ruleId: string;
  ruleName: string;
  decision: string;
  confidence: number;
  details: any;
  timestamp: Date;
  overridden: boolean;
}

export function AIAutomationPanel() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"rules" | "logs">("rules");

  useEffect(() => {
    if (selectedTab === "rules") {
      fetchRules();
    } else {
      fetchLogs();
    }
  }, [selectedTab]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai-automation/rules");
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ai-automation/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/ai-automation/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case "TRUST_SCORE":
        return TrendingUp;
      case "FRAUD_DETECTION":
        return Shield;
      case "AUTO_FREEZE":
        return AlertTriangle;
      default:
        return Zap;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI & Automation Control</h1>
              <p className="text-sm text-gray-600 mt-1">Manage AI rules, fraud detection, and automation</p>
            </div>
            <Button variant="outline" onClick={selectedTab === "rules" ? fetchRules : fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedTab("rules")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                selectedTab === "rules"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Zap className="w-4 h-4 inline-block mr-2" />
              AI Rules ({rules.length})
            </button>
            <button
              onClick={() => setSelectedTab("logs")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                selectedTab === "logs"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              AI Logs
            </button>
          </div>

          <div className="p-6">
            {selectedTab === "rules" ? (
              <RulesView
                rules={rules}
                loading={loading}
                onToggleRule={handleToggleRule}
                getRuleTypeIcon={getRuleTypeIcon}
              />
            ) : (
              <LogsView logs={logs} loading={loading} getConfidenceColor={getConfidenceColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesView({
  rules,
  loading,
  onToggleRule,
  getRuleTypeIcon,
}: {
  rules: AIRule[];
  loading: boolean;
  onToggleRule: (id: string, enabled: boolean) => void;
  getRuleTypeIcon: (type: string) => any;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading AI rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => {
        const Icon = getRuleTypeIcon(rule.type);
        return (
          <div
            key={rule.id}
            className={`p-6 rounded-lg border-2 ${
              rule.enabled ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">{rule.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {rule.type.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Formula: {rule.formula}</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Conditions:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {rule.conditions.map((condition, idx) => (
                      <li key={idx}>{condition}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Action:</strong> {rule.action}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>Triggered: {rule.triggerCount} times</span>
                  {rule.lastTriggered && (
                    <span>Last: {new Date(rule.lastTriggered).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleRule(rule.id, rule.enabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    rule.enabled
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {rule.enabled ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LogsView({
  logs,
  loading,
  getConfidenceColor,
}: {
  logs: AILog[];
  loading: boolean;
  getConfidenceColor: (confidence: number) => string;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading AI logs...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rule</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Decision</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Confidence</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{log.ruleName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{log.decision}</td>
              <td className="px-6 py-4">
                <span className={`font-semibold ${getConfidenceColor(log.confidence)}`}>
                  {log.confidence}%
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                {log.overridden ? (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                    Overridden
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                    Applied
                  </span>
                )}
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

