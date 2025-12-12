import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Capture lead from Honey CTA clicks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { type, source, page, userId, context } = body;

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        userId: userId || session?.user?.id || null,
        source: source || "honey_chat",
        type: type || "general", // appointment, call, quote, general
        page: page || null,
        context: context || null,
        status: "NEW",
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get("user-agent") || null,
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      leadId: lead.id,
      message: "Lead captured successfully"
    });
  } catch (error: any) {
    console.error("Error capturing lead:", error);
    // Return success anyway so user experience isn't broken
    return NextResponse.json(
      { 
        success: true,
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 200 }
    );
  }
}












