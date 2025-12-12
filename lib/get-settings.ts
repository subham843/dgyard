import { prisma } from "@/lib/prisma";

// Cache for settings to avoid repeated database queries
let settingsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache (60 seconds)

/**
 * Server-side function to get settings for use in Server Components
 * Uses caching to improve performance - settings are cached for 1 minute
 */
export async function getSettings() {
  // Check cache first
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const settings = await prisma.settings.findFirst();
    
    const defaultSettings = {
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
    };

    if (!settings) {
      // Cache default settings
      settingsCache = defaultSettings;
      cacheTimestamp = now;
      return defaultSettings;
    }
    
    // Cache actual settings
    settingsCache = settings;
    cacheTimestamp = now;
    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return cached settings if available, otherwise return defaults
    if (settingsCache) {
      return settingsCache;
    }
    const defaultSettings = {
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
    };
    // Cache defaults on error
    settingsCache = defaultSettings;
    cacheTimestamp = Date.now();
    return defaultSettings;
  }
}

/**
 * Clear settings cache (useful when settings are updated)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}

