import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Get dealer ID from dealer table
    const dealerId = dealer.id;

    // 1. Total Jobs Posted
    const totalJobsPosted = await prisma.jobPost.count({
      where: { dealerId: session.user.id },
    });

    // 2. Active Service Jobs
    const activeServiceJobs = await prisma.jobPost.count({
      where: {
        dealerId: session.user.id,
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
      },
    });

    // 3. Open Bidding Jobs (PENDING jobs that are not yet assigned to any technician)
    const openBiddingJobs = await prisma.jobPost.count({
      where: {
        dealerId: session.user.id,
        status: "PENDING",
        assignedTechnicianId: null,
      },
    });

    // 4. Products Live (Count)
    // Note: Assuming products are linked to dealer through a dealerId field
    // You may need to add this field to Product model or use a different relation
    const productsLive = await prisma.product.count({
      where: {
        active: true,
        // Add dealerId filter when you add the field to Product model
        // dealerId: dealerId,
      },
    });

    // 5. Today / Monthly Sales (Service + Product)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today Service Payments
    const todayServicePayments = await prisma.jobPayment.aggregate({
      where: {
        dealerId: session.user.id,
        paymentType: "SERVICE_PAYMENT",
        status: "RELEASED",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    // Monthly Service Payments
    const monthlyServicePayments = await prisma.jobPayment.aggregate({
      where: {
        dealerId: session.user.id,
        paymentType: "SERVICE_PAYMENT",
        status: "RELEASED",
        createdAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // Today Product Orders (assuming orders are linked to dealer)
    const todayProductOrders = await prisma.order.aggregate({
      where: {
        // Add dealerId filter when you add the field to Order model
        paymentStatus: "PAID",
        createdAt: { gte: today },
      },
      _sum: { total: true },
    });

    // Monthly Product Orders
    const monthlyProductOrders = await prisma.order.aggregate({
      where: {
        // Add dealerId filter when you add the field to Order model
        paymentStatus: "PAID",
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    });

    const todaySales = (todayServicePayments._sum.amount || 0) + (todayProductOrders._sum.total || 0);
    const monthlySales = (monthlyServicePayments._sum.amount || 0) + (monthlyProductOrders._sum.total || 0);

    // 6. Pending Payments
    const pendingPayments = await prisma.jobPayment.count({
      where: {
        dealerId: session.user.id,
        status: "PENDING",
      },
    });

    // 7. Active Warranties
    const activeWarranties = await prisma.warranty.count({
      where: {
        job: {
          dealerId: session.user.id,
        },
        status: { in: ["ACTIVE", "ISSUE_REPORTED", "REWORK_IN_PROGRESS"] },
      },
    });

    // 8. Open Complaints
    const openComplaints = await prisma.dispute.count({
      where: {
        job: {
          dealerId: session.user.id,
        },
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    // 9. Low Stock Alerts
    // Assuming low stock threshold is 10 (you can make this configurable)
    const lowStockThreshold = 10;
    const lowStockAlerts = await prisma.product.count({
      where: {
        active: true,
        stock: { lte: lowStockThreshold },
        // Add dealerId filter when you add the field to Product model
        // dealerId: dealerId,
      },
    });

    return NextResponse.json({
      totalJobsPosted,
      activeServiceJobs,
      openBiddingJobs,
      productsLive,
      todaySales,
      monthlySales,
      pendingPayments,
      activeWarranties,
      openComplaints,
      lowStockAlerts,
    });
  } catch (error: any) {
    console.error("Error fetching dealer dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}




