"use client";

import { useState, useEffect } from "react";
import {
  Shield, CheckCircle2, XCircle, Eye, FileText, User, Building2,
  Wrench, Clock, AlertTriangle, RefreshCw, Search, Filter, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface KYCApplication {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documents: Array<{
    type: string;
    url: string;
    verified: boolean;
  }>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export function KYCVerificationPanel() {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(`/api/admin/kyc?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching KYC applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm("Approve this KYC application?")) return;

    try {
      const response = await fetch(`/api/admin/kyc/${applicationId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("KYC approved successfully");
        fetchApplications();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve KYC");
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      toast.error("Failed to approve KYC");
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/kyc/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        toast.success("KYC rejected");
        fetchApplications();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject KYC");
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      toast.error("Failed to reject KYC");
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

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KYC & Verification</h1>
              <p className="text-sm text-gray-600 mt-1">Review and verify user KYC documents</p>
            </div>
            <Button variant="outline" onClick={fetchApplications}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Approved</div>
              <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">Rejected</div>
              <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
              <p className="text-gray-600">Loading KYC applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No KYC applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Documents</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Submitted</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => {
                    const RoleIcon = getRoleIcon(app.userRole);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <RoleIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{app.userName}</div>
                              <div className="text-sm text-gray-500">{app.userEmail}</div>
                              <div className="text-xs text-gray-400">{app.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{app.documents.length} document(s)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Documents"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {app.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => handleApprove(app.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleReject(app.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Document Viewer Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">KYC Documents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedApplication.userName} ({selectedApplication.userRole})
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedApplication(null)}>
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedApplication.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{doc.type}</span>
                        {doc.verified ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <img 
                        src={doc.url} 
                        alt={doc.type}
                        className="w-full h-64 object-contain bg-gray-50 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML += '<div class="text-center text-gray-500 p-4">Failed to load image</div>';
                          }
                        }}
                      />
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {selectedApplication.rejectionReason && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{selectedApplication.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                Close
              </Button>
              {selectedApplication.status === "PENDING" && (
                <>
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      handleReject(selectedApplication.id);
                      setSelectedApplication(null);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

