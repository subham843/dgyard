"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Award, X } from "lucide-react";
import toast from "react-hot-toast";

export function SkillsManagement() {
  const [skills, setSkills] = useState<any[]>([]);
  const [serviceDomains, setServiceDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    serviceDomainId: "",
    active: true,
    order: 0,
  });

  useEffect(() => {
    fetchServiceDomains();
    fetchSkills();
  }, []);

  const fetchServiceDomains = async () => {
    try {
      const response = await fetch("/api/admin/service-domains", {
        credentials: "include",
      });
      const data = await response.json();
      setServiceDomains(data.serviceDomains || []);
    } catch (error) {
      console.error("Error fetching service domains:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/admin/skills", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch skills");
        return;
      }
      
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      toast.error(`Failed to fetch skills: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceDomainId) {
      toast.error("Please select a service domain");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/skills/${editingId}`
        : "/api/admin/skills";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || `Failed to save skill`);
        return;
      }

      toast.success(editingId ? "Skill updated!" : "Skill created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchSkills();
    } catch (error: any) {
      console.error("Error saving skill:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = (skill: any) => {
    setEditingId(skill.id);
    setFormData({
      title: skill.title,
      shortDescription: skill.shortDescription || "",
      serviceDomainId: skill.serviceDomainId,
      active: skill.active,
      order: skill.order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to delete skill");
        return;
      }

      toast.success("Skill deleted!");
      fetchSkills();
    } catch (error: any) {
      console.error("Error deleting skill:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      serviceDomainId: "",
      active: true,
      order: 0,
    });
  };

  const filteredSkills = skills.filter((skill) =>
    skill.title.toLowerCase().includes(search.toLowerCase()) ||
    skill.serviceDomain?.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Skills
          </h1>
          <p className="text-gray-600">Manage skills</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Skill" : "Add Skill"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="serviceDomainId">Service Domain *</Label>
                <select
                  id="serviceDomainId"
                  value={formData.serviceDomainId}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceDomainId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a service domain</option>
                  {serviceDomains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="active">
                  <span className="font-semibold">Active</span>
                  <span className="text-xs text-gray-500 block">Skill is active and visible</span>
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredSkills.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No skills found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {skill.title}
                    </h3>
                    {skill.shortDescription && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {skill.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Domain: {skill.serviceDomain?.title || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      skill.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {skill.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(skill)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(skill.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
