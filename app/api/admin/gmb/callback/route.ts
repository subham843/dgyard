import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGMBTokens } from "@/lib/gmb-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * GET - Handle Google OAuth callback
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/auth/signin?error=unauthorized", request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/reviews?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/reviews?error=no_code", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getGMBTokens(code);

    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in);

    // Get or create settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          gmbAccessToken: tokens.access_token,
          gmbRefreshToken: tokens.refresh_token || null,
          gmbTokenExpiry: tokenExpiry,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          gmbAccessToken: tokens.access_token,
          gmbRefreshToken: tokens.refresh_token || settings.gmbRefreshToken,
          gmbTokenExpiry: tokenExpiry,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/admin/reviews?gmb_connected=true", request.url)
    );
  } catch (error: any) {
    console.error("Error in GMB callback:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/reviews?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}

