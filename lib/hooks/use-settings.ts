"use client";

import { useState, useEffect } from "react";

export interface Settings {
  siteName: string;
  siteTagline?: string | null;
  logo?: string | null;
  favicon?: string | null;
  favicon16x16?: string | null;
  favicon32x32?: string | null;
  favicon192x192?: string | null;
  favicon512x512?: string | null;
  appleTouchIcon?: string | null;
  description?: string | null;
  keywords?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching settings:", error);
        setSettings(null);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

