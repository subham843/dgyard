"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ShoppingCart, 
  Calendar, 
  Phone, 
  Edit, 
  Trash2, 
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle
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
  createdAt: string;
  updatedAt: string;
}

export function UserQuotations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchQuotations();
  }, [session]);

  const fetchQuotations = async () => {
    try {
      const response = await fetch("/api/quotations");
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

  const handlePurchase = (quotation: Quotation) => {
    // Navigate to checkout with quotation data
    router.push(`/checkout?quotationId=${quotation.id}`);
  };

  const handleBookInstallation = (quotation: Quotation) => {
    router.push(`/services/book?quotationId=${quotation.id}`);
  };

  const handleCallSeller = () => {
    // Get phone number from settings or use default
    window.location.href = "tel:+919876543210";
  };

  const handleEdit = (quotation: Quotation) => {
    // Navigate to quotation page with pre-filled data
    const params = new URLSearchParams();
    if (quotation.brandName) params.append("brandId", quotation.id);
    router.push(`/quotation?${params.toString()}&edit=${quotation.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SAVED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Saved
          </span>
        );
      case "PURCHASED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Purchased
          </span>
        );
      case "BOOKED_INSTALLATION":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Installation Booked
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "HOME_CALCULATOR":
        return "Home Calculator";
      case "GET_QUOTATION_PAGE":
        return "Get Quotation Page";
      case "DIRECT_PURCHASE":
        return "Direct Purchase";
      case "BOOK_INSTALLATION":
        return "Book Installation";
      default:
        return source;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Quotations</h1>
        <p className="text-light-gray">View and manage your saved quotations</p>
      </div>

      {quotations.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No quotations yet</h3>
          <p className="text-gray-600 mb-6">
            Start by creating a quotation using our calculator or quotation form.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/")}>
              Use Calculator
            </Button>
            <Button variant="outline" onClick={() => router.push("/quotation")}>
              Get Quotation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {quotation.quotationNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getSourceLabel(quotation.source)} • Created{" "}
                        {format(new Date(quotation.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    {getStatusBadge(quotation.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {quotation.brandName && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Brand</p>
                        <p className="font-semibold">{quotation.brandName}</p>
                      </div>
                    )}
                    {quotation.cameraTypeName && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Camera Type</p>
                        <p className="font-semibold">{quotation.cameraTypeName}</p>
                      </div>
                    )}
                    {quotation.resolutionName && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resolution</p>
                        <p className="font-semibold">{quotation.resolutionName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Price</p>
                      <p className="font-semibold text-lg text-primary-blue">
                        {formatPrice(quotation.totalPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {quotation.indoorCameraCount > 0 && (
                      <span>Indoor: {quotation.indoorCameraCount}</span>
                    )}
                    {quotation.outdoorCameraCount > 0 && (
                      <span>Outdoor: {quotation.outdoorCameraCount}</span>
                    )}
                    {quotation.wiringMeters > 0 && (
                      <span>Wiring: {quotation.wiringMeters}m</span>
                    )}
                    {quotation.hddName && <span>HDD: {quotation.hddName}</span>}
                    {quotation.recordingDays > 0 && (
                      <span>Recording: {quotation.recordingDays} days</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:min-w-[200px]">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(quotation)}
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Purchase
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBookInstallation(quotation)}
                      className="flex-1"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Installation
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCallSeller}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Seller
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(quotation)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(quotation.id)}
                    disabled={deletingId === quotation.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === quotation.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

