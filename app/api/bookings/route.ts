import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { sendNotification, sendNotificationsToUsers } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Parse scheduledAt if provided
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

    // Determine if it's a complaint
    const isComplaint = data.requestType === "COMPLAINT" || 
      (data.description && /complaint|problem|issue|broken|not working|fault|error/i.test(data.description));

    const booking = await prisma.booking.create({
      data: {
        serviceType: data.serviceType,
        requestType: data.requestType || (isComplaint ? "COMPLAINT" : "SERVICE_REQUEST"),
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        scheduledAt: scheduledAt,
        customerNotes: data.customerNotes || null,
        priority: data.priority || "NORMAL",
        quotationId: data.quotationId || null,
        bookingNumber,
        userId: session.user.id,
        status: "PENDING",
        aiSuggestedService: data.aiSuggestedService || null,
        aiConfidence: data.aiConfidence || null,
        photos: data.photos || [],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Create activity log
    await createActivityLog({
      bookingId: booking.id,
      userId: session.user.id,
      action: "created",
      description: `Booking created: ${booking.bookingNumber}`,
      newValue: {
        status: booking.status,
        serviceType: booking.serviceType,
        requestType: booking.requestType,
      },
    });

    // Send notifications
    try {
      // Notify customer
      await sendNotification({
        userId: session.user.id,
        bookingId: booking.id,
        type: "booking_created",
        title: "Booking Confirmed",
        message: `Your booking ${booking.bookingNumber} has been received and is pending review.`,
        channels: ["EMAIL", "IN_APP"],
        metadata: {
          bookingNumber: booking.bookingNumber,
          status: booking.status,
        },
      });

      // Notify admins
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await sendNotificationsToUsers(
          adminUsers.map((admin) => admin.id),
          {
            bookingId: booking.id,
            type: "new_booking",
            title: "New Booking Received",
            message: `New ${booking.requestType === "COMPLAINT" ? "complaint" : "service request"} received: ${booking.bookingNumber}`,
            channels: ["EMAIL", "IN_APP"],
            metadata: {
              bookingNumber: booking.bookingNumber,
              serviceType: booking.serviceType,
              requestType: booking.requestType,
            },
          }
        );
      }

      // Send booking confirmation email via queue
      const { emailQueue } = await import("@/lib/queue");
      const { getBookingConfirmationEmail } = await import("@/lib/email");
      
      const emailTemplate = getBookingConfirmationEmail(booking);
      await emailQueue.add("booking-confirmation", {
        to: booking.email || session.user.email || booking.user?.email,
        ...emailTemplate,
      });
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
      // Don't fail the booking if notifications fail
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

