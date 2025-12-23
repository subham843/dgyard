"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wrench, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  Loader2,
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

export function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "correction" | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");

  useEffect(() => {
    fetchTechnicians();
  }, [statusFilter]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/technicians?status=${statusFilter}`);
      const data = await response.json();
      setTechnicians(data.technicians || []);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error("Failed to fetch technicians");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (technician: any, type: "approve" | "reject" | "correction") => {
    setSelectedTechnician(technician);
    setActionType(type);
    setCorrectionNote("");
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedTechnician || !actionType) return;

    try {
      const response = await fetch(`/api/admin/technicians/${selectedTechnician.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          note: correctionNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Action completed successfully");
        setShowModal(false);
        setSelectedTechnician(null);
        setActionType(null);
        setCorrectionNote("");
        fetchTechnicians();
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

  const filteredTechnicians = technicians.filter((technician) =>
    technician.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    technician.email?.toLowerCase().includes(search.toLowerCase()) ||
    technician.mobile?.includes(search)
  );

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Technician Management</h1>
              <p className="text-sm text-gray-600">Manage technician registrations and approvals</p>
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
                  placeholder="Search technicians..."
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

        {/* Technicians Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-2">Loading technicians...</p>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Wrench className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No technicians found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Professional Details
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
                  {filteredTechnicians.map((technician) => (
                    <tr key={technician.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{technician.fullName}</div>
                            {technician.displayName && (
                              <div className="text-sm text-gray-500">{technician.displayName}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {technician.technicianType?.replace(/_/g, " ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            {technician.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {technician.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {technician.yearsOfExperience && (
                            <div className="text-gray-600">
                              Experience: {technician.yearsOfExperience} years
                            </div>
                          )}
                          {technician.primarySkills && Array.isArray(technician.primarySkills) && technician.primarySkills.length > 0 && (
                            <div className="text-gray-600">
                              Skills: {technician.primarySkills.length} selected
                            </div>
                          )}
                          {technician.placeName && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {technician.placeName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(technician.accountStatus)}`}>
                          {technician.accountStatus?.replace(/_/g, " ") || "PENDING_APPROVAL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(technician.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTechnician(technician);
                              setActionType(null);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {technician.accountStatus === "PENDING_APPROVAL" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(technician, "approve")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(technician, "reject")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(technician, "correction")}
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
      {showModal && selectedTechnician && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {actionType ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {actionType === "approve" && "Approve Technician"}
                  {actionType === "reject" && "Reject Technician"}
                  {actionType === "correction" && "Request Correction"}
                </h2>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Technician Information:</h3>
                  <p><strong>Name:</strong> {selectedTechnician.fullName}</p>
                  <p><strong>Email:</strong> {selectedTechnician.email}</p>
                  <p><strong>Mobile:</strong> {selectedTechnician.mobile}</p>
                  <p><strong>Type:</strong> {selectedTechnician.technicianType?.replace(/_/g, " ")}</p>
                </div>
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
                <h2 className="text-2xl font-bold mb-4">Technician Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Full Name:</strong> {selectedTechnician.fullName}</p>
                      {selectedTechnician.displayName && (
                        <p><strong>Display Name:</strong> {selectedTechnician.displayName}</p>
                      )}
                      <p><strong>Technician Type:</strong> {selectedTechnician.technicianType?.replace(/_/g, " ") || "N/A"}</p>
                      <p><strong>Years of Experience:</strong> {selectedTechnician.yearsOfExperience || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Email:</strong> {selectedTechnician.email}</p>
                      <p><strong>Mobile:</strong> {selectedTechnician.mobile}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Skills & Services</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      {selectedTechnician.primarySkills && Array.isArray(selectedTechnician.primarySkills) && selectedTechnician.primarySkills.length > 0 ? (
                        <div>
                          <strong>Primary Skills:</strong>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedTechnician.primarySkills.map((skill: any, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {typeof skill === "object" ? `${skill.skill} (${skill.level})` : skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>No skills selected</p>
                      )}
                      {selectedTechnician.secondarySkills && selectedTechnician.secondarySkills.length > 0 && (
                        <div className="mt-2">
                          <strong>Secondary Skills:</strong>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedTechnician.secondarySkills.map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedTechnician.serviceCategories && selectedTechnician.serviceCategories.length > 0 && (
                        <div className="mt-2">
                          <strong>Service Categories:</strong>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedTechnician.serviceCategories.map((cat: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Operating Area</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {selectedTechnician.latitude && selectedTechnician.longitude ? (
                        <div className="space-y-4">
                          <LocationMapPicker
                            initialLocation={{
                              lat: selectedTechnician.latitude,
                              lng: selectedTechnician.longitude,
                              address: selectedTechnician.placeName || "",
                              placeName: selectedTechnician.placeName,
                            }}
                            initialRadius={selectedTechnician.serviceRadiusKm || 10}
                            height="300px"
                            readOnly={true}
                            showRadiusControl={false}
                            onLocationSelect={() => {}}
                            onRadiusChange={() => {}}
                          />
                          {selectedTechnician.placeName && (
                            <p className="text-sm text-gray-600">
                              <strong>Location:</strong> {selectedTechnician.placeName}
                            </p>
                          )}
                          {selectedTechnician.serviceRadiusKm && (
                            <p className="text-sm text-gray-600">
                              <strong>Service Radius:</strong> {selectedTechnician.serviceRadiusKm} km
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>No location specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Availability & Preferences</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Working Days:</strong> {selectedTechnician.workingDays?.replace(/_/g, " ") || "N/A"}</p>
                      <p><strong>Daily Availability:</strong> {selectedTechnician.dailyAvailability?.replace(/_/g, " ") || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tools & Transport</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p><strong>Own Tools Available:</strong> {selectedTechnician.ownToolsAvailable ? "Yes" : "No"}</p>
                      <p><strong>Own Vehicle:</strong> {selectedTechnician.ownVehicle?.replace(/_/g, " ") || "None"}</p>
                    </div>
                  </div>
                  {selectedTechnician.previousWorkDescription && (
                    <div>
                      <h3 className="font-semibold mb-2">Experience Proof</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm">{selectedTechnician.previousWorkDescription}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold mb-2">Account Status</h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(selectedTechnician.accountStatus)}`}>
                          {selectedTechnician.accountStatus?.replace(/_/g, " ") || "PENDING_APPROVAL"}
                        </span>
                      </p>
                      <p><strong>KYC Completed:</strong> {selectedTechnician.isKycCompleted ? "Yes" : "No"}</p>
                      <p><strong>Bank Details Completed:</strong> {selectedTechnician.isBankDetailsCompleted ? "Yes" : "No"}</p>
                      <p><strong>Rating:</strong> {selectedTechnician.rating || 0} ⭐</p>
                      <p><strong>Total Jobs:</strong> {selectedTechnician.totalJobs || 0}</p>
                      <p><strong>Completed Jobs:</strong> {selectedTechnician.completedJobs || 0}</p>
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











