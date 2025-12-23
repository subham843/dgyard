"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, FolderTree, X } from "lucide-react";
import toast from "react-hot-toast";

export function ServiceCategoryManagement() {
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    warrantyDays: "",
    active: true,
    order: 0,
  });

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const fetchServiceCategories = async () => {
    try {
      const response = await fetch("/api/admin/service-categories", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to fetch service categories");
        return;
      }
      
      const data = await response.json();
      setServiceCategories(data.serviceCategories || []);
    } catch (error: any) {
      console.error("Error fetching service categories:", error);
      toast.error(`Failed to fetch service categories: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/service-categories/${editingId}`
        : "/api/admin/service-categories";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          warrantyDays: formData.warrantyDays ? parseInt(formData.warrantyDays) : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || `Failed to save service category`);
        return;
      }

      toast.success(editingId ? "Service Category updated!" : "Service Category created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchServiceCategories();
    } catch (error: any) {
      console.error("Error saving service category:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      title: category.title,
      shortDescription: category.shortDescription || "",
      warrantyDays: category.warrantyDays?.toString() || "",
      active: category.active,
      order: category.order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service category?")) return;

    try {
      const response = await fetch(`/api/admin/service-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to delete service category");
        return;
      }

      toast.success("Service Category deleted!");
      fetchServiceCategories();
    } catch (error: any) {
      console.error("Error deleting service category:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      warrantyDays: "",
      active: true,
      order: 0,
    });
  };

  const filteredCategories = serviceCategories.filter((category) =>
    category.title.toLowerCase().includes(search.toLowerCase())
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
            Service Categories
          </h1>
          <p className="text-gray-600">Manage service categories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search service categories..."
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
                {editingId ? "Edit Service Category" : "Add Service Category"}
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
                <Label htmlFor="warrantyDays">Service Warranty (Days)</Label>
                <Input
                  id="warrantyDays"
                  type="number"
                  min="0"
                  value={formData.warrantyDays}
                  onChange={(e) =>
                    setFormData({ ...formData, warrantyDays: e.target.value })
                  }
                  placeholder="e.g., 30, 60, 90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of days warranty for this service category (optional)
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
                  <span className="text-xs text-gray-500 block">Service category is active and visible</span>
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

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No service categories found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <FolderTree className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {category.title}
                    </h3>
                    {category.shortDescription && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {category.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {category._count?.serviceSubCategories || 0} subcategories
                      {category.warrantyDays && (
                        <span className="ml-2 text-blue-600 font-semibold">
                          • {category.warrantyDays} days warranty
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      category.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {category.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
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

