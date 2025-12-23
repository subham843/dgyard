"use client";

import { useState, useEffect } from "react";
import {
  Award, AlertTriangle, Shield, TrendingUp, TrendingDown, User,
  DollarSign, Clock, CheckCircle2, XCircle, Ban, Search, Filter,
  RefreshCw, Eye, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Bid {
  id: string;
  jobId: string;
  jobNumber: string;
  technicianId: string;
  technicianName: string;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WINNER";
  isWinner: boolean;
  riskScore?: number;
  suspiciousFlags?: string[];
  createdAt: Date;
  trustScore?: number;
}

interface BiddingJob {
  id: string;
  jobNumber: string;
  dealerName: string;
  serviceType: string;
  budget: number;
  biddingEndsAt: Date;
  totalBids: number;
  minBid?: number;
  maxBid?: number;
  status: "OPEN" | "CLOSED" | "CANCELLED";
}

export function BiddingManagement() {
  const [jobs, setJobs] = useState<BiddingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [fraudDetection, setFraudDetection] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchBids(selectedJob);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bidding/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/bidding/jobs/${jobId}/bids`);
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const handleOverrideWinner = async (jobId: string, bidId: string) => {
    if (!confirm("Override bid winner? This will change the selected bidder.")) return;

    try {
      const response = await fetch(`/api/admin/bidding/jobs/${jobId}/override-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });
      if (response.ok) {
        fetchBids(jobId);
      }
    } catch (error) {
      console.error("Error overriding winner:", error);
    }
  };

  const handleBlacklistTechnician = async (technicianId: string) => {
    if (!confirm("Blacklist this technician from bidding?")) return;

    try {
      const response = await fetch(`/api/admin/bidding/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      if (response.ok) {
        alert("Technician blacklisted successfully");
      }
    } catch (error) {
      console.error("Error blacklisting technician:", error);
    }
  };

  const detectSuspiciousBids = (bid: Bid) => {
    const flags: string[] = [];
    if (bid.amount < 100) flags.push("Very Low Bid");
    if (bid.trustScore && bid.trustScore < 50) flags.push("Low Trust Score");
    if (bid.riskScore && bid.riskScore > 70) flags.push("High Risk");
    return flags;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bidding Management</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor bidding jobs, detect fraud, and manage bid winners</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fraudDetection}
                  onChange={(e) => setFraudDetection(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Fraud Detection</span>
              </label>
              <Button variant="outline" onClick={fetchJobs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Open Bidding Jobs</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedJob === job.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{job.jobNumber}</div>
                    <div className="text-sm text-gray-600 mt-1">{job.serviceType}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{job.totalBids} bids</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        job.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bids List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              {selectedJob ? (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Bids for Selected Job</h2>
                  {bids.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No bids yet</div>
                  ) : (
                    <div className="space-y-4">
                      {bids.map((bid) => {
                        const suspicious = detectSuspiciousBids(bid);
                        const isSuspicious = fraudDetection && suspicious.length > 0;
                        
                        return (
                          <div
                            key={bid.id}
                            className={`p-4 rounded-lg border-2 ${
                              bid.isWinner
                                ? "border-green-500 bg-green-50"
                                : isSuspicious
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-semibold text-gray-900">{bid.technicianName}</div>
                                  {bid.isWinner && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                      Winner
                                    </span>
                                  )}
                                  {isSuspicious && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Suspicious
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="font-semibold text-gray-900">₹{bid.amount.toLocaleString()}</span>
                                  {bid.trustScore !== undefined && (
                                    <span>Trust: {bid.trustScore}</span>
                                  )}
                                  {bid.riskScore !== undefined && (
                                    <span>Risk: {bid.riskScore}%</span>
                                  )}
                                </div>
                                {isSuspicious && (
                                  <div className="mt-2 text-xs text-red-700">
                                    <strong>Flags:</strong> {suspicious.join(", ")}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!bid.isWinner && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOverrideWinner(selectedJob, bid.id)}
                                    className="text-blue-600 border-blue-300"
                                  >
                                    Set Winner
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlacklistTechnician(bid.technicianId)}
                                  className="text-red-600 border-red-300"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">Select a job to view bids</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

