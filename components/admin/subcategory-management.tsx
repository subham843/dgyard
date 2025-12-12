"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, FolderTree, X, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { IconRenderer } from "@/components/ui/icon-renderer";

export function SubCategoryManagement() {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    categoryId: "",
    active: true,
    enableForQuotation: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch("/api/admin/subcategories");
      const data = await response.json();
      setSubCategories(data.subCategories || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/subcategories/${editingId}`
        : "/api/admin/subcategories";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(
          editingId ? "SubCategory updated!" : "SubCategory created!"
        );
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchSubCategories();
      } else {
        toast.error(data.error || "Failed to save subcategory");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (subCategory: any) => {
    setEditingId(subCategory.id);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || "",
      icon: subCategory.icon || "",
      categoryId: subCategory.categoryId,
      active: subCategory.active,
      enableForQuotation: subCategory.enableForQuotation !== false,
    });
    setShowForm(true);
  };

  const handleToggleQuotation = async (subCategory: any) => {
    try {
      const response = await fetch(`/api/admin/subcategories/${subCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enableForQuotation: !subCategory.enableForQuotation,
        }),
      });

      if (response.ok) {
        toast.success(`SubCategory ${!subCategory.enableForQuotation ? 'enabled' : 'disabled'} for quotation`);
        fetchSubCategories();
      } else {
        toast.error("Failed to update subcategory");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;

    try {
      const response = await fetch(`/api/admin/subcategories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("SubCategory deleted!");
        fetchSubCategories();
      } else {
        toast.error(data.error || "Failed to delete subcategory");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      categoryId: "",
      active: true,
      enableForQuotation: true,
    });
  };

  const filteredSubCategories = subCategories.filter((subCategory) =>
    subCategory.name.toLowerCase().includes(search.toLowerCase())
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
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/admin/categories-nested">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories (Nested View)
          </Link>
        </Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-blue mb-2">
            Sub Categories
          </h1>
          <p className="text-light-gray">Manage product subcategories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Sub Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-5 h-5" />
          <Input
            type="text"
            placeholder="Search subcategories..."
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
              <h2 className="text-xl font-bold text-dark-blue">
                {editingId ? "Edit Sub Category" : "Add Sub Category"}
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
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon Name</Label>
                <div className="space-y-2">
                  <div className="text-xs text-light-gray mb-2">
                    <strong>Icon Suggestions:</strong> Get icons from{" "}
                    <a
                      href="https://lucide.dev/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-blue hover:underline"
                    >
                      Lucide Icons
                    </a>
                    . Enter the icon name exactly as shown (e.g., "Camera", "Shield", "Zap", "Monitor", "HardDrive")
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="icon"
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      placeholder="Camera"
                      className="flex-1"
                    />
                    {formData.icon && (
                      <div className="w-12 h-12 bg-lavender-light rounded flex items-center justify-center border border-lavender-light">
                        <IconRenderer
                          iconName={formData.icon}
                          fallback={FolderTree}
                          className="w-6 h-6 text-primary-blue"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-light-gray">
                    Enter the exact icon name from Lucide Icons (case-sensitive)
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-lavender-light text-primary-blue focus:ring-primary-blue"
                  />
                  <Label htmlFor="active">
                    <span className="font-semibold">Active</span>
                    <span className="text-xs text-light-gray block">Subcategory is active and visible</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableForQuotation"
                    checked={formData.enableForQuotation}
                    onChange={(e) =>
                      setFormData({ ...formData, enableForQuotation: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-lavender-light text-primary-blue focus:ring-primary-blue"
                  />
                  <Label htmlFor="enableForQuotation">
                    <span className="font-semibold">Enable for Quotation</span>
                    <span className="text-xs text-light-gray block">When enabled, this subcategory will appear in quotations</span>
                  </Label>
                </div>
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

      {/* SubCategories List */}
      <div className="bg-white rounded-lg border border-lavender-light">
        {filteredSubCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-16 h-16 text-light-gray mx-auto mb-4" />
            <p className="text-light-gray">No subcategories found</p>
          </div>
        ) : (
          <div className="divide-y divide-lavender-light">
            {filteredSubCategories.map((subCategory) => (
              <div
                key={subCategory.id}
                className="p-4 flex items-center justify-between hover:bg-lavender-soft transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-lavender-light rounded flex items-center justify-center">
                    <IconRenderer
                      iconName={subCategory.icon}
                      fallback={FolderTree}
                      className="w-6 h-6 text-primary-blue"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-blue">
                      {subCategory.name}
                    </h3>
                    <p className="text-sm text-light-gray">
                      Category: {subCategory.category?.name || "N/A"}
                    </p>
                    {subCategory.description && (
                      <p className="text-sm text-light-gray line-clamp-1 mt-1">
                        {subCategory.description}
                      </p>
                    )}
                    <p className="text-xs text-light-gray mt-1">
                      {subCategory._count?.products || 0} products
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      subCategory.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subCategory.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleQuotation(subCategory)}
                    className={subCategory.enableForQuotation !== false ? "bg-blue-50 hover:bg-blue-100" : ""}
                  >
                    {subCategory.enableForQuotation !== false ? "✓ Quotation" : "Quotation"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(subCategory)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(subCategory.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
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

