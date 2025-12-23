"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Search, Filter, Eye, Package, Truck, CheckCircle2, X, Clock, AlertCircle, Loader2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { exportOrdersToCSV } from "@/lib/export-utils";
import { BulkOperations } from "./bulk-operations";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

interface OrderManagementModuleProps {
  onStatsUpdate?: () => void;
}

const orderStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const paymentStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export function OrderManagementModule({ onStatsUpdate }: OrderManagementModuleProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Real-time updates every 30 seconds
  useRealtimeNotifications({
    interval: 30000,
    enabled: true,
    onUpdate: fetchOrders,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/dealer/orders${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dealer/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated");
        fetchOrders();
        onStatsUpdate?.();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Something went wrong");
    }
  };

  const handleBulkAction = async (action: string, orderIds: string[]) => {
    try {
      if (action === "mark_confirmed") {
        await Promise.all(
          orderIds.map((id) => updateOrderStatus(id, "CONFIRMED"))
        );
      } else if (action === "mark_shipped") {
        await Promise.all(
          orderIds.map((id) => updateOrderStatus(id, "SHIPPED"))
        );
      } else if (action === "mark_delivered") {
        await Promise.all(
          orderIds.map((id) => updateOrderStatus(id, "DELIVERED"))
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const viewOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === "PENDING").length,
    CONFIRMED: orders.filter(o => o.status === "CONFIRMED").length,
    PROCESSING: orders.filter(o => o.status === "PROCESSING").length,
    SHIPPED: orders.filter(o => o.status === "SHIPPED").length,
    DELIVERED: orders.filter(o => o.status === "DELIVERED").length,
    CANCELLED: orders.filter(o => o.status === "CANCELLED").length,
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-500 mt-1">Manage product orders and track status</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportOrdersToCSV(orders)}
          className="hidden md:flex"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
              statusFilter === status ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="text-sm text-gray-600 mb-1 capitalize">{status === "all" ? "All Orders" : status.replace("_", " ")}</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search orders by order number, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bulk Operations */}
      <BulkOperations
        items={filteredOrders}
        selectedItems={selectedOrders}
        onSelectionChange={setSelectedOrders}
        onBulkAction={handleBulkAction}
        actions={[
          { label: "Mark as Confirmed", value: "mark_confirmed" },
          { label: "Mark as Shipped", value: "mark_shipped" },
          { label: "Mark as Delivered", value: "mark_delivered" },
        ]}
      />

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
                      } else {
                        setSelectedOrders(new Set());
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 ${selectedOrders.has(order.id) ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedOrders);
                          if (newSelected.has(order.id)) {
                            newSelected.delete(order.id);
                          } else {
                            newSelected.add(order.id);
                          }
                          setSelectedOrders(newSelected);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.user?.name || "N/A"}</p>
                        <p className="text-sm text-gray-500">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{order.items?.length || 0} items</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">₹{order.total?.toLocaleString("en-IN")}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${orderStatusColors[order.status as keyof typeof orderStatusColors] || "bg-gray-100 text-gray-800"}`}>
                        {order.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewOrderDetail(order)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Order Details - {selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedOrder.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedOrder.user?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedOrder.address?.name}</p>
                  <p className="text-gray-600">{selectedOrder.address?.addressLine1}</p>
                  {selectedOrder.address?.addressLine2 && <p className="text-gray-600">{selectedOrder.address.addressLine2}</p>}
                  <p className="text-gray-600">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {item.product?.sku && <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>}
                        </div>
                      </div>
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{selectedOrder.subtotal?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{selectedOrder.tax?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹{selectedOrder.shipping?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">₹{selectedOrder.total?.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-3">
                {selectedOrder.status === "PENDING" && (
                  <Button onClick={() => updateOrderStatus(selectedOrder.id, "CONFIRMED")}>
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.status === "CONFIRMED" && (
                  <Button onClick={() => updateOrderStatus(selectedOrder.id, "PROCESSING")}>
                    Start Processing
                  </Button>
                )}
                {selectedOrder.status === "PROCESSING" && (
                  <Button onClick={() => updateOrderStatus(selectedOrder.id, "SHIPPED")}>
                    Mark as Shipped
                  </Button>
                )}
                {selectedOrder.status === "SHIPPED" && (
                  <Button onClick={() => updateOrderStatus(selectedOrder.id, "DELIVERED")}>
                    Mark as Delivered
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
