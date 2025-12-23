"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Warranty {
  id: string;
  serviceName: string;
  warrantyDaysLeft: number;
  warrantyDays: number;
  technicianName?: string;
  technicianPhone?: string;
  expiresAt: string;
  completedAt: string;
  bookingNumber: string;
  status: string;
}

export function WarrantyList() {
  const [loading, setLoading] = useState(true);
  const [warranties, setWarranties] = useState<Warranty[]>([]);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/warranties");
      const data = await response.json();
      
      if (response.ok) {
        setWarranties(data.warranties || []);
      } else {
        toast.error("Failed to load warranties");
      }
    } catch (error) {
      console.error("Error fetching warranties:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const activeWarranties = warranties.filter((w) => w.status === "ACTIVE");
  const expiredWarranties = warranties.filter((w) => w.status === "EXPIRED");

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Warranties</h1>
            <p className="text-gray-600">View and manage your warranty coverage</p>
          </div>
          <Link href="/dashboard/complaints/new">
            <Button>
              <AlertCircle className="w-4 h-4 mr-2" />
              Raise Complaint
            </Button>
          </Link>
        </div>
      </div>

      {warranties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No warranties found</h3>
            <p className="text-gray-600 mb-4">
              You don't have any active warranties yet. Warranties are created when services are completed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeWarranties.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Active Warranties ({activeWarranties.length})
              </h2>
              <div className="space-y-4">
                {activeWarranties.map((warranty) => (
                  <Card key={warranty.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{warranty.serviceName}</CardTitle>
                          <CardDescription>{warranty.bookingNumber}</CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {warranty.warrantyDaysLeft} days left
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {warranty.technicianName && (
                          <div className="flex items-start gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="font-medium">Technician</div>
                              <div className="text-gray-600">{warranty.technicianName}</div>
                              {warranty.technicianPhone && (
                                <a
                                  href={`tel:${warranty.technicianPhone}`}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  {warranty.technicianPhone}
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">Expires On</div>
                            <div className="text-gray-600">
                              {new Date(warranty.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Link href={`/dashboard/complaints/new?warrantyId=${warranty.id}`}>
                          <Button variant="outline" size="sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Raise Service Complaint
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {expiredWarranties.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-400" />
                Expired Warranties ({expiredWarranties.length})
              </h2>
              <div className="space-y-4">
                {expiredWarranties.map((warranty) => (
                  <Card key={warranty.id} className="border-l-4 border-l-gray-300 opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{warranty.serviceName}</CardTitle>
                          <CardDescription>{warranty.bookingNumber}</CardDescription>
                        </div>
                        <Badge className="bg-gray-100 text-gray-600">Expired</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        Expired on {new Date(warranty.expiresAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





