"use client";

import { useState, useEffect } from "react";
import { 
  Settings, DollarSign, Package, Shield, Plus, Edit, Trash2, 
  Save, X, AlertCircle, CheckCircle2, RefreshCw, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCommission {
  id: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  jobType: string | null;
  city: string | null;
  region: string | null;
  dealerId: string | null;
  serviceCategoryId: string | null;
  serviceSubCategoryId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  dealer?: { id: string; name: string; email: string } | null;
  serviceCategory?: { id: string; title: string } | null;
  serviceSubCategory?: { id: string; title: string } | null;
}

interface ProductCommission {
  id: string;
  commissionPercentage: number;
  categoryId: string | null;
  subCategoryId: string | null;
  codExtraCharge: number | null;
  returnPenaltyPercent: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  category?: { id: string; name: string; slug: string } | null;
  subCategory?: { id: string; name: string; slug: string } | null;
}

interface MinimumMarginRule {
  id: string;
  minimumMarginAmount: number;
  minimumMarginPercent: number | null;
  applyToService: boolean;
  applyToProduct: boolean;
  requiresApproval: boolean;
  autoReject: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
}

export function CommissionSettingsPanel() {
  const [activeTab, setActiveTab] = useState<"service" | "product" | "margin">("service");
  const [serviceCommissions, setServiceCommissions] = useState<ServiceCommission[]>([]);
  const [productCommissions, setProductCommissions] = useState<ProductCommission[]>([]);
  const [marginRules, setMarginRules] = useState<MinimumMarginRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoints = {
        service: "/api/admin/commission/service",
        product: "/api/admin/commission/product",
        margin: "/api/admin/commission/margin-rule",
      };

      const response = await fetch(endpoints[activeTab]);
      if (response.ok) {
        const data = await response.json();
        if (activeTab === "service") {
          setServiceCommissions(data.commissions || []);
        } else if (activeTab === "product") {
          setProductCommissions(data.commissions || []);
        } else {
          setMarginRules(data.rules || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoints = {
        service: "/api/admin/commission/service",
        product: "/api/admin/commission/product",
        margin: "/api/admin/commission/margin-rule",
      };

      const method = editingId ? "PUT" : "POST";
      const url = endpoints[activeTab];

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...(editingId && { id: editingId }),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({});
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this rule?")) return;

    try {
      const endpoints = {
        service: "/api/admin/commission/service",
        product: "/api/admin/commission/product",
        margin: "/api/admin/commission/margin-rule",
      };

      const response = await fetch(endpoints[activeTab], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: false }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deactivating:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary-blue" />
                Platform Commission Settings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure platform commission rules for services and products
              </p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({}); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Rule
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("service")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "service"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <DollarSign className="w-4 h-4 inline-block mr-2" />
              Service Commission
            </button>
            <button
              onClick={() => setActiveTab("product")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "product"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-2" />
              Product Commission
            </button>
            <button
              onClick={() => setActiveTab("margin")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "margin"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-2" />
              Minimum Margin Rules
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === "service" && (
                  <ServiceCommissionView
                    commissions={serviceCommissions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
                {activeTab === "product" && (
                  <ProductCommissionView
                    commissions={productCommissions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
                {activeTab === "margin" && (
                  <MarginRuleView
                    rules={marginRules}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <CommissionForm
            type={activeTab}
            formData={formData}
            onClose={() => { setShowForm(false); setEditingId(null); setFormData({}); }}
            onSubmit={async (data) => {
              try {
                const endpoints = {
                  service: "/api/admin/commission/service",
                  product: "/api/admin/commission/product",
                  margin: "/api/admin/commission/margin-rule",
                };

                const method = editingId ? "PUT" : "POST";
                const url = endpoints[activeTab];

                const requestBody = {
                  ...data,
                  ...(editingId && { id: editingId }),
                };
                
                console.log("Sending commission data:", requestBody);

                const response = await fetch(url, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(requestBody),
                });

                const responseData = await response.json();

                if (response.ok) {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({});
                  fetchData();
                } else {
                  console.error("Commission save error:", {
                    status: response.status,
                    error: responseData.error,
                    details: responseData.details,
                  });
                  alert(responseData.error || responseData.details || "Failed to save");
                }
              } catch (error: any) {
                console.error("Error saving commission:", error);
                alert(`Failed to save: ${error.message || "Unknown error"}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function ServiceCommissionView({ 
  commissions, 
  onEdit, 
  onDelete 
}: { 
  commissions: ServiceCommission[]; 
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Value</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Service Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sub Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Job Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">City/Region</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dealer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {commissions.map((comm) => (
            <tr key={comm.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {comm.commissionType}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold">
                {comm.commissionType === "PERCENTAGE" ? `${comm.commissionValue}%` : `₹${comm.commissionValue}`}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.serviceCategory?.title || "All"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.serviceSubCategory?.title || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{comm.jobType || "All"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.city || comm.region || "All"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.dealer?.name || "Default"}
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  comm.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {comm.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(comm)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(comm.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {commissions.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No service commission rules found</p>
        </div>
      )}
    </div>
  );
}

function ProductCommissionView({ 
  commissions, 
  onEdit, 
  onDelete 
}: { 
  commissions: ProductCommission[]; 
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commission %</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">COD Charge</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Return Penalty</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {commissions.map((comm) => (
            <tr key={comm.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold">{comm.commissionPercentage}%</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.subCategory 
                  ? `${comm.subCategory.name} (Subcategory)`
                  : comm.category 
                  ? comm.category.name 
                  : "All Categories"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.codExtraCharge ? `₹${comm.codExtraCharge}` : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {comm.returnPenaltyPercent ? `${comm.returnPenaltyPercent}%` : "-"}
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  comm.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {comm.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(comm)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(comm.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {commissions.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No product commission rules found</p>
        </div>
      )}
    </div>
  );
}

function MarginRuleView({ 
  rules, 
  onEdit, 
  onDelete 
}: { 
  rules: MinimumMarginRule[]; 
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Minimum Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Minimum %</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Applies To</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <tr key={rule.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold">₹{rule.minimumMarginAmount}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {rule.minimumMarginPercent ? `${rule.minimumMarginPercent}%` : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {rule.applyToService && rule.applyToProduct ? "Service & Product" :
                 rule.applyToService ? "Service" :
                 rule.applyToProduct ? "Product" : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {rule.autoReject ? "Auto Reject" : rule.requiresApproval ? "Requires Approval" : "-"}
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {rule.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rules.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No minimum margin rules found</p>
        </div>
      )}
    </div>
  );
}

function CommissionForm({ 
  type, 
  formData, 
  onClose, 
  onSubmit 
}: { 
  type: "service" | "product" | "margin"; 
  formData: any; 
  onClose: () => void; 
  onSubmit: (data: any) => Promise<void>;
}) {
  const [data, setData] = useState(formData || {});
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedType, setSelectedType] = useState<"category" | "subcategory" | "none">("none");
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [loadingServiceCategories, setLoadingServiceCategories] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<"category" | "subcategory" | "none">("none");

  useEffect(() => {
    if (type === "product") {
      fetchCategories();
    } else if (type === "service") {
      fetchServiceCategories();
    }
  }, [type]);

  useEffect(() => {
    setData(formData || {});
    if (type === "product") {
      if (formData?.subCategoryId) {
        setSelectedType("subcategory");
        // Find the category for this subcategory
        const subCat = categories
          .flatMap(cat => cat.subCategories?.map((sub: any) => ({ ...sub, parentCategoryId: cat.id })) || [])
          .find((sub: any) => sub.id === formData.subCategoryId);
        if (subCat) {
          setData({ ...formData, categoryIdForSub: subCat.parentCategoryId });
        }
      } else if (formData?.categoryId) {
        setSelectedType("category");
      } else {
        setSelectedType("none");
      }
    } else if (type === "service") {
      if (formData?.serviceSubCategoryId) {
        setSelectedServiceType("subcategory");
        // Find the category for this subcategory
        const subCat = serviceCategories
          .flatMap(cat => cat.serviceSubCategories?.map((sub: any) => ({ ...sub, parentCategoryId: cat.id })) || [])
          .find((sub: any) => sub.id === formData.serviceSubCategoryId);
        if (subCat) {
          setData({ ...formData, serviceCategoryIdForSub: subCat.parentCategoryId });
        }
      } else if (formData?.serviceCategoryId) {
        setSelectedServiceType("category");
      } else {
        setSelectedServiceType("none");
      }
    }
  }, [formData, categories, serviceCategories, type]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch("/api/categories");
      if (response.ok) {
        const result = await response.json();
        setCategories(result.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      setLoadingServiceCategories(true);
      const response = await fetch("/api/admin/service-categories");
      if (response.ok) {
        const result = await response.json();
        const categoriesWithSubs = await Promise.all(
          (result.serviceCategories || []).map(async (cat: any) => {
            const subRes = await fetch(`/api/admin/service-sub-categories?serviceCategoryId=${cat.id}`);
            if (subRes.ok) {
              const subData = await subRes.json();
              return { ...cat, serviceSubCategories: subData.serviceSubCategories || [] };
            }
            return { ...cat, serviceSubCategories: [] };
          })
        );
        setServiceCategories(categoriesWithSubs);
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
    } finally {
      setLoadingServiceCategories(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {type === "service" ? "Service Commission" :
             type === "product" ? "Product Commission" :
             "Minimum Margin Rule"}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          // Clean up temporary fields before submitting
          const submitData = { ...data };
          if (submitData.serviceCategoryIdForSub !== undefined) {
            delete submitData.serviceCategoryIdForSub;
          }
          if (submitData.categoryIdForSub !== undefined) {
            delete submitData.categoryIdForSub;
          }
          await onSubmit(submitData);
        }} className="space-y-4">
          {type === "service" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Commission Type</label>
                <select
                  name="commissionType"
                  value={data.commissionType || "PERCENTAGE"}
                  onChange={(e) => setData({ ...data, commissionType: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Commission Value</label>
                  <input
                  name="commissionValue"
                  type="number"
                  step="0.01"
                  value={data.commissionValue || ""}
                  onChange={(e) => setData({ ...data, commissionValue: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Type (Optional)</label>
                  <input
                    type="text"
                    name="jobType"
                    value={data.jobType || ""}
                    onChange={(e) => setData({ ...data, jobType: e.target.value || null })}
                    className="w-full p-2 border rounded"
                    placeholder="Leave empty for all job types"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Service Category / Sub Category (Optional)</label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="serviceCategoryType"
                        value="none"
                        checked={selectedServiceType === "none"}
                        onChange={() => {
                          setSelectedServiceType("none");
                          setData({ ...data, serviceCategoryId: null, serviceSubCategoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">All Service Categories (Default)</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="serviceCategoryType"
                        value="category"
                        checked={selectedServiceType === "category"}
                        onChange={() => {
                          setSelectedServiceType("category");
                          setData({ ...data, serviceSubCategoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Specific Service Category</span>
                    </label>
                    {selectedServiceType === "category" && (
                      <select
                        value={data.serviceCategoryId || ""}
                        onChange={(e) => {
                          const catId = e.target.value;
                          setData({ 
                            ...data, 
                            serviceCategoryId: catId || null,
                            serviceSubCategoryId: null // Clear subcategory when category is selected
                          });
                        }}
                        className="w-full p-2 border rounded mt-2"
                        disabled={loadingServiceCategories}
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="serviceCategoryType"
                        value="subcategory"
                        checked={selectedServiceType === "subcategory"}
                        onChange={() => {
                          setSelectedServiceType("subcategory");
                          setData({ ...data, serviceCategoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Specific Service Sub Category</span>
                    </label>
                    {selectedServiceType === "subcategory" && (
                      <div className="space-y-2 mt-2">
                        <select
                          value={data.serviceCategoryIdForSub || ""}
                          onChange={(e) => {
                            const catId = e.target.value;
                            setData({ ...data, serviceCategoryIdForSub: catId, serviceSubCategoryId: null });
                          }}
                          className="w-full p-2 border rounded"
                          disabled={loadingServiceCategories}
                        >
                          <option value="">Select Service Category First</option>
                          {serviceCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.title}
                            </option>
                          ))}
                        </select>
                        {data.serviceCategoryIdForSub && (
                          <select
                            value={data.serviceSubCategoryId || ""}
                            onChange={(e) => {
                              const subId = e.target.value;
                              setData({ 
                                ...data, 
                                serviceSubCategoryId: subId || null,
                                serviceCategoryId: null // Clear categoryId when subcategory is selected
                              });
                            }}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Service Sub Category</option>
                            {serviceCategories
                              .find((cat) => cat.id === data.serviceCategoryIdForSub)
                              ?.serviceSubCategories?.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.title}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave as "All Service Categories" to apply commission to all services
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City (Optional)</label>
                  <input
                    type="text"
                    value={data.city || ""}
                    onChange={(e) => setData({ ...data, city: e.target.value || null })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region (Optional)</label>
                  <input
                    type="text"
                    value={data.region || ""}
                    onChange={(e) => setData({ ...data, region: e.target.value || null })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </>
          )}

          {type === "product" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Commission Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={data.commissionPercentage || ""}
                  onChange={(e) => setData({ ...data, commissionPercentage: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category / Subcategory (Optional)</label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="categoryType"
                        value="none"
                        checked={selectedType === "none"}
                        onChange={() => {
                          setSelectedType("none");
                          setData({ ...data, categoryId: null, subCategoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">All Categories (Default)</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="categoryType"
                        value="category"
                        checked={selectedType === "category"}
                        onChange={() => {
                          setSelectedType("category");
                          setData({ ...data, subCategoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Specific Category</span>
                    </label>
                    {selectedType === "category" && (
                      <select
                        value={data.categoryId || ""}
                        onChange={(e) => {
                          const catId = e.target.value;
                          setData({ 
                            ...data, 
                            categoryId: catId || null,
                            subCategoryId: null // Clear subcategory when category is selected
                          });
                        }}
                        className="w-full p-2 border rounded mt-2"
                        disabled={loadingCategories}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="categoryType"
                        value="subcategory"
                        checked={selectedType === "subcategory"}
                        onChange={() => {
                          setSelectedType("subcategory");
                          setData({ ...data, categoryId: null });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Specific Subcategory</span>
                    </label>
                    {selectedType === "subcategory" && (
                      <div className="space-y-2 mt-2">
                        <select
                          value={data.categoryIdForSub || ""}
                          onChange={(e) => {
                            const catId = e.target.value;
                            setData({ ...data, categoryIdForSub: catId, subCategoryId: null });
                          }}
                          className="w-full p-2 border rounded"
                          disabled={loadingCategories}
                        >
                          <option value="">Select Category First</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {data.categoryIdForSub && (
                          <select
                            value={data.subCategoryId || ""}
                            onChange={(e) => {
                              const subId = e.target.value;
                              setData({ 
                                ...data, 
                                subCategoryId: subId || null,
                                categoryId: null // Clear categoryId when subcategory is selected
                              });
                            }}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select Subcategory</option>
                            {categories
                              .find((cat) => cat.id === data.categoryIdForSub)
                              ?.subCategories?.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave as "All Categories" to apply commission to all products
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">COD Extra Charge (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.codExtraCharge || ""}
                  onChange={(e) => setData({ ...data, codExtraCharge: e.target.value || null })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return Penalty % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.returnPenaltyPercent || ""}
                  onChange={(e) => setData({ ...data, returnPenaltyPercent: e.target.value || null })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}

          {type === "margin" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Margin Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.minimumMarginAmount || ""}
                    onChange={(e) => setData({ ...data, minimumMarginAmount: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Margin % (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.minimumMarginPercent || ""}
                    onChange={(e) => setData({ ...data, minimumMarginPercent: e.target.value || null })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.applyToService !== false}
                      onChange={(e) => setData({ ...data, applyToService: e.target.checked })}
                    />
                    Apply to Service
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.applyToProduct !== false}
                      onChange={(e) => setData({ ...data, applyToProduct: e.target.checked })}
                    />
                    Apply to Product
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.requiresApproval || false}
                      onChange={(e) => setData({ ...data, requiresApproval: e.target.checked })}
                    />
                    Requires Approval
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.autoReject || false}
                      onChange={(e) => setData({ ...data, autoReject: e.target.checked })}
                    />
                    Auto Reject
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={data.notes || ""}
              onChange={(e) => setData({ ...data, notes: e.target.value || null })}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

