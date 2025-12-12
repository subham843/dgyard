import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, maxCableLength, ratePerCamera } = body;

    const installation = await prisma.quotationInstallation.update({
      where: { id: params.id },
      data: {
        ...(categoryId && { categoryId }),
        ...(maxCableLength && { maxCableLength: parseFloat(maxCableLength) }),
        ...(ratePerCamera && { ratePerCamera: parseFloat(ratePerCamera) }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ installation });
  } catch (error) {
    console.error("Error updating installation:", error);
    return NextResponse.json(
      { error: "Failed to update installation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.quotationInstallation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting installation:", error);
    return NextResponse.json(
      { error: "Failed to delete installation" },
      { status: 500 }
    );
  }
}

