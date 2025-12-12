"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, Eye, Plus, Clock } from "lucide-react";
import Link from "next/link";

const serviceLabels: Record<string, string> = {
  INSTALLATION: "Installation",
  NETWORKING: "Networking",
  DIGITAL_MARKETING: "Digital Marketing",
  MAINTENANCE: "Maintenance",
  CONSULTATION: "Consultation",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function BookingManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchBookings();
  }, [session]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your service bookings</p>
        </div>
        <Button asChild style={{ backgroundColor: '#3A59FF' }}>
          <Link href="/services/book">
            <Plus className="w-4 h-4 mr-2" />
            Book New Service
          </Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No bookings yet</h2>
          <p className="text-gray-600 mb-6">Book a service to get started</p>
          <Button asChild style={{ backgroundColor: '#3A59FF' }}>
            <Link href="/services/book">Book a Service</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg p-6 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold">Booking #{booking.bookingNumber}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.createdAt)}
                    </div>
                    <div>{serviceLabels[booking.serviceType] || booking.serviceType}</div>
                    {booking.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Scheduled: {formatDate(booking.scheduledAt)}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="mt-4 md:mt-0">
                  <Link href={`/bookings/${booking.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-1">Address</div>
                <div className="text-gray-900">
                  {booking.address}, {booking.city}, {booking.state} - {booking.pincode}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

