"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  ArrowLeft,
  MapPin,
  Calendar,
  CreditCard,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  trackingNumber?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image?: string;
      category?: string;
    };
  }>;
  address?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export function EnhancedOrderManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const requestReturn = async (orderId: string) => {
    if (!confirm("Are you sure you want to request a return for this order?")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Customer requested return",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Return request submitted successfully");
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to request return");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      // TODO: Implement actual invoice download
      toast.success("Invoice download will be available soon");
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUNDED: "bg-gray-100 text-gray-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED") return CheckCircle2;
    if (status === "CANCELLED" || status === "REFUNDED") return XCircle;
    if (status === "SHIPPED") return Truck;
    return Clock;
  };

  const getTrackingSteps = (order: Order) => {
    const steps = [
      { label: "Order Placed", completed: true, date: order.createdAt },
      { label: "Confirmed", completed: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) },
      { label: "Processing", completed: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) },
      { label: "Shipped", completed: ["SHIPPED", "DELIVERED"].includes(order.status), date: order.shippedAt },
      { label: "Delivered", completed: order.status === "DELIVERED", date: order.deliveredAt },
    ];
    return steps;
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "active") return ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status);
    if (filter === "delivered") return order.status === "DELIVERED";
    if (filter === "cancelled") return ["CANCELLED", "REFUNDED"].includes(order.status);
    return order.status === filter;
  });

  const canReturn = (order: Order) => {
    return order.status === "DELIVERED" && order.paymentStatus === "PAID";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage your product orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {orders.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {orders.filter((o) => o.status === "DELIVERED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't placed any orders yet"
                : `No ${filter} orders found`}
            </p>
            <Link href="/shop">
              <Button>Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            const trackingSteps = getTrackingSteps(order);
            
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <Badge variant="outline">{order.paymentStatus}</Badge>
                      </div>
                      <CardDescription>
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{order.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              {item.product.image ? (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium">{item.product.name}</h5>
                              {item.product.category && (
                                <p className="text-sm text-gray-600">{item.product.category}</p>
                              )}
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">₹{item.price.toLocaleString()} each</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking */}
                    {order.status !== "CANCELLED" && order.status !== "PENDING" && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          Order Tracking
                        </h4>
                        <div className="space-y-2">
                          {trackingSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.completed
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-400"
                              }`}>
                                {step.completed ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-current" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-400"}`}>
                                  {step.label}
                                </div>
                                {step.date && (
                                  <div className="text-xs text-gray-500">
                                    {new Date(step.date).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.trackingNumber && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Tracking Number:</span>
                              <span className="font-mono">{order.trackingNumber}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.address && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Shipping Address
                        </h4>
                        <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                          {order.address.address}, {order.address.city}, {order.address.state} - {order.address.pincode}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Link href={`/orders/${order.id}`} className="flex-1 min-w-[120px]">
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => downloadInvoice(order.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                      {canReturn(order) && (
                        <Button
                          variant="outline"
                          onClick={() => requestReturn(order.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Return
                        </Button>
                      )}
                      {order.status === "DELIVERED" && (
                        <Button variant="outline">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Rate Product
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}





