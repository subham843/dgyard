"use client";

import { formatDate } from "@/lib/utils";
import { CheckCircle2, Calendar, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BookingConfirmationProps {
  booking: any;
}

const serviceLabels: Record<string, string> = {
  INSTALLATION: "Installation Services",
  NETWORKING: "Networking Solutions",
  DIGITAL_MARKETING: "Digital Marketing",
  MAINTENANCE: "Maintenance & Support",
  CONSULTATION: "Consultation",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your service booking has been received</p>
        </div>

        <div className="bg-white rounded-lg p-8 border border-gray-200 space-y-6">
          <div className="flex justify-between items-start pb-4 border-b">
            <div>
              <div className="text-sm text-gray-600 mb-1">Booking Number</div>
              <div className="text-2xl font-bold">{booking.bookingNumber}</div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[booking.status]}`}
            >
              {booking.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Service Type</div>
                <div className="text-gray-600">{serviceLabels[booking.serviceType] || booking.serviceType}</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Service Address</div>
                <div className="text-gray-600">
                  {booking.address}, {booking.city}, {booking.state} - {booking.pincode}
                </div>
              </div>
            </div>

            {booking.scheduledAt && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Scheduled Date</div>
                  <div className="text-gray-600">{formatDate(booking.scheduledAt)}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold mb-1">Contact</div>
                <div className="text-gray-600">{booking.phone}</div>
                <div className="text-gray-600">{booking.email}</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="font-semibold mb-2">Service Description</div>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.description}</div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-2">✅ Our team will contact you within 24 hours to confirm the details.</p>
              <p>✅ You will receive updates via email and SMS.</p>
            </div>
            <div className="flex gap-4">
              <Button asChild className="flex-1" style={{ backgroundColor: '#3A59FF' }}>
                <Link href="/bookings">View All Bookings</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/services">Book Another Service</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

