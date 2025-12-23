"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package, ShoppingBag, Building2, AlertTriangle, CheckCircle2, XCircle,
  Search, Filter, RefreshCw, Eye, Edit, TrendingUp, DollarSign,
  Database, Settings, Download, ArrowRight, Users, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  category: string;
  price: number;
  stock: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE";
  createdAt: Date;
  images?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  sellerName: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  items: number;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  status: "ACTIVE" | "SUSPENDED";
  settlementCycle: string;
}

export function ECommerceAdminPanel() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "sellers">(
    searchParams.get("tab") || "products"
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingProducts: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalSellers: 0,
    activeSellers: 0,
    codRiskOrders: 0,
  });

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchSellers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ecommerce/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ecommerce/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ecommerce/sellers");
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
        setStats((prev) => ({ ...prev, ...data.stats }));
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAction = async (productId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/admin/ecommerce/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await fetchProducts();
      } else {
        const error = await response.json();
        alert(`Failed to ${action} product: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert(`Failed to ${action} product. Please try again.`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
      SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-Commerce Admin</h1>
              <p className="text-sm text-gray-600 mt-1">Multi-seller product & order management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={fetchProducts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Total Products</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalProducts}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pendingProducts}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Total Orders</div>
              <div className="text-2xl font-bold text-green-900">{stats.totalOrders}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">Pending Orders</div>
              <div className="text-2xl font-bold text-orange-900">{stats.pendingOrders}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">COD Risk</div>
              <div className="text-2xl font-bold text-red-900">{stats.codRiskOrders}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Total Sellers</div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalSellers}</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-sm text-indigo-600 font-medium">Active Sellers</div>
              <div className="text-2xl font-bold text-indigo-900">{stats.activeSellers}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1920px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "products"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-2" />
              Products ({stats.pendingProducts} pending)
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "orders"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag className="w-4 h-4 inline-block mr-2" />
              Orders ({stats.pendingOrders} pending)
            </button>
            <button
              onClick={() => setActiveTab("sellers")}
              className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "sellers"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Multi-Sellers ({stats.totalSellers})
            </button>
          </div>

          <div className="p-6">
            {activeTab === "products" && (
              <ProductsView
                products={products}
                loading={loading}
                getStatusBadge={getStatusBadge}
                onProductAction={handleProductAction}
                pendingCount={stats.pendingProducts}
              />
            )}
            {activeTab === "orders" && (
              <OrdersView orders={orders} loading={loading} getStatusBadge={getStatusBadge} />
            )}
            {activeTab === "sellers" && <SellersView sellers={sellers} loading={loading} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsView({
  products,
  loading,
  getStatusBadge,
  onProductAction,
  pendingCount,
}: {
  products: Product[];
  loading: boolean;
  getStatusBadge: (status: string) => string;
  onProductAction: (id: string, action: "approve" | "reject") => void;
  pendingCount: number;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">
                {pendingCount} product(s) pending approval
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Review and approve or reject products from sellers
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{product.sellerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">₹{product.price.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${
                    product.stock < 10 ? "text-red-600" : product.stock < 50 ? "text-yellow-600" : "text-green-600"
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {product.status === "PENDING" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => onProductAction(product.id, "approve")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => onProductAction(product.id, "reject")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersView({
  orders,
  loading,
  getStatusBadge,
}: {
  orders: Order[];
  loading: boolean;
  getStatusBadge: (status: string) => string;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Seller</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{order.orderNumber}</div>
                <div className="text-sm text-gray-500">{order.items} item(s)</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.customerName}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.sellerName}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{order.paymentMethod}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SellersView({ sellers, loading }: { sellers: Seller[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-blue mx-auto mb-4" />
        <p className="text-gray-600">Loading sellers...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sellers.map((seller) => (
        <div key={seller.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{seller.name}</h3>
              <p className="text-sm text-gray-500">{seller.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              seller.status === "ACTIVE"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}>
              {seller.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Products</div>
              <div className="text-lg font-bold text-gray-900">{seller.productsCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Orders</div>
              <div className="text-lg font-bold text-gray-900">{seller.ordersCount}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="text-lg font-bold text-green-600">₹{seller.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Settlement: {seller.settlementCycle}</span>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

