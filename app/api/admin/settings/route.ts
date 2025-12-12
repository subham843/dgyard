import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearSettingsCache } from "@/lib/get-settings";

// GET - Fetch settings (only one settings record exists)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default one
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: "D.G.Yard",
          country: "India",
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Create or update settings (upsert)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Check if settings exist
    let existingSettings = await prisma.settings.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          siteName: data.siteName || existingSettings.siteName,
          siteTagline: data.siteTagline,
          logo: data.logo,
          favicon: data.favicon,
          favicon16x16: data.favicon16x16,
          favicon32x32: data.favicon32x32,
          favicon192x192: data.favicon192x192,
          favicon512x512: data.favicon512x512,
          appleTouchIcon: data.appleTouchIcon,
          description: data.description,
          keywords: data.keywords,
          email: data.email,
          phone: data.phone,
          whatsappNumber: data.whatsappNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country || "India",
          facebookUrl: data.facebookUrl,
          twitterUrl: data.twitterUrl,
          instagramUrl: data.instagramUrl,
          linkedinUrl: data.linkedinUrl,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          // Voice Settings - preserve existing values if not provided, but allow empty strings
          aiVoiceName: data.aiVoiceName !== undefined ? data.aiVoiceName : existingSettings.aiVoiceName,
          aiVoiceLang: data.aiVoiceLang !== undefined ? data.aiVoiceLang : existingSettings.aiVoiceLang,
          aiVoiceRate: data.aiVoiceRate !== undefined ? data.aiVoiceRate : existingSettings.aiVoiceRate,
          aiVoicePitch: data.aiVoicePitch !== undefined ? data.aiVoicePitch : existingSettings.aiVoicePitch,
          aiVoiceVolume: data.aiVoiceVolume !== undefined ? data.aiVoiceVolume : existingSettings.aiVoiceVolume,
          aiVoiceURI: data.aiVoiceURI !== undefined ? data.aiVoiceURI : existingSettings.aiVoiceURI,
          aiCustomVoiceUrl: data.aiCustomVoiceUrl !== undefined ? data.aiCustomVoiceUrl : existingSettings.aiCustomVoiceUrl,
          aiVoiceScript: data.aiVoiceScript !== undefined ? data.aiVoiceScript : existingSettings.aiVoiceScript,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: {
          siteName: data.siteName || "D.G.Yard",
          siteTagline: data.siteTagline,
          logo: data.logo,
          favicon: data.favicon,
          favicon16x16: data.favicon16x16,
          favicon32x32: data.favicon32x32,
          favicon192x192: data.favicon192x192,
          favicon512x512: data.favicon512x512,
          appleTouchIcon: data.appleTouchIcon,
          description: data.description,
          keywords: data.keywords,
          email: data.email,
          phone: data.phone,
          whatsappNumber: data.whatsappNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: data.country || "India",
          facebookUrl: data.facebookUrl,
          twitterUrl: data.twitterUrl,
          instagramUrl: data.instagramUrl,
          linkedinUrl: data.linkedinUrl,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage,
          // Voice Settings
          aiVoiceName: data.aiVoiceName,
          aiVoiceLang: data.aiVoiceLang,
          aiVoiceRate: data.aiVoiceRate,
          aiVoicePitch: data.aiVoicePitch,
          aiVoiceVolume: data.aiVoiceVolume,
          aiVoiceURI: data.aiVoiceURI,
          aiCustomVoiceUrl: data.aiCustomVoiceUrl,
          aiVoiceScript: data.aiVoiceScript,
        },
      });
    }

    // Clear cache after updating settings
    clearSettingsCache();

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

