"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Edit,
  AlertCircle,
  Camera,
  FileText,
  History,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

const serviceLabels: Record<string, string> = {
  INSTALLATION: "Installation",
  NETWORKING: "Networking",
  DIGITAL_MARKETING: "Digital Marketing",
  MAINTENANCE: "Maintenance",
  CONSULTATION: "Consultation",
  CCTV: "CCTV & Surveillance",
  AV: "Audio Visual",
  FIRE: "Fire Safety",
  AUTOMATION: "Home Automation",
  DEVELOPMENT: "Software Development",
  REPAIR: "Repair",
  TRAINING: "Training",
  AUDIT: "Audit",
  UPGRADE: "Upgrade",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-orange-100 text-orange-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function EnhancedBookingManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [actionData, setActionData] = useState<any>({});

  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
  }, [statusFilter, serviceTypeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (serviceTypeFilter !== "all") params.append("serviceType", serviceTypeFilter);
      
      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch("/api/admin/users?role=TECHNICIAN");
      const data = await response.json();
      setTechnicians(data.users || []);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const fetchBookingDetail = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      const data = await response.json();
      setSelectedBooking(data.booking);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      toast.error("Failed to fetch booking details");
    }
  };

  const handleAction = async () => {
    if (!selectedBooking) return;

    try {
      const payload: any = { action: actionType, ...actionData };
      
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Action completed successfully");
        setShowActionModal(false);
        setShowDetailModal(false);
        setActionData({});
        fetchBookings();
        if (selectedBooking) {
          fetchBookingDetail(selectedBooking.id);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Something went wrong");
    }
  };

  const openActionModal = (type: string) => {
    setActionType(type);
    setActionData({});
    setShowActionModal(true);
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold">Unified Service Booking & Complaint Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all service requests and complaints from a single interface</p>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="text-sm font-medium py-2">Status:</span>
            {["all", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "REJECTED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 ml-4">
            <span className="text-sm font-medium py-2">Service:</span>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Services</option>
              {Object.entries(serviceLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24 animate-pulse"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{booking.bookingNumber}</div>
                      <div className="text-xs text-gray-500">{formatDate(booking.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{booking.user?.name || booking.user?.email}</div>
                      <div className="text-sm text-gray-500">{booking.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {serviceLabels[booking.serviceType] || booking.serviceType}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.requestType === "COMPLAINT" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {booking.requestType === "COMPLAINT" ? "Complaint" : "Service Request"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[booking.priority] || priorityColors.NORMAL}`}>
                        {booking.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[booking.status] || statusColors.PENDING}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.technician ? (
                        <div className="text-sm">
                          <div className="font-medium">{booking.technician.name || booking.technician.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchBookingDetail(booking.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Booking Details: {selectedBooking.bookingNumber}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[selectedBooking.status]}`}>
                  {selectedBooking.status}
                </span>
              </DialogTitle>
              <DialogDescription>
                {selectedBooking.requestType === "COMPLAINT" ? "Complaint" : "Service Request"} - {serviceLabels[selectedBooking.serviceType]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Customer Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedBooking.user?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedBooking.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedBooking.phone}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Service Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><strong>Type:</strong> {serviceLabels[selectedBooking.serviceType]}</div>
                    <div><strong>Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[selectedBooking.priority]}`}>{selectedBooking.priority}</span></div>
                    {selectedBooking.scheduledAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Scheduled:</strong> {formatDate(selectedBooking.scheduledAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Address
                </Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedBooking.address}, {selectedBooking.city}, {selectedBooking.state} - {selectedBooking.pincode}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedBooking.description}
                </div>
              </div>

              {/* Customer Notes */}
              {selectedBooking.customerNotes && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Customer Notes</Label>
                  <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm whitespace-pre-wrap">
                    {selectedBooking.customerNotes}
                  </div>
                </div>
              )}

              {/* Technician Notes */}
              {selectedBooking.technicianNotes && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Technician Notes</Label>
                  <div className="mt-2 p-3 bg-purple-50 rounded-md text-sm whitespace-pre-wrap">
                    {selectedBooking.technicianNotes}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedBooking.photos && selectedBooking.photos.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos ({selectedBooking.photos.length})
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {selectedBooking.photos.map((photo: string, idx: number) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Logs */}
              {selectedBooking.activityLogs && selectedBooking.activityLogs.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Activity Log
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedBooking.activityLogs.map((log: any, idx: number) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-gray-600">{log.description}</div>
                        <div className="text-gray-400 text-xs mt-1">{formatDate(log.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedBooking.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => openActionModal("accept")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => openActionModal("reject")}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedBooking.status !== "REJECTED" && selectedBooking.status !== "CANCELLED" && (
                  <>
                    <Button
                      onClick={() => openActionModal("schedule")}
                      variant="outline"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      onClick={() => openActionModal("assign")}
                      variant="outline"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Technician
                    </Button>
                    <Button
                      onClick={() => openActionModal("update_status")}
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                  </>
                )}
                {selectedBooking.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() => openActionModal("close")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Close Job
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" && "Accept Booking"}
              {actionType === "reject" && "Reject Booking"}
              {actionType === "schedule" && "Schedule Booking"}
              {actionType === "assign" && "Assign Technician"}
              {actionType === "update_status" && "Update Status"}
              {actionType === "close" && "Close Job"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept" && "Confirm and accept this booking request."}
              {actionType === "reject" && "Reject this booking. Please provide a reason."}
              {actionType === "schedule" && "Schedule a date and time for this service."}
              {actionType === "assign" && "Assign a technician to this booking."}
              {actionType === "update_status" && "Update the booking status."}
              {actionType === "close" && "Mark this job as completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "reject" && (
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={actionData.reason || ""}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
            )}

            {actionType === "schedule" && (
              <div>
                <Label>Scheduled Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={actionData.scheduledAt || ""}
                  onChange={(e) => setActionData({ ...actionData, scheduledAt: e.target.value })}
                />
              </div>
            )}

            {actionType === "assign" && (
              <div>
                <Label>Select Technician *</Label>
                <select
                  value={actionData.assignedTo || ""}
                  onChange={(e) => setActionData({ ...actionData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select a technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || tech.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {actionType === "update_status" && (
              <div>
                <Label>New Status *</Label>
                <select
                  value={actionData.status || ""}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select status...</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>
            )}

            {actionType === "close" && (
              <div>
                <Label>Actual Cost (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={actionData.actualCost || ""}
                  onChange={(e) => setActionData({ ...actionData, actualCost: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter actual cost..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAction}>
              {actionType === "accept" && "Accept"}
              {actionType === "reject" && "Reject"}
              {actionType === "schedule" && "Schedule"}
              {actionType === "assign" && "Assign"}
              {actionType === "update_status" && "Update"}
              {actionType === "close" && "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
