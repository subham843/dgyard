"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Package,
  Calendar,
  Shield,
  AlertCircle,
  CreditCard,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Phone,
  TrendingUp,
  FileText,
  Star,
  MessageSquare,
  HelpCircle,
  ShoppingBag,
  Truck,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface DashboardStats {
  activeServices: number;
  ongoingOrders: number;
  deliveredOrders: number;
  upcomingVisits: number;
  activeWarranties: number;
  openComplaints: number;
  recentPayments: number;
  unreadNotifications: number;
}

interface ServiceRequest {
  id: string;
  bookingNumber: string;
  serviceType: string;
  status: string;
  scheduledAt?: string;
  technician?: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

interface ProductOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: Array<{
    product: {
      name: string;
      image?: string;
    };
    quantity: number;
  }>;
  createdAt: string;
}

interface Warranty {
  id: string;
  serviceName: string;
  warrantyDaysLeft: number;
  technicianName?: string;
  expiresAt: string;
}

interface Complaint {
  id: string;
  bookingNumber: string;
  issueType: string;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeServices: 0,
    ongoingOrders: 0,
    deliveredOrders: 0,
    upcomingVisits: 0,
    activeWarranties: 0,
    openComplaints: 0,
    recentPayments: 0,
    unreadNotifications: 0,
  });
  const [activeServices, setActiveServices] = useState<ServiceRequest[]>([]);
  const [recentOrders, setRecentOrders] = useState<ProductOrder[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<ServiceRequest[]>([]);
  const [activeWarranties, setActiveWarranties] = useState<Warranty[]>([]);
  const [openComplaints, setOpenComplaints] = useState<Complaint[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        bookingsRes,
        ordersRes,
        warrantiesRes,
        complaintsRes,
        paymentsRes,
        notificationsRes,
      ] = await Promise.all([
        fetch("/api/bookings?status=ASSIGNED,IN_PROGRESS"),
        fetch("/api/orders"),
        fetch("/api/warranty-holds"),
        fetch("/api/bookings?requestType=COMPLAINT&status=PENDING,ASSIGNED,IN_PROGRESS"),
        fetch("/api/payments"),
        fetch("/api/notifications?unreadOnly=true"),
      ]);

      const bookings = await bookingsRes.json();
      const orders = await ordersRes.json();
      const warranties = await warrantiesRes.json();
      const complaints = await complaintsRes.json();
      const payments = await paymentsRes.json();
      const notificationsData = await notificationsRes.json();

      // Process bookings
      const activeBookings = bookings.bookings || [];
      const upcoming = activeBookings
        .filter((b: any) => b.scheduledAt && new Date(b.scheduledAt) > new Date())
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 3);

      setActiveServices(activeBookings.slice(0, 5));
      setUpcomingVisits(upcoming);

      // Process orders
      const allOrders = orders.orders || [];
      const ongoing = allOrders.filter((o: any) => ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status));
      const delivered = allOrders.filter((o: any) => o.status === "DELIVERED");
      setRecentOrders(allOrders.slice(0, 5));

      // Process warranties
      const allWarranties = warranties.warranties || warranties || [];
      const active = allWarranties.filter((w: any) => {
        if (w.expiresAt) {
          return new Date(w.expiresAt) > new Date();
        }
        if (w.warrantyDaysLeft !== undefined) {
          return w.warrantyDaysLeft > 0;
        }
        return true;
      });
      setActiveWarranties(active.slice(0, 5));

      // Process complaints
      const allComplaints = complaints.bookings || [];
      const open = allComplaints.filter((c: any) => ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(c.status));
      setOpenComplaints(open.slice(0, 5));

      // Process payments
      const allPayments = payments.payments || payments || [];
      setRecentPayments(allPayments.slice(0, 5));

      // Process notifications
      const allNotifications = notificationsData.notifications || notificationsData || [];
      setNotifications(allNotifications.slice(0, 5));

      // Calculate stats
      setStats({
        activeServices: activeBookings.length,
        ongoingOrders: ongoing.length,
        deliveredOrders: delivered.length,
        upcomingVisits: upcoming.length,
        activeWarranties: active.length,
        openComplaints: open.length,
        recentPayments: allPayments.length,
        unreadNotifications: allNotifications.filter((n: any) => !n.read).length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      CONFIRMED: "bg-green-100 text-green-800",
      SHIPPED: "bg-blue-100 text-blue-800",
      DELIVERED: "bg-green-100 text-green-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (["COMPLETED", "DELIVERED"].includes(status)) return CheckCircle2;
    if (["CANCELLED"].includes(status)) return XCircle;
    return Clock;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name || "Customer"}! 👋
            </h1>
            <p className="text-gray-600 mt-1">Here's everything you need to know at a glance</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.activeServices}</div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Link href="/dashboard/services" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Product Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.ongoingOrders}</div>
                <div className="text-xs text-gray-500 mt-1">{stats.deliveredOrders} delivered</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Link href="/orders" className="text-sm text-green-600 hover:underline mt-2 inline-block">
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.upcomingVisits}</div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Link href="/dashboard/services" className="text-sm text-purple-600 hover:underline mt-2 inline-block">
              View schedule →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Warranties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{stats.activeWarranties}</div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <Link href="/dashboard/warranties" className="text-sm text-orange-600 hover:underline mt-2 inline-block">
              View all →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link href="/services/book?type=INSTALLATION">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm font-medium">Book Service</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/services/book?type=CCTV">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium">CCTV Quote</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm font-medium">Shop Products</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/complaints/new">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-sm font-medium">Raise Complaint</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/payments">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-sm font-medium">Payments</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/support">
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HelpCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-sm font-medium">Support</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Service Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Service Requests</CardTitle>
                <CardDescription>Your ongoing service bookings</CardDescription>
              </div>
              <Link href="/dashboard/services">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active services</p>
                <Link href="/services/book">
                  <Button variant="outline" size="sm" className="mt-4">
                    Book a Service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeServices.map((service) => {
                  const StatusIcon = getStatusIcon(service.status);
                  return (
                    <Link
                      key={service.id}
                      href={`/dashboard/services/${service.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{service.bookingNumber}</h4>
                            <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{service.serviceType}</p>
                          {service.technician && (
                            <p className="text-xs text-gray-500 mt-1">
                              Technician: {service.technician.name}
                            </p>
                          )}
                          {service.scheduledAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Scheduled: {new Date(service.scheduledAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <StatusIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Orders</CardTitle>
                <CardDescription>Recent product purchases</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No orders yet</p>
                <Link href="/shop">
                  <Button variant="outline" size="sm" className="mt-4">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{order.orderNumber}</h4>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item{order.items.length > 1 ? "s" : ""} • ₹{order.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Technician Visit */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Technician Visit</CardTitle>
                <CardDescription>Your scheduled service visits</CardDescription>
              </div>
              <Link href="/dashboard/services">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming visits scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{visit.bookingNumber}</h4>
                      <Badge className={getStatusColor(visit.status)}>{visit.status}</Badge>
                    </div>
                    {visit.scheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(visit.scheduledAt).toLocaleString()}
                      </div>
                    )}
                    {visit.technician && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {visit.technician.name}
                        {visit.technician.phone && (
                          <span className="text-xs text-gray-500">• {visit.technician.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Active Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Warranties</CardTitle>
                <CardDescription>Your warranty coverage</CardDescription>
              </div>
              <Link href="/dashboard/warranties">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeWarranties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active warranties</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeWarranties.map((warranty) => (
                  <div
                    key={warranty.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{warranty.serviceName}</h4>
                      {warranty.warrantyDaysLeft > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {warranty.warrantyDaysLeft} days left
                        </Badge>
                      )}
                    </div>
                    {warranty.technicianName && (
                      <p className="text-sm text-gray-600 mb-1">
                        Technician: {warranty.technicianName}
                      </p>
                    )}
                    {warranty.expiresAt && (
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(warranty.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Open Complaints / Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Open Complaints / Tickets</CardTitle>
                <CardDescription>Issues that need attention</CardDescription>
              </div>
              <Link href="/dashboard/complaints">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {openComplaints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                <p>No open complaints</p>
                <p className="text-xs mt-1">All issues resolved!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openComplaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/dashboard/complaints/${complaint.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors border-red-200 bg-red-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{complaint.bookingNumber}</h4>
                          <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{complaint.issueType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </div>
              <Link href="/dashboard/payments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No payment history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{payment.type}</h4>
                          <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications & Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>Stay updated with your services</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {stats.unreadNotifications > 0 && (
                <Badge className="bg-red-500 text-white">{stats.unreadNotifications} new</Badge>
              )}
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    !notification.read ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className={`w-5 h-5 mt-0.5 ${!notification.read ? "text-blue-600" : "text-gray-400"}`} />
                    <div className="flex-1">
                      <h4 className={`font-medium ${!notification.read ? "text-blue-900" : "text-gray-900"}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

