import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all stats in parallel
    const [
      totalDealers,
      totalTechnicians,
      totalCustomers,
      activeServiceJobs,
      openBiddingJobs,
      jobsPending,
      jobsInProgress,
      jobsCompleted,
      ordersToday,
      ordersMonth,
      pendingOrders,
      totalGMVData,
      pendingPayments,
      holdsAmount,
      activeWarranties,
      openComplaints,
      openDisputes,
      lowStockProducts,
    ] = await Promise.all([
      // User counts - User model doesn't have status field, count by role only
      // Note: CUSTOMER role doesn't exist, using USER role for customers
      prisma.user.count({ where: { role: "DEALER" } }).catch(() => 0),
      prisma.user.count({ where: { role: "TECHNICIAN" } }).catch(() => 0),
      prisma.user.count({ where: { role: "USER" } }).catch(() => 0),

      // Service Jobs - using correct JobStatus enum values
      prisma.jobPost.count({ 
        where: { 
          status: { in: ["ASSIGNED", "IN_PROGRESS", "PENDING"] } 
        } 
      }).catch(() => 0),
      prisma.jobPost.count({ 
        where: { 
          status: "PENDING",
          assignedTechnicianId: null, // Open for bidding
        } 
      }).catch(() => 0),
      prisma.jobPost.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.jobPost.count({ where: { status: "IN_PROGRESS" } }).catch(() => 0),
      prisma.jobPost.count({ where: { status: "COMPLETED" } }).catch(() => 0),

      // Orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }).catch(() => 0),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).catch(() => 0),
      prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }).catch(() => 0),

      // Financial - GMV
      prisma.$transaction(async (tx) => {
        const serviceGMV = await tx.jobPost.aggregate({
          where: { status: "COMPLETED" },
          _sum: { finalPrice: true },
        });

        const productGMV = await tx.order.aggregate({
          where: { status: { in: ["DELIVERED", "CONFIRMED"] } },
          _sum: { total: true },
        });

        return {
          service: Number(serviceGMV._sum.finalPrice || 0),
          product: Number(productGMV._sum.total || 0),
        };
      }).catch(() => ({ service: 0, product: 0 })),

      // Pending payments
      prisma.jobPayment.count({ 
        where: { status: "PENDING" } 
      }).catch(() => 0),

      // Holds amount (from WarrantyHold)
      prisma.warrantyHold.aggregate({
        where: { status: "LOCKED" },
        _sum: { holdAmount: true },
      }).then((r) => Number(r._sum.holdAmount || 0)).catch(() => 0),

      // Warranties
      prisma.warranty.count({
        where: {
          status: "ACTIVE",
          endDate: { gt: new Date() },
        },
      }).catch(() => 0),

      // Complaints - using Warranty model with ISSUE_REPORTED status
      prisma.warranty.count({
        where: { 
          status: { in: ["ISSUE_REPORTED", "REWORK_IN_PROGRESS"] } 
        },
      }).catch(() => 0),

      // Disputes - using correct DisputeStatus enum values
      prisma.dispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      }).catch(() => 0),

      // Low stock - Product model uses 'active' field, not 'status'
      prisma.product.count({
        where: {
          stock: { lte: 10 },
          active: true,
        },
      }).catch(() => 0),
    ]);

    const serviceGMV = totalGMVData.service;
    const productGMV = totalGMVData.product;
    const totalGMV = serviceGMV + productGMV;

    // Calculate system health
    let systemHealth: "healthy" | "warning" | "critical" = "healthy";
    if (openDisputes > 10 || holdsAmount > 1000000) {
      systemHealth = "critical";
    } else if (openDisputes > 5 || pendingPayments > 50) {
      systemHealth = "warning";
    }

    // Calculate risk alerts
    const riskAlerts = (openDisputes > 5 ? 1 : 0) + 
                      (holdsAmount > 500000 ? 1 : 0) +
                      (pendingPayments > 100 ? 1 : 0);

    // Recent activity (simplified - you might want to create an activity log table)
    const recentActivity: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      severity: "info" | "warning" | "error";
    }> = [];

    if (openDisputes > 0) {
      recentActivity.push({
        id: "1",
        type: "dispute",
        message: `${openDisputes} open dispute(s) require attention`,
        time: "Just now",
        severity: "error",
      });
    }

    if (pendingPayments > 50) {
      recentActivity.push({
        id: "2",
        type: "payment",
        message: `${pendingPayments} pending payments`,
        time: "5 mins ago",
        severity: "warning",
      });
    }

    if (jobsPending > 10) {
      recentActivity.push({
        id: "3",
        type: "job",
        message: `${jobsPending} jobs pending assignment`,
        time: "10 mins ago",
        severity: "info",
      });
    }

    return NextResponse.json({
      totalDealers,
      totalTechnicians,
      totalCustomers,
      activeServiceJobs,
      openBiddingJobs,
      jobsPending,
      jobsInProgress,
      jobsCompleted,
      ordersToday,
      ordersMonth,
      pendingOrders,
      totalGMV,
      serviceGMV,
      productGMV,
      pendingPayments,
      holdsAmount,
      activeWarranties,
      openComplaints,
      openDisputes,
      lowStockCount: lowStockProducts,
      riskAlerts,
      systemHealth,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}

