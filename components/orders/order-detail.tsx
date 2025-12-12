"use client";

import { formatPrice, formatDate } from "@/lib/utils";
import { Package, MapPin, Calendar, CreditCard, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OrderDetailProps {
  order: any;
}

export function OrderDetail({ order }: OrderDetailProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/orders" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Orders
        </Link>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-10 h-10 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.product.category}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                      <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h2>
            <div className="text-gray-700">
              <div className="font-semibold mb-2">{order.address.name}</div>
              <div className="text-sm space-y-1">
                <div>{order.address.phone}</div>
                <div>{order.address.addressLine1}</div>
                {order.address.addressLine2 && <div>{order.address.addressLine2}</div>}
                <div>
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </div>
                <div>{order.address.country}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Order Number</div>
              <div className="font-semibold">{order.orderNumber}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Order Date
              </div>
              <div className="font-semibold">{formatDate(order.createdAt)}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Status</div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Payment Status</div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (GST 18%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {order.paymentStatus === "PENDING" && (
              <Button className="w-full mt-6" style={{ backgroundColor: '#3A59FF' }}>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

