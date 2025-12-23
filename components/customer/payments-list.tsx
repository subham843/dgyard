"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  createdAt: string;
}

export function PaymentsList() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const typeFilter = filter === "all" ? "" : filter === "service" ? "SERVICE" : "PRODUCT";
      const url = typeFilter ? `/api/payments?type=${typeFilter}` : "/api/payments";
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setPayments(data.payments || []);
      } else {
        toast.error("Failed to load payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-blue-100 text-blue-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "PAID") return CheckCircle2;
    if (status === "FAILED") return XCircle;
    return Clock;
  };

  const downloadInvoice = async (paymentId: string, type: string) => {
    toast.success("Invoice download will be available soon");
    // TODO: Implement invoice download
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payments & Billing</h1>
        <p className="text-gray-600">View your payment history and download invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {payments.filter((p) => p.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="service">Service Payments</TabsTrigger>
          <TabsTrigger value="product">Product Payments</TabsTrigger>
        </TabsList>
      </Tabs>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No payments found</h3>
            <p className="text-gray-600">You haven't made any payments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const StatusIcon = getStatusIcon(payment.status);
            const TypeIcon = payment.type === "SERVICE" ? Wrench : Package;
            return (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        payment.type === "SERVICE" ? "bg-blue-100" : "bg-green-100"
                      }`}>
                        <TypeIcon className={`w-6 h-6 ${
                          payment.type === "SERVICE" ? "text-blue-600" : "text-green-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{payment.reference}</CardTitle>
                        <CardDescription className="mt-1">{payment.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      <StatusIcon className={`w-5 h-5 mt-2 mx-auto ${
                        payment.status === "PAID" ? "text-green-600" :
                        payment.status === "FAILED" ? "text-red-600" : "text-yellow-600"
                      }`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(payment.id, payment.type)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>
                    {payment.status === "PENDING" && (
                      <Button size="sm" className="flex-1">
                        Pay Now
                      </Button>
                    )}
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





