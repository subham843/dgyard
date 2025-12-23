"use client";

import { useState, useEffect } from "react";
import {
  Calculator, Settings, TrendingUp, Package, Database, DollarSign,
  RefreshCw, Save, Eye, Edit, Plus, X, AlertCircle, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PriceCalculatorAdmin() {
  const [loading, setLoading] = useState(true);
  const [calculatorStats, setCalculatorStats] = useState({
    totalCalculations: 0,
    todayCalculations: 0,
    avgQuotationValue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/calculator/stats");
      if (response.ok) {
        const data = await response.json();
        setCalculatorStats(data);
      }
    } catch (error) {
      console.error("Error fetching calculator stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-600" />
                Price Calculator Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage CCTV price calculator settings and monitor usage</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Eye className="w-4 h-4 mr-2" />
                Preview Calculator
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Total Calculations</div>
              <div className="text-2xl font-bold text-blue-900">{calculatorStats.totalCalculations}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Today's Calculations</div>
              <div className="text-2xl font-bold text-green-900">{calculatorStats.todayCalculations}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Avg Quotation Value</div>
              <div className="text-2xl font-bold text-purple-900">₹{calculatorStats.avgQuotationValue.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">Conversion Rate</div>
              <div className="text-2xl font-bold text-orange-900">{calculatorStats.conversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <Settings className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Calculator Configuration</h2>
              <p className="text-sm text-gray-600">
                The CCTV price calculator is fully functional and integrated. Configuration is managed through Quotation Settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Calculator Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Indoor/Outdoor camera selection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Resolution-based pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  HDD storage calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Wiring & installation costs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Territory-based pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Automatic quotation generation
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open("/calculator", "_blank")}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Calculator Page
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/admin/quotation-settings"}>
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Quotation Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/admin/products"}>
                  <Package className="w-4 h-4 mr-2" />
                  Manage Products & Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Calculator Activity</h2>
          <div className="text-center py-12 text-gray-500">
            Calculator activity logs will be displayed here
          </div>
        </div>
      </div>
    </div>
  );
}

