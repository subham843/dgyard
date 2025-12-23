import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDealerTrustScore, calculateTechnicianTrustScore, calculateAverageRating } from "@/lib/ratings";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};
    
    if (role && role !== "all") {
      // Map CUSTOMER to USER role
      const roleMap: Record<string, string> = {
        "CUSTOMER": "USER",
        "DEALER": "DEALER",
        "TECHNICIAN": "TECHNICIAN",
      };
      where.role = roleMap[role] || role;
    }
    
    const statusValue = status && status !== "all" ? (status === "ACTIVE" ? "APPROVED" : status) : null;
    
    // Handle search conditions
    if (search) {
      const searchConditions: any[] = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
      
      // Add technician search condition
      if (!role || role === "all" || role === "TECHNICIAN") {
        searchConditions.push({
          technicianProfile: {
            fullName: { contains: search, mode: "insensitive" },
          },
        });
      }
      
      // Add dealer search condition
      if (!role || role === "all" || role === "DEALER") {
        searchConditions.push({
          dealer: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { businessName: { contains: search, mode: "insensitive" } },
            ],
          },
        });
      }
      
      where.OR = searchConditions;
      
      // Apply status filter with AND if both search and status are present
      if (statusValue) {
        const statusConditions: any[] = [];
        if (role === "DEALER") {
          statusConditions.push({ dealer: { accountStatus: statusValue } });
        } else if (role === "TECHNICIAN") {
          statusConditions.push({ technicianProfile: { accountStatus: statusValue } });
        }
        
        if (statusConditions.length > 0) {
          where.AND = [
            { OR: where.OR },
            ...statusConditions,
          ];
          delete where.OR;
        }
      }
    } else if (statusValue) {
      // Only status filter, no search
      if (role === "DEALER") {
        where.dealer = {
          accountStatus: statusValue,
        };
      } else if (role === "TECHNICIAN") {
        where.technicianProfile = {
          accountStatus: statusValue,
        };
      }
    }


    // Fetch users with related data
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        dealer: {
          select: {
            id: true,
            fullName: true,
            businessName: true,
            email: true,
            mobile: true,
            accountStatus: true,
            isKycCompleted: true,
          },
        },
        technicianProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
            accountStatus: true,
            isKycCompleted: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Get stats based on role filter
    const statsWhere: any = role && role !== "all" ? { role: role === "CUSTOMER" ? "USER" : role } : {};
    
    const [total, active, pending, suspended, pendingKYC] = await Promise.all([
      prisma.user.count({ where: statsWhere }),
      prisma.user.count({
        where: {
          ...statsWhere,
          OR: [
            { dealer: { accountStatus: "APPROVED" } },
            { technicianProfile: { accountStatus: "APPROVED" } },
            { role: "USER" },
            { role: "ADMIN" },
          ],
        },
      }),
      prisma.user.count({
        where: {
          ...statsWhere,
          OR: [
            { dealer: { accountStatus: "PENDING_APPROVAL" } },
            { technicianProfile: { accountStatus: "PENDING_APPROVAL" } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          ...statsWhere,
          OR: [
            { dealer: { accountStatus: "SUSPENDED" } },
            { technicianProfile: { accountStatus: "SUSPENDED" } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          ...statsWhere,
          OR: [
            { dealer: { isKycCompleted: false } },
            { technicianProfile: { isKycCompleted: false } },
          ],
        },
      }),
    ]);

    // Calculate trust scores and ratings for each user
    const usersWithScores = await Promise.all(
      users.map(async (u) => {
        let trustScore: number | undefined = undefined;
        let averageRating: number | undefined = undefined;
        let totalReviews: number = 0;

        try {
          if (u.role === "DEALER") {
            trustScore = await calculateDealerTrustScore(u.id);
            const ratingData = await calculateAverageRating(u.id, "DEALER");
            averageRating = ratingData.averageRating;
            totalReviews = ratingData.totalReviews;
          } else if (u.role === "TECHNICIAN" && u.technicianProfile?.id) {
            // Use technician ID directly from technicianProfile
            trustScore = await calculateTechnicianTrustScore(u.technicianProfile.id);
            const ratingData = await calculateAverageRating(u.id, "TECHNICIAN");
            averageRating = ratingData.averageRating;
            totalReviews = ratingData.totalReviews;
          }
        } catch (scoreError) {
          console.error(`Error calculating trust score for user ${u.id}:`, scoreError);
          // Continue without trust score if calculation fails
        }

        // Get name from appropriate source
        let displayName = u.name || "";
        if (u.role === "TECHNICIAN" && u.technicianProfile?.fullName) {
          displayName = u.technicianProfile.fullName;
        } else if (u.role === "DEALER" && u.dealer) {
          displayName = u.dealer.businessName || u.dealer.fullName || "";
        }
        
        // Get email and phone from appropriate source
        let displayEmail = u.email;
        let displayPhone = u.phone || "";
        if (u.role === "TECHNICIAN" && u.technicianProfile) {
          displayEmail = u.technicianProfile.email || u.email;
          displayPhone = u.technicianProfile.mobile || u.phone || "";
        } else if (u.role === "DEALER" && u.dealer) {
          displayEmail = u.dealer.email || u.email;
          displayPhone = u.dealer.mobile || u.phone || "";
        }

        return {
          id: u.id,
          name: displayName,
          email: displayEmail,
          phone: displayPhone,
          role: u.role,
          status: u.dealer?.accountStatus || u.technicianProfile?.accountStatus || "ACTIVE",
          kycStatus: u.dealer?.isKycCompleted || u.technicianProfile?.isKycCompleted
            ? "VERIFIED"
            : u.role === "DEALER" || u.role === "TECHNICIAN"
            ? "PENDING"
            : undefined,
          trustScore: trustScore,
          averageRating: averageRating,
          totalReviews: totalReviews,
          createdAt: u.createdAt,
          lastLogin: undefined,
          address: undefined,
        };
      })
    );

    return NextResponse.json({
      users: usersWithScores,
      stats: {
        total,
        active,
        pending,
        suspended,
        pendingKYC,
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch users", 
        details: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
