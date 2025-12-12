"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, Package, Upload, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export function ProductManagement() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    comparePrice: "",
    sku: "",
    stock: "",
    brandId: "",
    categoryId: "",
    subCategoryId: "",
    territoryCategoryId: "",
    tags: "",
    featured: false,
    active: true,
    enableForQuotation: true,
    images: [] as string[],
    originalResolutionSupport: [] as string[],
    compatibleResolutionSupport: [] as string[],
    maxCameraSupport: "" as string | number,
    megapixelSupported: [] as string[],
    maxCameraSupported: "" as string | number,
    maxWireInMeter: "" as string | number,
  });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [territoryCategories, setTerritoryCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [recordingDeviceTerritoryCategories, setRecordingDeviceTerritoryCategories] = useState<any[]>([]);
  const [hasRecordingDeviceSetting, setHasRecordingDeviceSetting] = useState(false);
  const [hasPowerSupplySetting, setHasPowerSupplySetting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
    fetchTerritoryCategories();
    fetchBrands();
  }, []);

  // Check for Recording Device Setting when category/subcategory changes
  useEffect(() => {
    const checkRecordingDeviceSetting = async () => {
      if (formData.categoryId && formData.subCategoryId) {
        try {
          const response = await fetch(
            `/api/admin/recording-device-settings/check?categoryId=${formData.categoryId}&subCategoryId=${formData.subCategoryId}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          
          console.log("Recording Device Setting check response:", {
            hasSetting: data.hasSetting,
            territoryCategoriesCount: data.territoryCategories?.length || 0,
            categoryId: formData.categoryId,
            subCategoryId: formData.subCategoryId,
          });
          
          if (data.hasSetting) {
            setHasRecordingDeviceSetting(true);
            setRecordingDeviceTerritoryCategories(data.territoryCategories || []);
            console.log("Setting found, territory categories:", data.territoryCategories);
          } else {
            setHasRecordingDeviceSetting(false);
            setRecordingDeviceTerritoryCategories([]);
            console.log("No Recording Device Setting found for this category/subcategory");
            // Reset the fields if no setting exists
            setFormData((prev) => ({
              ...prev,
              originalResolutionSupport: [],
              compatibleResolutionSupport: [],
              maxCameraSupport: "",
              megapixelSupported: [],
              maxCameraSupported: "",
              maxWireInMeter: "",
            }));
          }
        } catch (error) {
          console.error("Error checking Recording Device Setting:", error);
          setHasRecordingDeviceSetting(false);
          setRecordingDeviceTerritoryCategories([]);
        }
      } else {
        setHasRecordingDeviceSetting(false);
        setRecordingDeviceTerritoryCategories([]);
      }
    };

    checkRecordingDeviceSetting();
  }, [formData.categoryId, formData.subCategoryId]);

  // Check for Power Supply Setting when category changes
  useEffect(() => {
    const checkPowerSupplySetting = async () => {
      if (formData.categoryId) {
        try {
          const response = await fetch(
            `/api/admin/power-supply-settings/check?categoryId=${formData.categoryId}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          
          console.log("Power Supply Setting check response:", {
            hasSetting: data.hasSetting,
            territoryCategoriesCount: data.territoryCategories?.length || 0,
            categoryId: formData.categoryId,
          });
          
          if (data.hasSetting) {
            setHasPowerSupplySetting(true);
            console.log("Power Supply Setting found, territory categories:", data.territoryCategories);
          } else {
            setHasPowerSupplySetting(false);
            console.log("No Power Supply Setting found for this category");
            // Reset the fields if no setting exists
            setFormData((prev) => ({
              ...prev,
              megapixelSupported: [],
              maxCameraSupported: "",
              maxWireInMeter: "",
            }));
          }
        } catch (error) {
          console.error("Error checking Power Supply Setting:", error);
          setHasPowerSupplySetting(false);
        }
      } else {
        setHasPowerSupplySetting(false);
      }
    };

    checkPowerSupplySetting();
  }, [formData.categoryId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch products:", {
          status: response.status,
          error: errorData.error,
        });
        toast.error(errorData.error || "Failed to fetch products");
        return;
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(`Failed to fetch products: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch("/api/admin/subcategories", {
        credentials: "include",
      });
      const data = await response.json();
      setSubCategories(data.subCategories || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchTerritoryCategories = async () => {
    try {
      const response = await fetch("/api/admin/territory-categories", {
        credentials: "include",
      });
      const data = await response.json();
      setTerritoryCategories(data.territoryCategories || []);
    } catch (error) {
      console.error("Error fetching territory categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/admin/brands", {
        credentials: "include",
      });
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PATCH" : "POST";

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        stock: parseInt(formData.stock),
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: formData.images,
        maxCameraSupport: formData.maxCameraSupport ? (typeof formData.maxCameraSupport === 'string' ? parseInt(formData.maxCameraSupport, 10) : formData.maxCameraSupport) : null,
        megapixelSupported: formData.megapixelSupported || [],
        maxCameraSupported: formData.maxCameraSupported ? (typeof formData.maxCameraSupported === 'string' ? parseInt(formData.maxCameraSupported, 10) : formData.maxCameraSupported) : null,
        maxWireInMeter: formData.maxWireInMeter ? (typeof formData.maxWireInMeter === 'string' ? parseFloat(formData.maxWireInMeter) : formData.maxWireInMeter) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Product Save Error:", {
          status: response.status,
          error: data.error,
          details: data.details,
          fullResponse: data,
        });
        const errorMessage = data.error || data.message || `Failed to save product (Status: ${response.status})`;
        toast.error(errorMessage);
        return;
      }

      toast.success(editingId ? "Product updated!" : "Product created!");
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Product Save Error:", error);
      toast.error(`Something went wrong: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = async (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || "",
      sku: product.sku || "",
      stock: product.stock.toString(),
      brandId: product.brandId || "",
      categoryId: product.categoryId || "",
      subCategoryId: product.subCategoryId || "",
      territoryCategoryId: product.territoryCategoryId || "",
      tags: product.tags.join(", "),
      featured: product.featured,
      active: product.active,
      enableForQuotation: product.enableForQuotation !== undefined ? product.enableForQuotation : true,
      images: product.images || [],
      originalResolutionSupport: product.originalResolutionSupport || [],
      compatibleResolutionSupport: product.compatibleResolutionSupport || [],
      maxCameraSupport: product.maxCameraSupport?.toString() || "",
      megapixelSupported: product.megapixelSupported || [],
      maxCameraSupported: product.maxCameraSupported?.toString() || "",
      maxWireInMeter: product.maxWireInMeter?.toString() || "",
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          images: [...prev.images, data.url],
        }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      comparePrice: "",
      sku: "",
      stock: "",
      brandId: "",
      categoryId: "",
      subCategoryId: "",
      territoryCategoryId: "",
      tags: "",
      featured: false,
      active: true,
      enableForQuotation: true,
      images: [],
      originalResolutionSupport: [],
      compatibleResolutionSupport: [],
      maxCameraSupport: "",
      megapixelSupported: [],
      maxCameraSupported: "",
      maxWireInMeter: "",
    });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    (product.categoryRelation?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (product.subCategory?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (product.territoryCategory?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (product.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white border-b">
        <div className="px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Product Management</h1>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                resetForm();
              }}
              style={{ backgroundColor: '#3A59FF' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? "Cancel" : "Add Product"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {showForm && (
          <div className="bg-white rounded-lg p-8 border border-gray-200 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Compare Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Brand</Label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const selectedCategoryId = e.target.value;
                      setFormData({ 
                        ...formData, 
                        categoryId: selectedCategoryId,
                        subCategoryId: "", // Reset subcategory when category changes
                        territoryCategoryId: "", // Reset territory category when category changes
                        originalResolutionSupport: [], // Reset resolution support fields
                        compatibleResolutionSupport: [], // Reset resolution support fields
                      });
                    }}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Sub Category</Label>
                  <select
                    value={formData.subCategoryId}
                    onChange={(e) => {
                      const selectedSubCategoryId = e.target.value;
                      setFormData({ 
                        ...formData, 
        subCategoryId: selectedSubCategoryId,
        territoryCategoryId: "", // Reset territory category when subcategory changes
        originalResolutionSupport: [], // Reset resolution support fields
        compatibleResolutionSupport: [], // Reset resolution support fields
      });
                    }}
                    disabled={!formData.categoryId}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories
                      .filter((subCategory) => subCategory.categoryId === formData.categoryId)
                      .map((subCategory) => (
                        <option key={subCategory.id} value={subCategory.id}>
                          {subCategory.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Territory Category</Label>
                  <select
                    value={formData.territoryCategoryId}
                    onChange={(e) => setFormData({ ...formData, territoryCategoryId: e.target.value })}
                    disabled={!formData.categoryId && !formData.subCategoryId}
                    className="w-full px-3 py-2 border border-lavender-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Territory Category</option>
                    {territoryCategories
                      .filter((territoryCategory) => {
                        // Show all territory categories related to selected category/subcategory
                        // No need to filter by enableForQuotation
                        if (!formData.categoryId && !formData.subCategoryId) {
                          return false;
                        }
                        // Check if territory category has the selected category
                        const hasCategory = formData.categoryId && 
                          territoryCategory.categories?.some(
                            (tc: any) => tc.categoryId === formData.categoryId
                          );
                        // Check if territory category has the selected subcategory
                        const hasSubCategory = formData.subCategoryId && 
                          territoryCategory.subCategories?.some(
                            (tsc: any) => tsc.subCategoryId === formData.subCategoryId
                          );
                        return hasCategory || hasSubCategory;
                      })
                      .map((territoryCategory) => (
                        <option key={territoryCategory.id} value={territoryCategory.id}>
                          {territoryCategory.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              {/* Recording Device Resolution Support Fields */}
              {hasRecordingDeviceSetting && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <Label>Original / True Resolution Support *</Label>
                    {territoryCategories.filter((tc) => tc.enableForQuotation === true).length > 0 ? (
                      <div className="border border-lavender-light rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                        {territoryCategories
                          .filter((tc) => tc.enableForQuotation === true)
                          .map((tc) => (
                          <label
                            key={tc.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded mb-1"
                          >
                            <input
                              type="checkbox"
                              checked={formData.originalResolutionSupport.includes(tc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    originalResolutionSupport: [...formData.originalResolutionSupport, tc.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    originalResolutionSupport: formData.originalResolutionSupport.filter(
                                      (id) => id !== tc.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                            />
                            <span className="text-sm text-dark-blue">{tc.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm p-3 border border-amber-200 rounded-md bg-amber-50">
                        <p className="text-amber-800 font-semibold mb-1">
                          No territory categories available
                        </p>
                        <p className="text-amber-700 text-xs">
                          No territory categories found with "Enable for Quotation" enabled. 
                          Please enable "Enable for Quotation" for territory categories in the Territory Categories management section.
                        </p>
                      </div>
                    )}
                    {formData.originalResolutionSupport.length > 0 && (
                      <p className="text-xs text-light-gray mt-1">
                        {formData.originalResolutionSupport.length} selected
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Compatible / Supported Resolution *</Label>
                    {territoryCategories.filter((tc) => tc.enableForQuotation === true).length > 0 ? (
                      <div className="border border-lavender-light rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                        {territoryCategories
                          .filter((tc) => tc.enableForQuotation === true)
                          .map((tc) => (
                          <label
                            key={tc.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded mb-1"
                          >
                            <input
                              type="checkbox"
                              checked={formData.compatibleResolutionSupport.includes(tc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    compatibleResolutionSupport: [...formData.compatibleResolutionSupport, tc.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    compatibleResolutionSupport: formData.compatibleResolutionSupport.filter(
                                      (id) => id !== tc.id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                            />
                            <span className="text-sm text-dark-blue">{tc.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm p-3 border border-amber-200 rounded-md bg-amber-50">
                        <p className="text-amber-800 font-semibold mb-1">
                          No territory categories available
                        </p>
                        <p className="text-amber-700 text-xs">
                          No territory categories found with "Enable for Quotation" enabled. 
                          Please enable "Enable for Quotation" for territory categories in the Territory Categories management section.
                        </p>
                      </div>
                    )}
                    {formData.compatibleResolutionSupport.length > 0 && (
                      <p className="text-xs text-light-gray mt-1">
                        {formData.compatibleResolutionSupport.length} selected
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Max Number of Camera Support</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter max number of camera support"
                      value={formData.maxCameraSupport}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          maxCameraSupport: value === "" ? "" : parseInt(value, 10),
                        });
                      }}
                      className="w-full max-w-md"
                    />
                    <p className="text-xs text-light-gray mt-1">
                      Optional: Maximum number of cameras this recording device can support
                    </p>
                  </div>
                </div>
              )}

              {/* Power Supply Fields */}
              {hasPowerSupplySetting && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-dark-blue mb-4">Megapixel Supported</h3>
                    {territoryCategories.filter((tc) => tc.enableForQuotation === true).length > 0 ? (
                      <div className="border border-lavender-light rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                        {territoryCategories
                          .filter((tc) => tc.enableForQuotation === true)
                          .map((tc) => (
                            <label
                              key={tc.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-lavender-light p-2 rounded mb-1"
                            >
                              <input
                                type="checkbox"
                                checked={formData.megapixelSupported.includes(tc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      megapixelSupported: [...formData.megapixelSupported, tc.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      megapixelSupported: formData.megapixelSupported.filter(
                                        (id) => id !== tc.id
                                      ),
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-primary-blue border-lavender-light rounded focus:ring-primary-blue"
                              />
                              <span className="text-sm text-dark-blue">{tc.name}</span>
                            </label>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm p-3 border border-amber-200 rounded-md bg-amber-50">
                        <p className="text-amber-800 font-semibold mb-1">
                          No territory categories available
                        </p>
                        <p className="text-amber-700 text-xs">
                          No territory categories found with "Enable for Quotation" enabled.
                        </p>
                      </div>
                    )}
                    {formData.megapixelSupported.length > 0 && (
                      <p className="text-xs text-light-gray mt-1">
                        {formData.megapixelSupported.length} selected
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Maximum Number of Camera Supported</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter max number of camera supported"
                      value={formData.maxCameraSupported}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          maxCameraSupported: value === "" ? "" : parseInt(value, 10),
                        });
                      }}
                      className="w-full max-w-md"
                    />
                    <p className="text-xs text-light-gray mt-1">
                      Optional: Maximum number of cameras this power supply can support
                    </p>
                  </div>
                  <div>
                    <Label>Max Wire in Meter</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Enter max wire length in meters"
                      value={formData.maxWireInMeter}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({
                          ...formData,
                          maxWireInMeter: value === "" ? "" : parseFloat(value),
                        });
                      }}
                      className="w-full max-w-md"
                    />
                    <p className="text-xs text-light-gray mt-1">
                      Optional: Maximum wire length in meters
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="cctv, security, camera"
                />
              </div>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="mr-2"
                  />
                  Featured
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  <div>
                    <span className="font-semibold">Active</span>
                    <span className="text-xs text-gray-500 block">Product is active and visible</span>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableForQuotation}
                    onChange={(e) => setFormData({ ...formData, enableForQuotation: e.target.checked })}
                    className="mr-2"
                  />
                  <div>
                    <span className="font-semibold">Enable for Quotation</span>
                    <span className="text-xs text-gray-500 block">Show in quotations</span>
                  </div>
                </label>
              </div>
              <div>
                <Label>Product Images</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-2">Uploading...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-500 mt-1">Upload</p>
                        </div>
                      )}
                    </label>
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden group">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload product images (JPEG, PNG, WebP). Max size: 5MB per image.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit" style={{ backgroundColor: '#3A59FF' }}>
                  {editingId ? "Update Product" : "Create Product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.sku || "No SKU"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        {product.categoryRelation && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded w-fit">
                            Category: {product.categoryRelation.name}
                          </span>
                        )}
                        {product.subCategory && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded w-fit">
                            Sub: {product.subCategory.name}
                          </span>
                        )}
                        {product.territoryCategory && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded w-fit">
                            Territory: {product.territoryCategory.name}
                          </span>
                        )}
                        {!product.categoryRelation && !product.subCategory && !product.territoryCategory && (
                          <span className="text-xs text-gray-400">{product.category || "No category"}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatPrice(product.price)}</div>
                      {product.comparePrice && (
                        <div className="text-sm text-gray-400 line-through">
                          {formatPrice(product.comparePrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.active ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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
    </div>
  );
}

