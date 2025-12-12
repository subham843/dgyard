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
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  X,
  UserPlus,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

const serviceTypes = [
  "INSTALLATION",
  "NETWORKING",
  "DIGITAL_MARKETING",
  "MAINTENANCE",
  "CONSULTATION",
  "CCTV",
  "AV",
  "FIRE",
  "AUTOMATION",
  "DEVELOPMENT",
  "REPAIR",
  "TRAINING",
];

export function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    specialization: [] as string[],
    experience: "",
    active: true,
  });

  useEffect(() => {
    fetchTechnicians();
    fetchUsers();
  }, [activeFilter]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const params = activeFilter !== "all" ? `?active=${activeFilter === "active"}` : "";
      const response = await fetch(`/api/admin/technicians${params}`);
      const data = await response.json();
      setTechnicians(data.technicians || []);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      toast.error("Failed to fetch technicians");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        employeeId: formData.employeeId,
        specialization: formData.specialization,
        experience: formData.experience,
        active: formData.active,
      };

      if (formData.userId) {
        payload.userId = formData.userId;
      } else {
        payload.name = formData.name;
        payload.email = formData.email;
        payload.phone = formData.phone;
      }

      const response = await fetch("/api/admin/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Technician created successfully");
        setShowForm(false);
        resetForm();
        fetchTechnicians();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create technician");
      }
    } catch (error) {
      console.error("Error creating technician:", error);
      toast.error("Something went wrong");
    }
  };

  const handleUpdate = async (technicianId: string) => {
    try {
      const response = await fetch(`/api/admin/technicians/${technicianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: formData.active,
          employeeId: formData.employeeId,
          specialization: formData.specialization,
          experience: formData.experience,
        }),
      });

      if (response.ok) {
        toast.success("Technician updated successfully");
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchTechnicians();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update technician");
      }
    } catch (error) {
      console.error("Error updating technician:", error);
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (technicianId: string) => {
    if (!confirm("Are you sure you want to delete this technician?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/technicians/${technicianId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Technician deleted successfully");
        fetchTechnicians();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete technician");
      }
    } catch (error) {
      console.error("Error deleting technician:", error);
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (technician: any) => {
    setEditingId(technician.id);
    setFormData({
      userId: technician.userId,
      name: technician.user.name,
      email: technician.user.email,
      phone: technician.user.phone,
      employeeId: technician.employeeId || "",
      specialization: technician.specialization || [],
      experience: technician.experience?.toString() || "",
      active: technician.active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      name: "",
      email: "",
      phone: "",
      employeeId: "",
      specialization: [],
      experience: "",
      active: true,
    });
    setEditingId(null);
  };

  const toggleSpecialization = (serviceType: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(serviceType)
        ? prev.specialization.filter((s) => s !== serviceType)
        : [...prev.specialization, serviceType],
    }));
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const searchLower = search.toLowerCase();
    return (
      tech.user.name?.toLowerCase().includes(searchLower) ||
      tech.user.email.toLowerCase().includes(searchLower) ||
      tech.employeeId?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Technician Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage technicians and their specializations</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Technician
          </Button>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search technicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Technicians Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24 animate-pulse"></div>
            ))}
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No technicians found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTechnicians.map((technician) => (
                  <tr key={technician.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {technician.employeeId || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{technician.user.name}</div>
                      <div className="text-sm text-gray-500">{technician.user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{technician.user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {technician.specialization.slice(0, 2).map((spec: string) => (
                          <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {spec}
                          </span>
                        ))}
                        {technician.specialization.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{technician.specialization.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {technician.experience ? `${technician.experience} years` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {technician.rating ? `${technician.rating.toFixed(1)} ⭐` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {technician.completedJobs}/{technician.totalJobs}
                    </td>
                    <td className="px-6 py-4">
                      {technician.active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(technician)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(technician.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Technician" : "Add Technician"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update technician details"
                : "Create a new technician from existing user or create new user"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleSubmit} className="space-y-4">
            {!editingId && (
              <div>
                <Label>Select Existing User (Optional)</Label>
                <select
                  value={formData.userId}
                  onChange={(e) => {
                    const selectedUser = users.find((u) => u.id === e.target.value);
                    setFormData({
                      ...formData,
                      userId: e.target.value,
                      name: selectedUser?.name || "",
                      email: selectedUser?.email || "",
                      phone: selectedUser?.phone || "",
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Create New User</option>
                  {users
                    .filter((u) => u.role !== "TECHNICIAN")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {(!formData.userId || editingId) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!editingId}
                      disabled={editingId}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={!editingId}
                      disabled={editingId}
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required={!editingId}
                    disabled={editingId}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee ID</Label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Experience (Years)</Label>
                <Input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div>
              <Label>Specialization</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {serviceTypes.map((serviceType) => (
                  <label
                    key={serviceType}
                    className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                      formData.specialization.includes(serviceType)
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialization.includes(serviceType)}
                      onChange={() => toggleSpecialization(serviceType)}
                      className="rounded"
                    />
                    <span className="text-sm">{serviceType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active (Can access technician dashboard)</span>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update" : "Create"} Technician
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
