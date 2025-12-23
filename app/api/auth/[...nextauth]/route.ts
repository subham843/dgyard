import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth v4 Route Handler for App Router
 * Handles all authentication routes: /api/auth/[...nextauth]
 * Supports GET and POST methods for NextAuth endpoints
 * 
 * For App Router, NextAuth v4 automatically handles the request format
 * and converts it to the expected format internally.
 */
const handler = NextAuth(authOptions);

// Export handlers directly - NextAuth v4 handles App Router requests automatically
// For Next.js 16 App Router, we need to handle the params Promise
export async function GET(
  req: Request,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const resolvedParams = await params;
    return handler(req, { params: resolvedParams } as any);
  } catch (error: any) {
    console.error("[NextAuth] GET Error:", error);
    return Response.json(
      { 
        error: "Authentication error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const resolvedParams = await params;
    return handler(req, { params: resolvedParams } as any);
  } catch (error: any) {
    console.error("[NextAuth] POST Error:", error);
    return Response.json(
      { 
        error: "Authentication error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}



