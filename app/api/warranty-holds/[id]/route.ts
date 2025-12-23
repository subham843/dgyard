/**
 * Warranty Hold Management API
 * 
 * Handles warranty hold operations (freeze, release, forfeit)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  freezeWarrantyHold,
  unfreezeWarrantyHold,
  releaseWarrantyHold,
  forfeitWarrantyHold,
  getWarrantyHold,
} from "@/lib/services/warranty-hold";

/**
 * Get warranty hold details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: warrantyHoldId } = await params;

    const warrantyHold = await getWarrantyHold(warrantyHoldId);

    if (!warrantyHold) {
      return NextResponse.json(
        { error: "Warranty hold not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Technicians can only view their own holds
    // Dealers can view holds for their jobs
    // Admins can view all
    if (user.role === "TECHNICIAN") {
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });
      if (technician?.id !== warrantyHold.technicianId) {
        return NextResponse.json(
          { error: "Unauthorized to view this warranty hold" },
          { status: 403 }
        );
      }
    } else if (user.role === "DEALER") {
      if (warrantyHold.dealerId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized to view this warranty hold" },
          { status: 403 }
        );
      }
    } else if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ warrantyHold });
  } catch (error: any) {
    console.error("Error fetching warranty hold:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch warranty hold" },
      { status: 500 }
    );
  }
}

/**
 * Freeze warranty hold (on complaint)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: warrantyHoldId } = await params;
    const data = await request.json();
    const { action, reason } = data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "freeze") {
      // Dealers, technicians, or admins can freeze (on complaint)
      if (user.role === "DEALER" || user.role === "TECHNICIAN" || user.role === "ADMIN") {
        const result = await freezeWarrantyHold({
          warrantyHoldId,
          reason: reason || "Complaint raised",
          frozenBy: session.user.id,
          userRole: user.role,
        });

        return NextResponse.json({
          success: true,
          warrantyHold: result,
          message: "Warranty hold frozen",
        });
      }
    } else if (action === "unfreeze") {
      // Only admins or technicians (after resolving complaint) can unfreeze
      if (user.role === "ADMIN" || user.role === "TECHNICIAN") {
        const result = await unfreezeWarrantyHold(warrantyHoldId, session.user.id, user.role);

        return NextResponse.json({
          success: true,
          warrantyHold: result,
          message: "Warranty hold unfrozen",
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action or unauthorized" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error managing warranty hold:", error);
    return NextResponse.json(
      { error: error.message || "Failed to manage warranty hold" },
      { status: 500 }
    );
  }
}

/**
 * Release or forfeit warranty hold (admin only or auto)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: warrantyHoldId } = await params;
    const data = await request.json();
    const { action, reason } = data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can release or forfeit warranty holds" },
        { status: 403 }
      );
    }

    const warrantyHold = await getWarrantyHold(warrantyHoldId);
    if (!warrantyHold) {
      return NextResponse.json(
        { error: "Warranty hold not found" },
        { status: 404 }
      );
    }

    if (action === "release") {
      // releaseWarrantyHold service function now handles ledger entries and notifications
      const result = await releaseWarrantyHold({
        warrantyHoldId,
        reason: reason || "Admin release",
        releasedBy: session.user.id,
        userRole: "ADMIN",
      });

      return NextResponse.json({
        success: true,
        warrantyHold: result,
        message: "Warranty hold released",
      });
    } else if (action === "forfeit") {
      const result = await forfeitWarrantyHold({
        warrantyHoldId,
        reason: reason || "Admin forfeit",
        forfeitedBy: session.user.id,
        userRole: "ADMIN",
      });

      // TODO: Handle forfeit - refund to dealer or keep in platform
      // For now, move to DEALER_RECEIVABLE (refund scenario)

      return NextResponse.json({
        success: true,
        warrantyHold: result,
        message: "Warranty hold forfeited",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating warranty hold:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update warranty hold" },
      { status: 500 }
    );
  }
}

