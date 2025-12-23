"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Complaint {
  id: string;
  bookingNumber: string;
  issueType: string;
  status: string;
  description?: string;
  createdAt: string;
}

export function ComplaintsList() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings?requestType=COMPLAINT");
      const data = await response.json();
      
      if (response.ok) {
        setComplaints(data.bookings || []);
      } else {
        toast.error("Failed to load complaints");
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      RESOLVED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    if (status === "RESOLVED" || status === "CLOSED") return CheckCircle2;
    if (status === "CANCELLED") return XCircle;
    return Clock;
  };

  const filteredComplaints = complaints.filter((complaint) => {
    if (filter === "all") return true;
    if (filter === "open") return ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(complaint.status);
    if (filter === "resolved") return ["RESOLVED", "CLOSED"].includes(complaint.status);
    return complaint.status === filter;
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Complaints</h1>
            <p className="text-gray-600">Track your service complaints and support tickets</p>
          </div>
          <Link href="/dashboard/complaints/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Raise Complaint
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Complaints</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't raised any complaints yet"
                : `No ${filter} complaints found`}
            </p>
            <Link href="/dashboard/complaints/new">
              <Button>Raise a Complaint</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => {
            const StatusIcon = getStatusIcon(complaint.status);
            return (
              <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{complaint.bookingNumber}</CardTitle>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base font-medium">
                        {complaint.issueType}
                      </CardDescription>
                      {complaint.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {complaint.description}
                        </p>
                      )}
                    </div>
                    <StatusIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Created: {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/dashboard/complaints/${complaint.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
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





