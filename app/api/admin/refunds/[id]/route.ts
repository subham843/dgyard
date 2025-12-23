import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/refunds/[id]
 * Approve or reject a refund request
 * Body: { action: "approve" | "reject", type: "order" | "booking", refundMethod?: string, notes?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { action, type, refundMethod, notes } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!type || !["order", "booking"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'order' or 'booking'" },
        { status: 400 }
      );
    }

    if (type === "order") {
      const order = await prisma.order.findUnique({
        where: { id: params.id },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      if (order.refundStatus === "NONE") {
        return NextResponse.json(
          { error: "No refund request found for this order" },
          { status: 400 }
        );
      }

      const updateData: any = {
        refundStatus: action === "approve" ? "APPROVED" : "REJECTED",
        refundApprovedAt: action === "approve" ? new Date() : null,
        refundMethod: action === "approve" && refundMethod ? refundMethod : order.refundMethod,
        adminNotes: notes || order.adminNotes,
      };

      // If approving, also approve cancellation if not already approved
      if (action === "approve" && order.cancelRequestedAt && !order.cancelApprovedAt) {
        updateData.cancelApprovedAt = new Date();
      }

      // If rejecting, update payment status back to PAID
      if (action === "reject" && order.paymentStatus === "REFUNDED") {
        updateData.paymentStatus = "PAID";
      }

      // If approving, update payment status to REFUNDED
      if (action === "approve") {
        updateData.paymentStatus = "REFUNDED";
        updateData.status = "REFUNDED";
      }

      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `Refund ${action === "approve" ? "approved" : "rejected"} successfully`,
        order: updatedOrder,
      });
    } else {
      // Booking
      const booking = await prisma.booking.findUnique({
        where: { id: params.id },
      });

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      if (booking.refundStatus === "NONE") {
        return NextResponse.json(
          { error: "No refund request found for this booking" },
          { status: 400 }
        );
      }

      const updateData: any = {
        refundStatus: action === "approve" ? "APPROVED" : "REJECTED",
        refundApprovedAt: action === "approve" ? new Date() : null,
        refundMethod: action === "approve" && refundMethod ? refundMethod : booking.refundMethod,
        adminNotes: notes || booking.adminNotes,
      };

      // If approving, also approve cancellation if not already approved
      if (action === "approve" && booking.cancelRequestedAt && !booking.cancelApprovedAt) {
        updateData.cancelApprovedAt = new Date();
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: params.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: `Refund ${action === "approve" ? "approved" : "rejected"} successfully`,
        booking: updatedBooking,
      });
    }
  } catch (error: any) {
    console.error("Update refund error:", error);
    return NextResponse.json(
      { error: "Failed to update refund request" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/refunds/[id]/complete
 * Mark refund as completed (after processing)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { type } = await request.json();

    if (!type || !["order", "booking"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'order' or 'booking'" },
        { status: 400 }
      );
    }

    if (type === "order") {
      const order = await prisma.order.findUnique({
        where: { id: params.id },
      });

      if (!order || order.refundStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Order not found or refund not approved" },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          refundStatus: "COMPLETED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Refund marked as completed",
        order: updatedOrder,
      });
    } else {
      const booking = await prisma.booking.findUnique({
        where: { id: params.id },
      });

      if (!booking || booking.refundStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Booking not found or refund not approved" },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: params.id },
        data: {
          refundStatus: "COMPLETED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Refund marked as completed",
        booking: updatedBooking,
      });
    }
  } catch (error: any) {
    console.error("Complete refund error:", error);
    return NextResponse.json(
      { error: "Failed to complete refund" },
      { status: 500 }
    );
  }
}





