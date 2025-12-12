import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get settings for frontend
// Reduced cache time for voice settings to update faster
export const revalidate = 10; // Cache for 10 seconds instead of 1 hour

export async function GET(request: Request) {
  try {
    // Check for cache busting query param
    const { searchParams } = new URL(request.url);
    const noCache = searchParams.get("t"); // timestamp param for cache busting
    
    let settings = await prisma.settings.findFirst();

    // If no settings exist, return default values
    if (!settings) {
      return NextResponse.json({
        settings: {
          siteName: "D.G.Yard",
          siteTagline: null,
          logo: null,
          favicon: null,
          favicon16x16: null,
          favicon32x32: null,
          favicon192x192: null,
          favicon512x512: null,
          appleTouchIcon: null,
          description: null,
          keywords: null,
          email: null,
          phone: null,
          whatsappNumber: null,
          address: null,
          city: null,
          state: null,
          pincode: null,
          country: "India",
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          linkedinUrl: null,
          metaTitle: null,
          metaDescription: null,
          ogImage: null,
        },
      });
    }

    return NextResponse.json(
      { settings },
      {
        headers: {
          // Reduced cache time for faster voice settings updates
          'Cache-Control': noCache 
            ? 'no-cache, no-store, must-revalidate' 
            : 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

