import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Only technicians can upload photos" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const photos = formData.getAll("photos") as File[];
    const photoType = (formData.get("type") as string) || "after"; // "before" or "after"

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Upload photos
    const uploadedUrls: string[] = [];
    const uploadDir = join(process.cwd(), "public", "uploads", "jobs", id);

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const photo of photos) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${photo.name}`;
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      uploadedUrls.push(`/uploads/jobs/${id}/${filename}`);
    }

    // Update job with photo URLs
    const currentBeforePhotos = (job as any).beforePhotos || [];
    const currentAfterPhotos = (job as any).afterPhotos || [];

    const updateData: any = {};
    if (photoType === "before") {
      updateData.beforePhotos = [...currentBeforePhotos, ...uploadedUrls];
    } else {
      updateData.afterPhotos = [...currentAfterPhotos, ...uploadedUrls];
    }

    // Note: This assumes you have beforePhotos and afterPhotos fields in JobPost model
    // If not, you might need to store them in a separate table or JSON field
    await prisma.jobPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${photoType === "before" ? "Before" : "After"} photos uploaded successfully`,
    });
  } catch (error: any) {
    console.error("Error uploading photos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photos" },
      { status: 500 }
    );
  }
}






