import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthCheckResult {
  authenticated: boolean;
  profileComplete: boolean;
  phoneVerified: boolean;
  redirect?: string;
  userId?: string;
}

/**
 * Check if user is authenticated and has complete profile
 */
export async function checkAuthAndProfile(): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions);

  // Not authenticated
  if (!session?.user?.id) {
    return {
      authenticated: false,
      profileComplete: false,
      phoneVerified: false,
    };
  }

  // Get user profile from database
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
    return {
      authenticated: false,
      profileComplete: false,
      phoneVerified: false,
    };
  }

  // Check profile completion
  const profileComplete = !!(user.name && user.email && user.phone);
  
  // Check phone verification
  const phoneVerified = user.phoneVerified === true;

  return {
    authenticated: true,
    profileComplete,
    phoneVerified,
    userId: user.id,
  };
}

/**
 * Get redirect URL based on what's missing
 */
export function getAuthRedirectUrl(
  result: AuthCheckResult,
  currentPath: string
): string | null {
  // Not authenticated - redirect to login
  if (!result.authenticated) {
    return `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`;
  }

  // Profile incomplete - redirect to profile
  if (!result.profileComplete) {
    return `/dashboard/profile?callbackUrl=${encodeURIComponent(currentPath)}&action=complete`;
  }

  // Phone not verified - redirect to phone verification
  if (!result.phoneVerified) {
    return `/dashboard/profile?callbackUrl=${encodeURIComponent(currentPath)}&action=verify-phone`;
  }

  return null;
}

/**
 * Create API error response for unauthorized access
 */
export function createAuthErrorResponse(
  result: AuthCheckResult,
  currentPath: string
): NextResponse {
  const redirectUrl = getAuthRedirectUrl(result, currentPath);

  return NextResponse.json(
    {
      error: "Authentication required",
      message: !result.authenticated
        ? "Please login to continue"
        : !result.profileComplete
        ? "Please complete your profile"
        : "Please verify your phone number",
      redirect: redirectUrl,
    },
    { status: 401 }
  );
}

/**
 * Helper function for route handlers to get authenticated session
 * Returns session or null, and handles errors gracefully
 * For NextAuth v4 with App Router
 */
export async function getAuthenticatedSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Helper function for route handlers to require authentication
 * Returns session or NextResponse with 401 error
 * For NextAuth v4 with App Router
 */
export async function requireAuth(): Promise<
  | { session: Awaited<ReturnType<typeof getServerSession>>; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Helper function for route handlers to require specific role
 * Returns session or NextResponse with 403 error
 * For NextAuth v4 with App Router
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<
  | { session: Awaited<ReturnType<typeof getServerSession>>; error: null }
  | { session: null; error: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.error) {
    return authResult;
  }

  const session = authResult.session;
  const userRole = session?.user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return {
      session: null,
      error: NextResponse.json(
        {
          error: "Forbidden",
          message: `Access denied. Required role: ${allowedRoles.join(", ")}`,
        },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Helper function for route handlers to require admin role
 * Returns session or NextResponse with 403 error
 * For NextAuth v4 with App Router
 */
export async function requireAdmin(): Promise<
  | { session: Awaited<ReturnType<typeof getServerSession>>; error: null }
  | { session: null; error: NextResponse }
> {
  return requireRole(["ADMIN"]);
}






















