import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalBookings,
      orders,
      totalTechnicians,
      totalDealers,
      totalJobs,
      pendingTechnicians,
      pendingDealers,
      approvedTechnicians,
      approvedDealers,
      jobsByStatus,
      techniciansByStatus,
      dealersByStatus,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.order.findMany({
        where: { paymentStatus: "PAID" },
        select: { total: true },
      }),
      prisma.technician.count(),
      prisma.dealer.count(),
      prisma.jobPost.count(),
      prisma.technician.count({
        where: { accountStatus: "PENDING_APPROVAL" },
      }),
      prisma.dealer.count({
        where: { accountStatus: "PENDING_APPROVAL" },
      }),
      prisma.technician.count({
        where: { accountStatus: "APPROVED" },
      }),
      prisma.dealer.count({
        where: { accountStatus: "APPROVED" },
      }),
      prisma.jobPost.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.technician.groupBy({
        by: ["accountStatus"],
        _count: { id: true },
      }),
      prisma.dealer.groupBy({
        by: ["accountStatus"],
        _count: { id: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const pendingOrders = await prisma.order.count({
      where: { status: "PENDING" },
    });

    // Calculate job statistics
    const jobsPending = jobsByStatus.find((s) => s.status === "PENDING")?._count.id || 0;
    const jobsAssigned = jobsByStatus.find((s) => s.status === "ASSIGNED")?._count.id || 0;
    const jobsInProgress = jobsByStatus.find((s) => s.status === "IN_PROGRESS")?._count.id || 0;
    const jobsCompleted = jobsByStatus.find((s) => s.status === "COMPLETED")?._count.id || 0;

    // Calculate active technicians (approved and online)
    const activeTechnicians = await prisma.technician.count({
      where: {
        accountStatus: "APPROVED",
        isOnline: true,
      },
    });

    // Calculate dealers with low free trial
    const dealersLowTrial = await prisma.dealer.count({
      where: {
        accountStatus: "APPROVED",
        OR: [
          { freeTrialServices: { lte: 3 } },
          { freeTrialServices: null },
        ],
      },
    });

    // Get recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentJobs = await prisma.jobPost.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return NextResponse.json({
      // Existing stats
      totalProducts,
      totalOrders,
      totalUsers,
      totalBookings,
      totalRevenue,
      pendingOrders,
      
      // Technician stats
      totalTechnicians,
      pendingTechnicians,
      approvedTechnicians,
      activeTechnicians,
      
      // Dealer stats
      totalDealers,
      pendingDealers,
      approvedDealers,
      dealersLowTrial,
      
      // Jobs stats
      totalJobs,
      jobsPending,
      jobsAssigned,
      jobsInProgress,
      jobsCompleted,
      recentJobs,
      
      // Status breakdowns
      jobsByStatus: jobsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      techniciansByStatus: techniciansByStatus.map((s) => ({
        status: s.accountStatus,
        count: s._count.id,
      })),
      dealersByStatus: dealersByStatus.map((s) => ({
        status: s.accountStatus,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}




















