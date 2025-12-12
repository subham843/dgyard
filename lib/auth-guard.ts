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











