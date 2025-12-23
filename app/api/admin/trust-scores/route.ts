import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const users: any[] = [];

    // Fetch dealers
    if (!userType || userType === "all" || userType === "DEALER") {
      const where: any = {};
      
      if (status && status !== "all") {
        where.trustScoreStatus = status;
      }

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { businessName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const dealers = await prisma.dealer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      dealers.forEach((dealer) => {
        users.push({
          id: dealer.id,
          userId: dealer.userId,
          userType: "DEALER",
          trustScore: dealer.trustScore,
          trustScoreStatus: dealer.trustScoreStatus,
          lastTrustScoreUpdate: dealer.lastTrustScoreUpdate,
          user: dealer.user,
          profile: {
            fullName: dealer.fullName,
            businessName: dealer.businessName,
          },
        });
      });
    }

    // Fetch technicians
    if (!userType || userType === "all" || userType === "TECHNICIAN") {
      const where: any = {};
      
      if (status && status !== "all") {
        where.trustScoreStatus = status;
      }

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const technicians = await prisma.technician.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      technicians.forEach((technician) => {
        users.push({
          id: technician.id,
          userId: technician.userId,
          userType: "TECHNICIAN",
          trustScore: technician.trustScore,
          trustScoreStatus: technician.trustScoreStatus,
          lastTrustScoreUpdate: technician.lastTrustScoreUpdate,
          user: technician.user,
          profile: {
            fullName: technician.fullName,
          },
        });
      });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching trust scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch trust scores", details: error.message },
      { status: 500 }
    );
  }
}




