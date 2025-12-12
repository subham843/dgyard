import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log(`[API /api/user/profile] ${new Date().toISOString()} - GET request received`);
    const session = await getServerSession(authOptions);
    console.log(`[API /api/user/profile] Session exists: ${!!session}, User ID: ${session?.user?.id}, Email: ${session?.user?.email}`);
    
    if (!session?.user?.id) {
      console.log(`[API /api/user/profile] ⚠️ No session or user ID, returning 401`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`[API /api/user/profile] Fetching user from database with ID: ${session.user.id}`);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        image: true,
      },
    });

    console.log(`[API /api/user/profile] ✅ User found: ${user?.name || user?.email || 'Unknown'}`);
    return NextResponse.json({ user });
  } catch (error) {
    console.log(`[API /api/user/profile] ❌ Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone,
        phoneVerified: data.phoneVerified !== undefined ? data.phoneVerified : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        image: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}




















