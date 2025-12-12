import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Create audit request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          message: "Please login to use audit features",
          redirect: "/auth/signin"
        },
        { status: 401 }
      );
    }

    // Check profile completion and phone verification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "User not found",
          redirect: "/auth/signin"
        },
        { status: 401 }
      );
    }

    // Check profile completion
    const profileComplete = !!(user.name && user.email && user.phone);
    if (!profileComplete) {
      return NextResponse.json(
        { 
          error: "Profile incomplete",
          message: "Please complete your profile to use audit features",
          redirect: "/dashboard/profile?action=complete"
        },
        { status: 403 }
      );
    }

    // Check phone verification
    if (!user.phoneVerified) {
      return NextResponse.json(
        { 
          error: "Phone not verified",
          message: "Please verify your phone number to use audit features",
          redirect: "/dashboard/profile?action=verify-phone"
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const { type, websiteUrl, gbpName, gbpAddress, socialLinks } = body;

    // Validate required fields
    if (!websiteUrl && !gbpName) {
      return NextResponse.json(
        { error: "Please provide at least a website URL or Google Business name" },
        { status: 400 }
      );
    }

    // Prepare data object
    const auditData: any = {
      type: type || "public",
      status: "pending",
      websiteUrl: websiteUrl || null,
      gbpName: gbpName || null,
      gbpAddress: gbpAddress || null,
      socialLinks: socialLinks || {},
      metadata: {}
    };

    // Add userId (required now)
    auditData.userId = session.user.id;

    // Create audit request (public scan)
    let auditRequest;
    try {
      auditRequest = await prisma.auditRequest.create({
        data: auditData
      });
    } catch (dbError: any) {
      // Check if it's a Prisma model not found error or MongoDB collection doesn't exist
      const errorMessage = dbError.message || "";
      const isModelError = errorMessage.includes("Unknown model") || 
                          errorMessage.includes("does not exist") ||
                          dbError.code === "P2001" ||
                          errorMessage.includes("collection") && errorMessage.includes("does not exist");
      
      if (isModelError || process.env.NODE_ENV === "development") {
        console.warn("AuditRequest model may not be migrated yet. Error:", dbError.message);
        // Return mock response so the UI works, but log the issue
        return NextResponse.json({ 
          success: true, 
          auditId: "mock-audit-" + Date.now(),
          message: "Audit request received. Note: Please run 'npm run db:push' to migrate database schema.",
          mock: true
        });
      }
      throw dbError;
    }

    // TODO: Queue audit job (will be implemented with worker)
    // For now, return success with audit ID

    return NextResponse.json({ 
      success: true, 
      auditId: auditRequest.id,
      message: "Audit request created. Processing will begin shortly."
    });
  } catch (error: any) {
    console.error("Error creating audit request:", error);
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: "Failed to create audit request",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// GET - Get audit status/results
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get("auditId");

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId is required" },
        { status: 400 }
      );
    }

    const audit = await prisma.auditRequest.findUnique({
      where: { id: auditId },
      include: {
        results: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ audit });
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

