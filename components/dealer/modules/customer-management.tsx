"use client";

import { useState, useEffect } from "react";
import { Users, ShoppingBag, Briefcase, Search, Mail, Phone, MapPin, Calendar, Loader2, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { exportCustomersToCSV } from "@/lib/export-utils";

interface CustomerManagementModuleProps {
  onStatsUpdate?: () => void;
}

export function CustomerManagementModule({ onStatsUpdate }: CustomerManagementModuleProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [view, setView] = useState<"list" | "detail">("list");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Fetch orders to get unique customers
      const response = await fetch("/api/dealer/orders");
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        // Group by customer and aggregate data
        const customerMap = new Map();
        orders.forEach((order: any) => {
          const userId = order.userId;
          if (!customerMap.has(userId)) {
            customerMap.set(userId, {
              id: userId,
              name: order.user?.name,
              email: order.user?.email,
              phone: order.user?.phone,
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: null,
              addresses: new Set(),
            });
          }
          const customer = customerMap.get(userId);
          customer.totalOrders += 1;
          customer.totalSpent += order.total || 0;
          if (!customer.lastOrderDate || new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
            customer.lastOrderDate = order.createdAt;
          }
          if (order.address) {
            customer.addresses.add(JSON.stringify(order.address));
          }
        });

        const customersList = Array.from(customerMap.values()).map((c: any) => ({
          ...c,
          addresses: Array.from(c.addresses).map((a: string) => JSON.parse(a)),
        }));

        setCustomers(customersList);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setView("detail");
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (view === "detail" && selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView("list")}>
            ← Back to Customers
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
            <p className="text-gray-500">{selectedCustomer.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-green-600">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Last Order</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedCustomer.lastOrderDate 
                ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString("en-IN")
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{selectedCustomer.email}</span>
            </div>
            {selectedCustomer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{selectedCustomer.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Shipping Addresses</h3>
          <div className="space-y-3">
            {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
              selectedCustomer.addresses.map((address: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{address.name}</p>
                  <p className="text-gray-600">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="text-gray-600">{address.addressLine2}</p>}
                  <p className="text-gray-600">{address.city}, {address.state} {address.pincode}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No addresses found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-500 mt-1">Manage customers and their history</p>
        </div>
        {customers.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportCustomersToCSV(customers)}
            className="hidden md:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search customers by name, email, or phone..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {customer.name?.charAt(0).toUpperCase() || "C"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{customer.email}</p>
                      {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{customer.totalOrders}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-green-600">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.lastOrderDate 
                        ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => viewCustomerDetail(customer)}>
                        View Details
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
