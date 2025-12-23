"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Network, X } from "lucide-react";
import toast from "react-hot-toast";

export function ServiceDomainManagement() {
  const [serviceDomains, setServiceDomains] = useState<any[]>([]);
  const [serviceSubCategories, setServiceSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    serviceSubCategoryIds: [] as string[],
    active: true,
    order: 0,
  });

  useEffect(() => {
    fetchServiceSubCategories();
    fetchServiceDomains();
  }, []);

  const fetchServiceSubCategories = async () => {
    try {
      const response = await fetch("/api/admin/service-sub-categories", {
        credentials: "include",
      });
      const data = await response.json();
      setServiceSubCategories(data.serviceSubCategories || []);
    } catch (error) {
      console.error("Error fetching service sub categories:", error);
    }
  };

  const fetchServiceDomains = async () => {
    try {
      const response = await fetch("/api/admin/service-domains", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch service domains");
        return;
      }
      
      const data = await response.json();
      setServiceDomains(data.serviceDomains || []);
    } catch (error: any) {
      console.error("Error fetching service domains:", error);
      toast.error(`Failed to fetch service domains: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceSubCategoryIds || formData.serviceSubCategoryIds.length === 0) {
      toast.error("Please select at least one service sub category");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/service-domains/${editingId}`
        : "/api/admin/service-domains";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || `Failed to save service domain`);
        return;
      }

      toast.success(editingId ? "Service Domain updated!" : "Service Domain created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchServiceDomains();
    } catch (error: any) {
      console.error("Error saving service domain:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = (domain: any) => {
    setEditingId(domain.id);
    setFormData({
      title: domain.title,
      shortDescription: domain.shortDescription || "",
      serviceSubCategoryIds: domain.serviceSubCategories?.map((sc: any) => sc.serviceSubCategoryId) || [],
      active: domain.active,
      order: domain.order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service domain?")) return;

    try {
      const response = await fetch(`/api/admin/service-domains/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to delete service domain");
        return;
      }

      toast.success("Service Domain deleted!");
      fetchServiceDomains();
    } catch (error: any) {
      console.error("Error deleting service domain:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const toggleSubCategory = (subCategoryId: string) => {
    setFormData((prev) => {
      const ids = prev.serviceSubCategoryIds || [];
      if (ids.includes(subCategoryId)) {
        return { ...prev, serviceSubCategoryIds: ids.filter((id) => id !== subCategoryId) };
      } else {
        return { ...prev, serviceSubCategoryIds: [...ids, subCategoryId] };
      }
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      serviceSubCategoryIds: [],
      active: true,
      order: 0,
    });
  };

  const filteredDomains = serviceDomains.filter((domain) =>
    domain.title.toLowerCase().includes(search.toLowerCase())
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
            Service Domains
          </h1>
          <p className="text-gray-600">Manage service domains</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service Domain
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search service domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Service Domain" : "Add Service Domain"}
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
                <Label htmlFor="serviceSubCategoryIds">Service Sub Categories *</Label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                  {serviceSubCategories.length === 0 ? (
                    <p className="text-sm text-gray-500">No service sub categories available</p>
                  ) : (
                    <div className="space-y-2">
                      {serviceSubCategories.map((subCat) => (
                        <label key={subCat.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.serviceSubCategoryIds.includes(subCat.id)}
                            onChange={() => toggleSubCategory(subCat.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            {subCat.title} 
                            {subCat.serviceCategory && (
                              <span className="text-gray-500"> ({subCat.serviceCategory.title})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.serviceSubCategoryIds.length} sub category(ies)
                </p>
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
                  <span className="text-xs text-gray-500 block">Service domain is active and visible</span>
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

      {/* Domains List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredDomains.length === 0 ? (
          <div className="p-12 text-center">
            <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No service domains found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDomains.map((domain) => (
              <div
                key={domain.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center">
                    <Network className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {domain.title}
                    </h3>
                    {domain.shortDescription && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {domain.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {domain.serviceSubCategories?.length || 0} sub categories | 
                      {" "}{domain._count?.skills || 0} skills
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      domain.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {domain.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(domain)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(domain.id)}
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


