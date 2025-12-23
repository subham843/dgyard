/**
 * Warranty Holds API
 * 
 * List warranty holds for technician or dealer
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTechnicianWarrantyHolds } from "@/lib/services/warranty-hold";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "technician" or "dealer"
    const status = searchParams.get("status"); // Optional filter

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let warrantyHolds;

    if (role === "technician" || user.role === "TECHNICIAN") {
      // Get technician's warranty holds
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });

      if (!technician) {
        return NextResponse.json(
          { error: "Technician profile not found" },
          { status: 404 }
        );
      }

      warrantyHolds = await getTechnicianWarrantyHolds(technician.id);

      // Filter by status if provided
      if (status) {
        warrantyHolds = warrantyHolds.filter((hold) => hold.status === status);
      }
    } else if (role === "dealer" || user.role === "DEALER") {
      // Get dealer's warranty holds (for their jobs)
      const where: any = { dealerId: session.user.id };
      if (status) {
        where.status = status;
      }

      warrantyHolds = await prisma.warrantyHold.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "ADMIN") {
      // Admins see all warranty holds
      const where: any = {};
      if (status) {
        where.status = status;
      }

      warrantyHolds = await prisma.warrantyHold.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ warrantyHolds });
  } catch (error: any) {
    console.error("Error fetching warranty holds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch warranty holds" },
      { status: 500 }
    );
  }
}





