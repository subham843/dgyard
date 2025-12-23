import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Save file (simplified - use your existing upload logic)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${technician.id}_${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = join(process.cwd(), "public", "uploads", "kyc", fileName);
    
    // Ensure directory exists
    const fs = require("fs");
    const dir = join(process.cwd(), "public", "uploads", "kyc");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/kyc/${fileName}`;

    // Save document URL to technician record using MongoDB's flexible schema
    // Build update object based on document type
    const updateData: Record<string, any> = {};
    
    switch (documentType) {
      case "aadhaar_front":
        updateData["kycAadhaarFront"] = fileUrl;
        updateData["kycAadhaarStatus"] = "PENDING";
        break;
      case "aadhaar_back":
        updateData["kycAadhaarBack"] = fileUrl;
        updateData["kycAadhaarStatus"] = "PENDING";
        break;
      case "pan":
        updateData["kycPanImage"] = fileUrl;
        updateData["kycPanStatus"] = "PENDING";
        break;
      case "address":
        updateData["kycAddressImage"] = fileUrl;
        updateData["kycAddressStatus"] = "PENDING";
        break;
      case "live_photo":
        updateData["kycLivePhotoImage"] = fileUrl;
        updateData["kycLivePhotoStatus"] = "PENDING";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid document type" },
          { status: 400 }
        );
    }

    // Use MongoDB native client for flexible schema updates
    const { MongoClient, ObjectId } = await import("mongodb");
    const client = new MongoClient(process.env.DATABASE_URL!);
    try {
      await client.connect();
      const db = client.db();
      await db.collection("Technician").updateOne(
        { _id: new ObjectId(technician.id) },
        { $set: updateData }
      );
    } finally {
      await client.close();
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: "Document uploaded successfully",
    });
  } catch (error: any) {
    console.error("Error uploading KYC document:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload document",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


