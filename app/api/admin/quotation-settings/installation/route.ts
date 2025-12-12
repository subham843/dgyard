import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const installations = await prisma.quotationInstallation.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ installations });
  } catch (error) {
    console.error("Error fetching installations:", error);
    return NextResponse.json(
      { error: "Failed to fetch installations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, maxCableLength, ratePerCamera } = body;

    if (!categoryId || !maxCableLength || !ratePerCamera) {
      return NextResponse.json(
        { error: "Category, Max Cable Length, and Rate Per Camera are required" },
        { status: 400 }
      );
    }

    const installation = await prisma.quotationInstallation.create({
      data: {
        categoryId,
        maxCableLength: parseFloat(maxCableLength),
        ratePerCamera: parseFloat(ratePerCamera),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ installation }, { status: 201 });
  } catch (error) {
    console.error("Error creating installation:", error);
    return NextResponse.json(
      { error: "Failed to create installation" },
      { status: 500 }
    );
  }
}

