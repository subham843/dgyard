"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Loader2,
  Download,
  User,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Quotation {
  id: string;
  quotationNumber: string;
  source: string;
  status: string;
  brandName?: string;
  cameraTypeName?: string;
  resolutionName?: string;
  indoorCameraCount: number;
  outdoorCameraCount: number;
  wiringMeters: number;
  hddName?: string;
  recordingDays: number;
  totalPrice: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
}

export function AdminQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter, sourceFilter]);

  const fetchQuotations = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);

      const response = await fetch(
        `/api/admin/quotations?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuotations(data.quotations || []);
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Quotation deleted successfully");
        fetchQuotations();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast.error("Failed to delete quotation");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      SAVED: { bg: "bg-blue-100", text: "text-blue-800" },
      PURCHASED: { bg: "bg-green-100", text: "text-green-800" },
      BOOKED_INSTALLATION: { bg: "bg-purple-100", text: "text-purple-800" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800" },
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {status}
      </span>
    );
  };

  const getSourceLabel = (source: string) => {
    const sourceLabels: Record<string, string> = {
      HOME_CALCULATOR: "Home Calculator",
      GET_QUOTATION_PAGE: "Get Quotation Page",
      DIRECT_PURCHASE: "Direct Purchase",
      BOOK_INSTALLATION: "Book Installation",
    };
    return sourceLabels[source] || source;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quotations Management</h1>
        <p className="text-light-gray">
          View and manage all quotations from users
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by quotation number, user, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="all">All Status</option>
            <option value="SAVED">Saved</option>
            <option value="PURCHASED">Purchased</option>
            <option value="BOOKED_INSTALLATION">Installation Booked</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="all">All Sources</option>
            <option value="HOME_CALCULATOR">Home Calculator</option>
            <option value="GET_QUOTATION_PAGE">Get Quotation Page</option>
            <option value="DIRECT_PURCHASE">Direct Purchase</option>
            <option value="BOOK_INSTALLATION">Book Installation</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Quotations</div>
          <div className="text-2xl font-bold">{quotations.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Saved</div>
          <div className="text-2xl font-bold text-blue-600">
            {quotations.filter((q) => q.status === "SAVED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Purchased</div>
          <div className="text-2xl font-bold text-green-600">
            {quotations.filter((q) => q.status === "PURCHASED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Installation Booked</div>
          <div className="text-2xl font-bold text-purple-600">
            {quotations.filter((q) => q.status === "BOOKED_INSTALLATION").length}
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No quotations found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || sourceFilter !== "all"
              ? "Try adjusting your filters"
              : "No quotations have been created yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.quotationNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {quotation.userName || quotation.user?.name || "N/A"}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {quotation.userEmail || quotation.user?.email || "N/A"}
                        </div>
                        {quotation.userPhone || quotation.user?.phone ? (
                          <div className="text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {quotation.userPhone || quotation.user?.phone}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {quotation.brandName && (
                          <div>
                            <span className="font-medium">Brand:</span>{" "}
                            {quotation.brandName}
                          </div>
                        )}
                        {quotation.cameraTypeName && (
                          <div>
                            <span className="font-medium">Type:</span>{" "}
                            {quotation.cameraTypeName}
                          </div>
                        )}
                        {quotation.resolutionName && (
                          <div>
                            <span className="font-medium">Resolution:</span>{" "}
                            {quotation.resolutionName}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Indoor: {quotation.indoorCameraCount} | Outdoor:{" "}
                          {quotation.outdoorCameraCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-primary-blue">
                        {formatPrice(quotation.totalPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getSourceLabel(quotation.source)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(quotation.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(quotation.id)}
                        disabled={deletingId === quotation.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === quotation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
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
  );
}

