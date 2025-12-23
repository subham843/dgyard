"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Star,
  MessageSquare,
  Camera,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Service {
  id: string;
  bookingNumber: string;
  serviceType: string;
  status: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  scheduledAt?: string;
  technician?: {
    name: string;
    phone: string;
    rating?: number;
  };
  createdAt: string;
  completedAt?: string;
  photos?: string[];
  otp?: string;
  canRate?: boolean;
}

export function ServiceTrackingList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchServices();
  }, [filter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === "all" ? "" : filter;
      const url = statusFilter
        ? `/api/bookings?status=${statusFilter}`
        : "/api/bookings";
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.bookings || []);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      IN_PROGRESS: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "COMPLETED") return CheckCircle2;
    if (status === "CANCELLED") return XCircle;
    return Clock;
  };

  const filteredServices = services.filter((service) => {
    if (filter === "all") return true;
    if (filter === "active") return ["PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS"].includes(service.status);
    if (filter === "completed") return service.status === "COMPLETED";
    return service.status === filter;
  });

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Services</h1>
        <p className="text-gray-600">Track and manage your service requests</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't booked any services yet"
                : `No ${filter} services found`}
            </p>
            <Link href="/services/book">
              <Button>Book a Service</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => {
            const StatusIcon = getStatusIcon(service.status);
            return (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{service.bookingNumber}</CardTitle>
                        <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                      </div>
                      <CardDescription className="text-base font-medium">
                        {service.serviceType}
                      </CardDescription>
                    </div>
                    <StatusIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {service.description && (
                      <div>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="text-gray-600">
                            {service.address}, {service.city}, {service.state}
                          </div>
                        </div>
                      </div>

                      {service.scheduledAt && (
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">Scheduled</div>
                            <div className="text-gray-600">
                              {new Date(service.scheduledAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {service.technician && (
                        <>
                          <div className="flex items-start gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="font-medium">Technician</div>
                              <div className="text-gray-600">{service.technician.name}</div>
                              {service.technician.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{service.technician.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="font-medium">Contact</div>
                              <a
                                href={`tel:${service.technician.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {service.technician.phone}
                              </a>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {service.otp && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-900">OTP for Completion</div>
                            <div className="text-blue-700 font-mono text-lg">{service.otp}</div>
                            <div className="text-xs text-blue-600 mt-1">
                              Share this OTP with the technician to complete the service
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {service.photos && service.photos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Camera className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Before/After Photos</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {service.photos.slice(0, 3).map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Service photo ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Link href={`/dashboard/services/${service.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {service.status === "COMPLETED" && service.canRate && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/services/${service.id}/rate`)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Rate Service
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





