"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, DollarSign, TrendingUp, Download, Calendar, FileText,
  RefreshCw, Filter, PieChart, LineChart, ArrowDown, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportData {
  serviceRevenue: number;
  productRevenue: number;
  totalRevenue: number;
  commission: number;
  gst: number;
  payouts: number;
  period: string;
}

export function FinanceReportsPanel() {
  const [reportType, setReportType] = useState<"revenue" | "commission" | "gst" | "payouts">("revenue");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReport();
  }, [reportType, period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("type", reportType);
      params.append("period", period);
      if (period === "custom") {
        params.append("start", dateRange.start);
        params.append("end", dateRange.end);
      }

      const response = await fetch(`/api/admin/finance/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      const params = new URLSearchParams();
      params.append("type", reportType);
      params.append("period", period);
      params.append("format", format);
      if (period === "custom") {
        params.append("start", dateRange.start);
        params.append("end", dateRange.end);
      }

      const response = await fetch(`/api/admin/finance/reports/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `finance-report-${reportType}-${period}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance Reports & Exports</h1>
              <p className="text-sm text-gray-600 mt-1">Generate and export financial reports</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport("csv")}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Revenue Report</option>
              <option value="commission">Commission Report</option>
              <option value="gst">GST Report</option>
              <option value="payouts">Payout Report</option>
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            <Button onClick={fetchReport}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>

        {/* Report Display */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-1">Service Revenue</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₹{(reportData.serviceRevenue / 100000).toFixed(2)}L
                  </div>
                </div>
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium mb-1">Product Revenue</div>
                  <div className="text-2xl font-bold text-green-900">
                    ₹{(reportData.productRevenue / 100000).toFixed(2)}L
                  </div>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-purple-900">
                    ₹{(reportData.totalRevenue / 100000).toFixed(2)}L
                  </div>
                </div>
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium mb-1">Commission</div>
                  <div className="text-2xl font-bold text-orange-900">
                    ₹{(reportData.commission / 100000).toFixed(2)}L
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-4">Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Revenue:</span>
                      <span className="font-semibold">₹{reportData.serviceRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Revenue:</span>
                      <span className="font-semibold">₹{reportData.productRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Total Revenue:</span>
                      <span className="font-bold text-gray-900">₹{reportData.totalRevenue.toLocaleString()}</span>
                    </div>
                    {reportData.commission > 0 && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-semibold">₹{reportData.commission.toLocaleString()}</span>
                      </div>
                    )}
                    {reportData.gst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST:</span>
                        <span className="font-semibold">₹{reportData.gst.toLocaleString()}</span>
                      </div>
                    )}
                    {reportData.payouts > 0 && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold text-gray-900">Payouts:</span>
                        <span className="font-bold text-gray-900">₹{reportData.payouts.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-4">Period: {reportData.period}</h3>
                  <div className="text-sm text-gray-600">
                    Report generated on {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select filters and generate report
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

