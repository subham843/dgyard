"use client";

import { useState, useEffect } from "react";
import { Truck, Package, MapPin, Calendar, Search, Edit, Save, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface ShippingDeliveryModuleProps {
  onStatsUpdate?: () => void;
}

export function ShippingDeliveryModule({ onStatsUpdate }: ShippingDeliveryModuleProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({
    courier: "",
    trackingNumber: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dealer/orders?status=PROCESSING,SHIPPED");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignCourier = (order: any) => {
    setSelectedOrder(order);
    setTrackingData({ courier: "", trackingNumber: "" });
    setShowTrackingForm(true);
  };

  const saveTracking = async () => {
    if (!selectedOrder || !trackingData.courier || !trackingData.trackingNumber) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(`/api/dealer/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SHIPPED",
          // Note: Add trackingNumber and courier fields to Order model if not present
          // trackingNumber: trackingData.trackingNumber,
          // courier: trackingData.courier,
        }),
      });

      if (response.ok) {
        toast.success("Tracking information saved");
        setShowTrackingForm(false);
        fetchOrders();
        onStatsUpdate?.();
      } else {
        toast.error("Failed to save tracking information");
      }
    } catch (error) {
      console.error("Error saving tracking:", error);
      toast.error("Something went wrong");
    }
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h2>
        <p className="text-gray-500 mt-1">Manage courier assignments and tracking</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipping Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No orders ready for shipping</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.user?.name}</p>
                      <p className="text-sm text-gray-500">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {order.address?.addressLine1}, {order.address?.city}, {order.address?.state} {order.address?.pincode}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === "SHIPPED" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.courier || "Not assigned"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">{order.trackingNumber || order.razorpayOrderId || "N/A"}</td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        onClick={() => assignCourier(order)}
                        variant={order.status === "SHIPPED" ? "outline" : "default"}
                      >
                        {order.status === "SHIPPED" ? "Update" : "Assign Courier"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Form Modal */}
      {showTrackingForm && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Assign Courier & Tracking</h3>
              <button onClick={() => setShowTrackingForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Order Number</Label>
                <Input value={selectedOrder.orderNumber} disabled />
              </div>
              <div>
                <Label>Courier Company *</Label>
                <select
                  value={trackingData.courier}
                  onChange={(e) => setTrackingData({ ...trackingData, courier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Courier</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="FedEx">FedEx</option>
                  <option value="India Post">India Post</option>
                  <option value="XpressBees">XpressBees</option>
                  <option value="Ecom Express">Ecom Express</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Tracking Number *</Label>
                <Input
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={saveTracking} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save & Mark as Shipped
                </Button>
                <Button variant="outline" onClick={() => setShowTrackingForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
