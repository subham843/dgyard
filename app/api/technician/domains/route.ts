import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all active service domains for technician
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active service domains directly
    const serviceDomains = await prisma.serviceDomain.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        active: true,
        order: true,
      },
      orderBy: [
        { order: "asc" },
        { title: "asc" },
      ],
    });

    return NextResponse.json({ serviceDomains });
  } catch (error: any) {
    console.error("Error fetching service domains:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch service domains" },
      { status: 500 }
    );
  }
}








