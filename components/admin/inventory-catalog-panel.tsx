"use client";

import { useState, useEffect } from "react";
import {
  Database, Layers, Package, Tag, Plus, Edit, Trash2, Search,
  RefreshCw, AlertTriangle, CheckCircle2, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  productCount: number;
}

interface Attribute {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT";
  values?: string[];
  categoryId: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  stock: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  price: number;
}

export function InventoryCatalogPanel() {
  const [activeTab, setActiveTab] = useState<"categories" | "attributes" | "products" | "inventory">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "attributes") {
      fetchAttributes();
    } else if (activeTab === "products") {
      fetchProducts();
    } else {
      fetchInventory();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/catalog/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/catalog/attributes");
      if (response.ok) {
        const data = await response.json();
        setAttributes(data.attributes || []);
      }
    } catch (error) {
      console.error("Error fetching attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/catalog/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/inventory");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setLowStockCount(data.lowStockCount || 0);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory & Catalog Control</h1>
              <p className="text-sm text-gray-600 mt-1">Manage categories, attributes, and inventory</p>
            </div>
            {lowStockCount > 0 && (
              <div className="px-4 py-2 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-900">{lowStockCount} products low in stock</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "categories"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Layers className="w-4 h-4 inline-block mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveTab("attributes")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "attributes"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Tag className="w-4 h-4 inline-block mr-2" />
              Attributes
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "products"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "inventory"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Database className="w-4 h-4 inline-block mr-2" />
              Inventory ({lowStockCount} low)
            </button>
          </div>

          <div className="p-6">
            {activeTab === "categories" && (
              <CategoriesView categories={categories} loading={loading} />
            )}
            {activeTab === "attributes" && (
              <AttributesView attributes={attributes} loading={loading} />
            )}
            {activeTab === "products" && (
              <ProductsView products={products} loading={loading} />
            )}
            {activeTab === "inventory" && (
              <InventoryView products={products} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesView({ categories, loading }: { categories: Category[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="p-4 border-2 border-gray-200 rounded-lg flex items-center justify-between"
          style={{ paddingLeft: `${category.level * 24 + 16}px` }}
        >
          <div>
            <div className="font-semibold text-gray-900">{category.name}</div>
            <div className="text-sm text-gray-500">{category.productCount} products</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttributesView({ attributes, loading }: { attributes: Attribute[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading attributes...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Values</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {attributes.map((attr) => (
            <tr key={attr.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{attr.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{attr.type}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {attr.values?.join(", ") || "N/A"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{attr.categoryId}</td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsView({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.categoryName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">₹{product.price.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  product.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : product.status === "OUT_OF_STOCK"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}>
                  {product.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryView({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr
              key={product.id}
              className={`hover:bg-gray-50 ${
                product.stock < 10 ? "bg-red-50" : product.stock < 50 ? "bg-yellow-50" : ""
              }`}
            >
              <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
              <td className="px-6 py-4">
                <span className={`font-semibold ${
                  product.stock < 10 ? "text-red-600" : product.stock < 50 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {product.stock}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  product.stock < 10
                    ? "bg-red-100 text-red-800 border-red-200"
                    : product.stock < 50
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }`}>
                  {product.stock < 10 ? "Low Stock" : product.stock < 50 ? "Medium" : "In Stock"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

