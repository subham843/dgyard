"use client";

import { useState, useEffect } from "react";
import { Receipt, Download, FileText, Calendar, Search, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "@/lib/pdf-generator";

interface BillingInvoicesGSTProps {
  onStatsUpdate?: () => void;
}

export function BillingInvoicesGST({ onStatsUpdate }: BillingInvoicesGSTProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dealer/orders");
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        // Transform orders to invoices
        const invoiceList = orders.map((order: any) => ({
          id: order.id,
          invoiceNumber: `INV-${order.orderNumber}`,
          orderNumber: order.orderNumber,
          customer: order.user?.name,
          date: order.createdAt,
          amount: order.total,
          tax: order.tax || 0,
          status: order.paymentStatus,
        }));
        setInvoices(invoiceList);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoice: any) => {
    try {
      // Fetch full order details
      const response = await fetch(`/api/dealer/orders/${invoice.id}`);
      if (!response.ok) {
        toast.error("Failed to fetch order details");
        return;
      }

      const data = await response.json();
      const order = data.order;

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customer: {
          name: order.user?.name || "N/A",
          email: order.user?.email || "N/A",
          phone: order.user?.phone,
        },
        shippingAddress: {
          name: order.address?.name || "N/A",
          addressLine1: order.address?.addressLine1 || "",
          addressLine2: order.address?.addressLine2,
          city: order.address?.city || "",
          state: order.address?.state || "",
          pincode: order.address?.pincode || "",
        },
        items: order.items?.map((item: any) => ({
          name: item.product?.name || "Product",
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          sku: item.product?.sku,
        })) || [],
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        total: order.total || 0,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      };

      generateInvoicePDF(invoiceData);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };

  const filteredInvoices = invoices.filter((inv) =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h2 className="text-2xl font-bold text-gray-900">Billing, Invoices & GST</h2>
        <p className="text-gray-500 mt-1">Generate invoices and GST reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search invoices by invoice number, order number, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No invoices found</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{invoice.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{invoice.customer}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{invoice.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₹{invoice.tax.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
