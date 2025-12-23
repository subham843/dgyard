"use client";

import { useState, useEffect } from "react";
import { Warehouse, AlertTriangle, TrendingUp, TrendingDown, Package, Search, RefreshCw, Loader2, Edit, Save, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { exportInventoryToCSV } from "@/lib/export-utils";
import { BulkOperations } from "./bulk-operations";

interface InventoryManagementProps {
  onStatsUpdate?: () => void;
}

export function InventoryManagement({ onStatsUpdate }: InventoryManagementProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low-stock" | "out-of-stock">("all");
  const [editingStock, setEditingStock] = useState<{ id: string; stock: number } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const lowStockThreshold = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dealer/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`/api/dealer/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (response.ok) {
        toast.success("Stock updated successfully");
        fetchProducts();
        onStatsUpdate?.();
        setEditingStock(null);
      } else {
        toast.error("Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Something went wrong");
    }
  };

  const handleBulkStockUpdate = async (action: string, productIds: string[]) => {
    try {
      if (action === "restock") {
        // Bulk restock - set to 100
        await Promise.all(
          productIds.map((id) => updateStock(id, 100))
        );
        toast.success(`${productIds.length} products restocked`);
      }
    } catch (error) {
      throw error;
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "low-stock" && product.stock > 0 && product.stock <= lowStockThreshold) ||
      (filter === "out-of-stock" && product.stock === 0);
    
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1">Track stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportInventoryToCSV(filteredProducts)}
            className="hidden md:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchProducts} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Stock Value</p>
              <p className="text-3xl font-bold text-green-600">₹{totalStockValue.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "low-stock", "out-of-stock"] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                onClick={() => setFilter(filterOption)}
                size="sm"
                className={filter === filterOption ? "bg-blue-600" : ""}
              >
                {filterOption === "all" ? "All" : filterOption === "low-stock" ? "Low Stock" : "Out of Stock"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Operations */}
      <BulkOperations
        items={filteredProducts}
        selectedItems={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onBulkAction={handleBulkStockUpdate}
        actions={[
          { label: "Restock to 100", value: "restock" },
        ]}
      />

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
                      } else {
                        setSelectedProducts(new Set());
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 ${
                      selectedProducts.has(product.id) ? "bg-blue-50" : ""
                    } ${
                      product.stock === 0 ? "bg-red-50" : 
                      product.stock <= lowStockThreshold ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedProducts);
                          if (newSelected.has(product.id)) {
                            newSelected.delete(product.id);
                          } else {
                            newSelected.add(product.id);
                          }
                          setSelectedProducts(newSelected);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">₹{product.price.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.sku || "N/A"}</td>
                    <td className="px-6 py-4">
                      {editingStock?.id === product.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingStock.stock}
                            onChange={(e) => setEditingStock({ ...editingStock, stock: parseInt(e.target.value) || 0 })}
                            className="w-24"
                            autoFocus
                          />
                          <button
                            onClick={() => updateStock(product.id, editingStock.stock)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStock(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.stock === 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : product.stock <= lowStockThreshold ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{(product.price * product.stock).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStock({ id: product.id, stock: product.stock })}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Adjust
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900">Low Stock Alert</p>
            <p className="text-sm text-orange-700 mt-1">
              {lowStockCount} product{lowStockCount > 1 ? "s" : ""} {lowStockCount > 1 ? "are" : "is"} running low on stock (≤{lowStockThreshold} units). Please restock soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
