"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Tag, X } from "lucide-react";
import toast from "react-hot-toast";

export function BrandManagement() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    active: true,
    enableForQuotation: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/admin/brands", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch brands:", {
          status: response.status,
          error: errorData.error,
        });
        toast.error(errorData.error || "Failed to fetch brands");
        return;
      }
      
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      toast.error(`Failed to fetch brands: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/brands/${editingId}`
        : "/api/admin/brands";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
        });
        toast.error(data.error || `Failed to ${editingId ? 'update' : 'create'} brand (Status: ${response.status})`);
        return;
      }

      toast.success(editingId ? "Brand updated!" : "Brand created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = (brand: any) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || "",
      active: brand.active,
      enableForQuotation: brand.enableForQuotation !== undefined ? brand.enableForQuotation : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const response = await fetch(`/api/admin/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Delete Error:", {
          status: response.status,
          error: data.error,
        });
        toast.error(data.error || "Failed to delete brand");
        return;
      }

      toast.success("Brand deleted!");
      fetchBrands();
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 500KB)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 500KB.");
      e.target.value = "";
      return;
    }

    // Validate dimensions (optional - can be done client-side with image preview)
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          logo: data.url,
        }));
        toast.success("Logo uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload logo");
      }
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logo: "",
      active: true,
      enableForQuotation: true,
    });
  };

  const handleToggleQuotation = async (brand: any) => {
    try {
      const response = await fetch(`/api/admin/brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enableForQuotation: !brand.enableForQuotation,
        }),
      });

      if (response.ok) {
        toast.success(`Brand ${!brand.enableForQuotation ? 'enabled' : 'disabled'} for quotation`);
        fetchBrands();
      } else {
        toast.error("Failed to update brand");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold text-dark-blue mb-2">Brands</h1>
          <p className="text-light-gray">Manage product brands</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-gray w-5 h-5" />
          <Input
            type="text"
            placeholder="Search brands..."
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
                {editingId ? "Edit Brand" : "Add Brand"}
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

              <div>
                <Label htmlFor="logo">Brand Logo</Label>
                <div className="space-y-2">
                  <div className="text-xs text-light-gray mb-2">
                    <strong>Recommended:</strong> 200x80 pixels (or similar wide aspect ratio), PNG format with transparent background, Max 500KB
                  </div>
                  {formData.logo && (
                    <div className="relative w-48 h-20 border border-lavender-light rounded-lg overflow-hidden mb-2 bg-white flex items-center justify-center">
                      <img
                        src={formData.logo}
                        alt="Brand logo"
                        className="max-w-full max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: "" })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && (
                    <p className="text-sm text-primary-blue">Uploading...</p>
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
                    <span className="text-xs text-light-gray block">Brand is active and visible</span>
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
                    <span className="text-xs text-light-gray block">When enabled, this brand will appear in quotations</span>
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

      {/* Brands List */}
      <div className="bg-white rounded-lg border border-lavender-light">
        {filteredBrands.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-light-gray mx-auto mb-4" />
            <p className="text-light-gray">No brands found</p>
          </div>
        ) : (
          <div className="divide-y divide-lavender-light">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="p-4 flex items-center justify-between hover:bg-lavender-soft transition-colors"
              >
                <div className="flex items-center gap-4">
                  {brand.logo ? (
                    <div className="w-24 h-12 bg-white border border-lavender-light rounded flex items-center justify-center p-2">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-lavender-light rounded flex items-center justify-center">
                      <Tag className="w-6 h-6 text-light-gray" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-dark-blue">
                      {brand.name}
                    </h3>
                    {brand.description && (
                      <p className="text-sm text-light-gray line-clamp-1">
                        {brand.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        brand.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {brand.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleQuotation(brand)}
                    className={brand.enableForQuotation !== false ? "bg-blue-50 hover:bg-blue-100" : ""}
                  >
                    {brand.enableForQuotation !== false ? "✓ Quotation" : "Quotation"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(brand)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(brand.id)}
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

