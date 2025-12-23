"use client";

import { useState, useEffect } from "react";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Server, Database, CreditCard, Bell, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "critical";
  message: string;
  responseTime?: number;
}

export function SystemHealthPanel() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/system/health");
      if (response.ok) {
        const data = await response.json();
        setHealthChecks(data.checks || []);
      }
    } catch (error) {
      console.error("Error checking health:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "critical":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "critical":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor system components and services</p>
            </div>
            <Button variant="outline" onClick={checkHealth}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Checking system health...</p>
            </div>
          ) : healthChecks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No health checks available</p>
            </div>
          ) : (
            healthChecks.map((check, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border-2 ${getStatusColor(check.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  {getStatusIcon(check.status)}
                  {check.responseTime && (
                    <span className="text-sm text-gray-600">{check.responseTime}ms</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{check.name}</h3>
                <p className="text-sm text-gray-600">{check.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

