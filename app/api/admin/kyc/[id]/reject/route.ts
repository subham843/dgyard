import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true, id: true, name: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // Update KYC status using MongoDB native client
    const { MongoClient, ObjectId } = await import("mongodb");
    const client = new MongoClient(process.env.DATABASE_URL!);
    
    try {
      await client.connect();
      const db = client.db();
      
      // Update all KYC statuses to REJECTED with reason
      await db.collection("Technician").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            kycAadhaarStatus: "REJECTED",
            kycPanStatus: "REJECTED",
            kycAddressStatus: "REJECTED",
            kycLivePhotoStatus: "REJECTED",
            kycAadhaarRejectionReason: reason,
            kycPanRejectionReason: reason,
            kycAddressRejectionReason: reason,
            kycLivePhotoRejectionReason: reason,
            isKycCompleted: false,
            kycReviewedAt: new Date(),
            kycReviewedBy: user.id,
          },
        }
      );
      
      // Also update in Prisma
      await prisma.technician.update({
        where: { id },
        data: { isKycCompleted: false },
      });
    } finally {
      await client.close();
    }

    return NextResponse.json({ success: true, message: "KYC rejected" });
  } catch (error: any) {
    console.error("Error rejecting KYC:", error);
    return NextResponse.json(
      { error: "Failed to reject KYC", details: error.message },
      { status: 500 }
    );
  }
}

