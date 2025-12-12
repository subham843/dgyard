"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, MapPin, X, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export function TerritoryCategoryManagement() {
  const [territoryCategories, setTerritoryCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    enableForQuotation: true,
    categoryIds: [] as string[],
    subCategoryIds: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchTerritoryCategories();
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
    }
  };

  const fetchTerritoryCategories = async () => {
    try {
      const response = await fetch("/api/admin/territory-categories");
      const data = await response.json();
      setTerritoryCategories(data.territoryCategories || []);
    } catch (error) {
      console.error("Error fetching territory categories:", error);
      toast.error("Failed to fetch territory categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categoryIds.length === 0 && formData.subCategoryIds.length === 0) {
      toast.error("Please select at least one category or subcategory");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/territory-categories/${editingId}`
        : "/api/admin/territory-categories";
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
          editingId
            ? "Territory Category updated!"
            : "Territory Category created!"
        );
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchTerritoryCategories();
      } else {
        toast.error(data.error || "Failed to save territory category");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (territoryCategory: any) => {
    setEditingId(territoryCategory.id);
    setFormData({
      name: territoryCategory.name,
      description: territoryCategory.description || "",
      active: territoryCategory.active,
      enableForQuotation: territoryCategory.enableForQuotation !== false,
      categoryIds:
        territoryCategory.categories?.map((c: any) => c.categoryId) || [],
      subCategoryIds:
        territoryCategory.subCategories?.map((sc: any) => sc.subCategoryId) ||
        [],
    });
    setShowForm(true);
  };

  const handleToggleQuotation = async (territoryCategory: any) => {
    try {
      const response = await fetch(`/api/admin/territory-categories/${territoryCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enableForQuotation: !territoryCategory.enableForQuotation,
        }),
      });

      if (response.ok) {
        toast.success(`Territory Category ${!territoryCategory.enableForQuotation ? 'enabled' : 'disabled'} for quotation`);
        fetchTerritoryCategories();
      } else {
        toast.error("Failed to update territory category");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this territory category?"))
      return;

    try {
      const response = await fetch(`/api/admin/territory-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Territory Category deleted!");
        fetchTerritoryCategories();
      } else {
        toast.error(data.error || "Failed to delete territory category");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      active: true,
      enableForQuotation: true,
      categoryIds: [],
      subCategoryIds: [],
    });
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const toggleSubCategory = (subCategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      subCategoryIds: prev.subCategoryIds.includes(subCategoryId)
        ? prev.subCategoryIds.filter((id) => id !== subCategoryId)
        : [...prev.subCategoryIds, subCategoryId],
    }));
  };

  const filteredTerritoryCategories = territoryCategories.filter(
    (tc) => tc.name.toLowerCase().includes(search.toLowerCase())
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
            Territory Categories
          </h1>
          <p className="text-light-gray">
            Manage territory categories with multiple categories and subcategories
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Territory Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-5 h-5" />
          <Input
            type="text"
            placeholder="Search territory categories..."
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
              <h2 className="text-xl font-bold text-dark-blue">
                {editingId
                  ? "Edit Territory Category"
                  : "Add Territory Category"}
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

              {/* Categories Selection */}
              <div>
                <Label>Categories</Label>
                <div className="border border-lavender-light rounded-md p-3 max-h-40 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-light-gray">
                      No categories available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-lavender-soft p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(
                              category.id
                            )}
                            onChange={() => toggleCategory(category.id)}
                            className="w-4 h-4 rounded border-lavender-light text-primary-blue focus:ring-primary-blue"
                          />
                          <span className="text-sm text-dark-blue">
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SubCategories Selection */}
              <div>
                <Label>Sub Categories</Label>
                <div className="border border-lavender-light rounded-md p-3 max-h-40 overflow-y-auto">
                  {subCategories.length === 0 ? (
                    <p className="text-sm text-light-gray">
                      No subcategories available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subCategories.map((subCategory) => (
                        <label
                          key={subCategory.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-lavender-soft p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.subCategoryIds.includes(
                              subCategory.id
                            )}
                            onChange={() => toggleSubCategory(subCategory.id)}
                            className="w-4 h-4 rounded border-lavender-light text-primary-blue focus:ring-primary-blue"
                          />
                          <span className="text-sm text-dark-blue">
                            {subCategory.name} ({subCategory.category?.name})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
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
                    <span className="text-xs text-light-gray block">Territory category is active and visible</span>
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
                    <span className="text-xs text-light-gray block">When enabled, this territory category will appear in quotations</span>
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

      {/* Territory Categories List */}
      <div className="bg-white rounded-lg border border-lavender-light">
        {filteredTerritoryCategories.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-16 h-16 text-light-gray mx-auto mb-4" />
            <p className="text-light-gray">No territory categories found</p>
          </div>
        ) : (
          <div className="divide-y divide-lavender-light">
            {filteredTerritoryCategories.map((territoryCategory) => (
              <div
                key={territoryCategory.id}
                className="p-4 hover:bg-lavender-soft transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-lavender-light rounded flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-light-gray" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-blue mb-1">
                        {territoryCategory.name}
                      </h3>
                      {territoryCategory.description && (
                        <p className="text-sm text-light-gray line-clamp-1 mb-2">
                          {territoryCategory.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {territoryCategory.categories?.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold text-dark-blue">
                              Categories:
                            </span>{" "}
                            {territoryCategory.categories
                              .map((c: any) => c.category.name)
                              .join(", ")}
                          </div>
                        )}
                        {territoryCategory.subCategories?.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold text-dark-blue">
                              Sub Categories:
                            </span>{" "}
                            {territoryCategory.subCategories
                              .map((sc: any) => sc.subCategory.name)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-light-gray mt-1">
                        {territoryCategory._count?.products || 0} products
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        territoryCategory.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {territoryCategory.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleQuotation(territoryCategory)}
                      className={territoryCategory.enableForQuotation !== false ? "bg-blue-50 hover:bg-blue-100" : ""}
                    >
                      {territoryCategory.enableForQuotation !== false ? "✓ Quotation" : "Quotation"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(territoryCategory)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(territoryCategory.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

