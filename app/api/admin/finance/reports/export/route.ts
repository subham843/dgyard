import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const format = searchParams.get("format") || "csv";
    const period = searchParams.get("period") || "month";
    const type = searchParams.get("type") || "revenue";

    // Calculate date range
    let start: Date;
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case "today":
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date();
        start.setMonth(start.getMonth() - 1);
    }

    // Fetch data based on type
    let data: any[] = [];
    let filename = "";

    if (type === "revenue") {
      // Export revenue data
      const serviceRevenue = await prisma.jobPost.findMany({
        where: {
          status: "COMPLETED",
          completedAt: { gte: start, lte: end },
        },
        select: {
          jobNumber: true,
          completedAt: true,
          finalPrice: true,
          dealerName: true,
        },
      });

      const productRevenue = await prisma.order.findMany({
        where: {
          status: { in: ["DELIVERED", "CONFIRMED"] },
          createdAt: { gte: start, lte: end },
        },
        select: {
          orderNumber: true,
          createdAt: true,
          total: true,
          user: { select: { name: true } },
        },
      });

      data = [
        ...serviceRevenue.map((job) => ({
          Type: "Service",
          Number: job.jobNumber,
          Date: job.completedAt?.toISOString().split("T")[0] || "",
          Amount: job.finalPrice || 0,
          Customer: job.dealerName,
        })),
        ...productRevenue.map((order) => ({
          Type: "Product",
          Number: order.orderNumber,
          Date: order.createdAt.toISOString().split("T")[0],
          Amount: order.total,
          Customer: order.user?.name || "Unknown",
        })),
      ];

      filename = `revenue-report-${period}.${format}`;
    }

    // Generate file based on format
    if (format === "csv") {
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => row[h] || "").join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else if (format === "json") {
      return NextResponse.json(data, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // For PDF/Excel, return JSON (client can use libraries to generate)
      return NextResponse.json({ data, format: "json" });
    }
  } catch (error: any) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report", details: error.message },
      { status: 500 }
    );
  }
}

