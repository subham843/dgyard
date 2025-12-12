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
  Clock,
  CheckCircle2,
  Camera,
  FileText,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  X,
  History,
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
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function TechnicianDashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionData, setActionData] = useState<any>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/technician/assignments${params}`);
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetail = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/technician/assignments/${assignmentId}`);
      const data = await response.json();
      setSelectedAssignment(data.assignment);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching assignment detail:", error);
      toast.error("Failed to fetch assignment details");
    }
  };

  const handleAction = async () => {
    if (!selectedAssignment) return;

    try {
      const payload: any = { action: actionType, ...actionData };
      
      const response = await fetch(`/api/technician/assignments/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Action completed successfully");
        setShowActionModal(false);
        setShowDetailModal(false);
        setActionData({});
        fetchAssignments();
        if (selectedAssignment) {
          fetchAssignmentDetail(selectedAssignment.id);
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

  const handlePhotoUpload = async (files: FileList) => {
    if (!selectedAssignment) return;

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("photos", file);
      });

      // Upload photos (you'll need to implement this endpoint)
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        const { urls } = await uploadResponse.json();
        setActionData({ ...actionData, photos: urls });
        toast.success("Photos uploaded successfully");
      } else {
        toast.error("Failed to upload photos");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const openActionModal = (type: string) => {
    setActionType(type);
    setActionData({});
    setShowActionModal(true);
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED").length,
    inProgress: assignments.filter((a) => a.status === "IN_PROGRESS").length,
    completed: assignments.filter((a) => a.status === "COMPLETED").length,
  };

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold">My Assignments</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage your assigned service requests</p>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-700">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-700">In Progress</div>
            <div className="text-2xl font-bold text-purple-800">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700">Completed</div>
            <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {["all", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].map((status) => (
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

        {/* Assignments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-32 animate-pulse"></div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{assignment.bookingNumber}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[assignment.status]}`}>
                        {assignment.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[assignment.priority]}`}>
                        {assignment.priority}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <strong>Service:</strong> {serviceLabels[assignment.serviceType] || assignment.serviceType}
                      </div>
                      <div>
                        <strong>Customer:</strong> {assignment.user?.name || assignment.user?.email}
                      </div>
                      {assignment.scheduledAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <strong>Scheduled:</strong> {formatDate(assignment.scheduledAt)}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{assignment.city}, {assignment.state}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{assignment.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fetchAssignmentDetail(assignment.id)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Assignment: {selectedAssignment.bookingNumber}</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[selectedAssignment.status]}`}>
                  {selectedAssignment.status}
                </span>
              </DialogTitle>
              <DialogDescription>
                {serviceLabels[selectedAssignment.serviceType]} - {selectedAssignment.requestType === "COMPLAINT" ? "Complaint" : "Service Request"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Customer Information</Label>
                  <div className="mt-2 space-y-1">
                    <div className="font-medium">{selectedAssignment.user?.name || "N/A"}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedAssignment.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedAssignment.phone}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Service Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div><strong>Type:</strong> {serviceLabels[selectedAssignment.serviceType]}</div>
                    <div><strong>Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[selectedAssignment.priority]}`}>{selectedAssignment.priority}</span></div>
                    {selectedAssignment.scheduledAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <strong>Scheduled:</strong> {formatDate(selectedAssignment.scheduledAt)}
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
                  {selectedAssignment.address}, {selectedAssignment.city}, {selectedAssignment.state} - {selectedAssignment.pincode}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedAssignment.description}
                </div>
              </div>

              {/* Technician Notes */}
              {selectedAssignment.technicianNotes && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">My Notes</Label>
                  <div className="mt-2 p-3 bg-purple-50 rounded-md text-sm whitespace-pre-wrap">
                    {selectedAssignment.technicianNotes}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedAssignment.photos && selectedAssignment.photos.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos ({selectedAssignment.photos.length})
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {selectedAssignment.photos.map((photo: string, idx: number) => (
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
              {selectedAssignment.activityLogs && selectedAssignment.activityLogs.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Activity Log
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedAssignment.activityLogs.map((log: any, idx: number) => (
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
                {selectedAssignment.status !== "COMPLETED" && (
                  <>
                    <Button
                      onClick={() => openActionModal("update_status")}
                      variant="outline"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Update Status
                    </Button>
                    <Button
                      onClick={() => openActionModal("add_note")}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                    <Button
                      onClick={() => openActionModal("upload_photos")}
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                    {selectedAssignment.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => openActionModal("complete")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </>
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
              {actionType === "update_status" && "Update Status"}
              {actionType === "add_note" && "Add Note"}
              {actionType === "upload_photos" && "Upload Photos"}
              {actionType === "complete" && "Complete Assignment"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "update_status" && "Update the status of this assignment."}
              {actionType === "add_note" && "Add a note to this assignment."}
              {actionType === "upload_photos" && "Upload photos related to this assignment."}
              {actionType === "complete" && "Mark this assignment as completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "update_status" && (
              <div>
                <Label>New Status *</Label>
                <select
                  value={actionData.status || ""}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select status...</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                </select>
              </div>
            )}

            {actionType === "add_note" && (
              <div>
                <Label>Note *</Label>
                <Textarea
                  value={actionData.note || ""}
                  onChange={(e) => setActionData({ ...actionData, note: e.target.value })}
                  placeholder="Enter your note..."
                  rows={4}
                />
              </div>
            )}

            {actionType === "upload_photos" && (
              <div>
                <Label>Upload Photos *</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handlePhotoUpload(e.target.files);
                    }
                  }}
                  disabled={uploadingPhotos}
                />
                {actionData.photos && actionData.photos.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {actionData.photos.length} photo(s) ready to upload
                  </div>
                )}
              </div>
            )}

            {actionType === "complete" && (
              <div>
                <Label>Completion Notes (Optional)</Label>
                <Textarea
                  value={actionData.completionNotes || ""}
                  onChange={(e) => setActionData({ ...actionData, completionNotes: e.target.value })}
                  placeholder="Enter completion notes..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={uploadingPhotos}>
              {actionType === "update_status" && "Update"}
              {actionType === "add_note" && "Add Note"}
              {actionType === "upload_photos" && "Upload"}
              {actionType === "complete" && "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
