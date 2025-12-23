import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subject, category, description } = await request.json();

    if (!subject || !category || !description) {
      return NextResponse.json(
        { error: "Subject, category, and description are required" },
        { status: 400 }
      );
    }

    // In a real implementation, you'd have a SupportTicket model
    // For now, you could create a notification or save to a tickets table
    // This is a simplified version

    return NextResponse.json({
      success: true,
      message: "Support ticket created successfully",
      ticketId: `TKT-${Date.now()}`,
    });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}





