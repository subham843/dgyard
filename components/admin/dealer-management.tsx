"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User
} from "lucide-react";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DealerManagement() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "correction" | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [freeTrialServices, setFreeTrialServices] = useState<string>("");

  useEffect(() => {
    fetchDealers();
  }, [statusFilter]);

  const fetchDealers = async () => {
    try {
      const response = await fetch(`/api/admin/dealers?status=${statusFilter}`);
      const data = await response.json();
      setDealers(data.dealers || []);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      toast.error("Failed to fetch dealers");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (dealer: any, type: "approve" | "reject" | "correction") => {
    setSelectedDealer(dealer);
    setActionType(type);
    setCorrectionNote("");
    setFreeTrialServices("");
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedDealer || !actionType) return;

    try {
      const response = await fetch(`/api/admin/dealers/${selectedDealer.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          note: correctionNote,
          freeTrialServices: actionType === "approve" && freeTrialServices ? parseInt(freeTrialServices) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Action completed successfully");
        setShowModal(false);
        setSelectedDealer(null);
        setActionType(null);
        setCorrectionNote("");
        fetchDealers();
      } else {
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      SUSPENDED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredDealers = dealers.filter((dealer) =>
    dealer.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    dealer.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    dealer.email?.toLowerCase().includes(search.toLowerCase()) ||
    dealer.mobile?.includes(search)
  );

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dealer Management</h1>
              <p className="text-sm text-gray-600">Manage dealer registrations and approvals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search dealers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dealers Table */}
        {loading ? (
          <div className="text-center py-12">Loading dealers...</div>
        ) : filteredDealers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No dealers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dealer Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDealers.map((dealer) => (
                    <tr key={dealer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{dealer.fullName}</div>
                            <div className="text-sm text-gray-500">{dealer.businessName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            {dealer.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {dealer.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {dealer.city && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {dealer.city}, {dealer.state || ""}
                            </div>
                          )}
                          {dealer.dealerType && (
                            <div className="text-gray-500">Type: {dealer.dealerType}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(dealer.accountStatus)}`}>
                          {dealer.accountStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(dealer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDealer(dealer);
                              setActionType(null);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {dealer.accountStatus === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(dealer, "approve")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(dealer, "reject")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(dealer, "correction")}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedDealer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {actionType ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {actionType === "approve" && "Approve Dealer"}
                  {actionType === "reject" && "Reject Dealer"}
                  {actionType === "correction" && "Request Correction"}
                </h2>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Dealer Information:</h3>
                  <p><strong>Name:</strong> {selectedDealer.fullName}</p>
                  <p><strong>Business:</strong> {selectedDealer.businessName}</p>
                  <p><strong>Email:</strong> {selectedDealer.email}</p>
                  <p><strong>Mobile:</strong> {selectedDealer.mobile}</p>
                </div>
                {actionType === "approve" && (
                  <div className="mb-4">
                    <Label htmlFor="freeTrialServices">Free Trial Services (Optional)</Label>
                    <Input
                      id="freeTrialServices"
                      type="number"
                      min="0"
                      value={freeTrialServices}
                      onChange={(e) => setFreeTrialServices(e.target.value)}
                      placeholder="e.g., 2, 3, 4"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the number of free trial services to grant to this dealer
                    </p>
                  </div>
                )}
                {actionType === "correction" && (
                  <div className="mb-4">
                    <Label htmlFor="correctionNote">Correction Note *</Label>
                    <textarea
                      id="correctionNote"
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      rows={4}
                      placeholder="Please specify what needs to be corrected..."
                      required
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmAction}
                    disabled={actionType === "correction" && !correctionNote.trim()}
                    className={
                      actionType === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : actionType === "reject"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  >
                    Confirm
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Dealer Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Full Name:</strong> {selectedDealer.fullName}</p>
                      <p><strong>Business Name:</strong> {selectedDealer.businessName}</p>
                      <p><strong>Dealer Type:</strong> {selectedDealer.dealerType || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Email:</strong> {selectedDealer.email}</p>
                      <p><strong>Mobile:</strong> {selectedDealer.mobile}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Business Address</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p>{selectedDealer.addressLine || "N/A"}</p>
                      <p>{selectedDealer.city}, {selectedDealer.state} - {selectedDealer.pincode}</p>
                      <p>{selectedDealer.district && `District: ${selectedDealer.district}`}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Additional Details</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Years of Experience:</strong> {selectedDealer.yearsOfExperience || "N/A"}</p>
                      <p><strong>Monthly Order Capacity:</strong> {selectedDealer.monthlyOrderCapacityRange || "N/A"}</p>
                      <p><strong>Has In-House Technicians:</strong> {selectedDealer.hasInHouseTechnicians ? "Yes" : "No"}</p>
                      {selectedDealer.preferredBrands && selectedDealer.preferredBrands.length > 0 && (
                        <p><strong>Preferred Brands:</strong> {selectedDealer.preferredBrands.join(", ")}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Operating Areas</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {selectedDealer.latitude && selectedDealer.longitude ? (
                        <div className="space-y-4">
                          <LocationMapPicker
                            initialLocation={{
                              lat: selectedDealer.latitude,
                              lng: selectedDealer.longitude,
                              address: selectedDealer.placeName || "",
                              placeName: selectedDealer.placeName,
                            }}
                            initialRadius={selectedDealer.serviceRadiusKm || 10}
                            height="300px"
                            readOnly={true}
                            onLocationSelect={() => {}}
                            onRadiusChange={() => {}}
                          />
                          {selectedDealer.placeName && (
                            <p className="text-sm text-gray-600">
                              <strong>Location:</strong> {selectedDealer.placeName}
                            </p>
                          )}
                          {selectedDealer.serviceRadiusKm && (
                            <p className="text-sm text-gray-600">
                              <strong>Service Radius:</strong> {selectedDealer.serviceRadiusKm} km
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>No location specified</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}











