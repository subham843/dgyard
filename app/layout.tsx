import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

// Lazy load heavy components to improve initial page load
const FloatingContact = dynamic(() => import("@/components/layout/floating-contact").then(mod => ({ default: mod.FloatingContact })), {
  ssr: false,
  loading: () => null,
});

const AIChatbot = dynamic(() => import("@/components/ai-assistant/ai-chatbot").then(mod => ({ default: mod.AIChatbot })), {
  ssr: false,
  loading: () => null,
});
import { getSettings } from "@/lib/get-settings";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"], // Reduced weights for faster loading
});

const lora = Lora({ 
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "600", "700"], // Reduced weights for faster loading
});

// Dynamic metadata based on settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  
  const siteName = settings.siteName || "D.G.Yard";
  const metaTitle = settings.metaTitle || `${siteName} - CCTV Solutions & Security Systems`;
  const metaDescription = settings.metaDescription || settings.description || "Premium CCTV cameras, security systems, installation services, networking solutions, and digital marketing services. Get expert consultation and competitive pricing.";
  const keywords = settings.keywords ? settings.keywords.split(",").map(k => k.trim()) : ["CCTV", "security cameras", "surveillance systems", "installation services", "networking", "digital marketing"];
  const ogImage = settings.ogImage || settings.logo || "/og-image.jpg";

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDescription,
    keywords: keywords,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: baseUrl,
      siteName: siteName,
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
    },
    icons: {
      icon: settings.favicon32x32 || settings.favicon16x16 || settings.favicon || "/favicon.ico",
      shortcut: settings.favicon16x16 || settings.favicon || "/favicon.ico",
      apple: settings.appleTouchIcon || "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  return (
      <html lang="en" className={`${playfair.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        {/* Favicon Links */}
        {settings.favicon16x16 && (
          <link rel="icon" type="image/png" sizes="16x16" href={settings.favicon16x16} />
        )}
        {settings.favicon32x32 && (
          <link rel="icon" type="image/png" sizes="32x32" href={settings.favicon32x32} />
        )}
        {settings.favicon192x192 && (
          <link rel="icon" type="image/png" sizes="192x192" href={settings.favicon192x192} />
        )}
        {settings.favicon512x512 && (
          <link rel="icon" type="image/png" sizes="512x512" href={settings.favicon512x512} />
        )}
        {settings.favicon && !settings.favicon16x16 && !settings.favicon32x32 && (
          <link rel="icon" href={settings.favicon} />
        )}
        {!settings.favicon && !settings.favicon16x16 && (
          <link rel="icon" href="/favicon.ico" />
        )}
        {settings.appleTouchIcon && (
          <link rel="apple-touch-icon" href={settings.appleTouchIcon} />
        )}
        {!settings.appleTouchIcon && (
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        )}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={lora.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
          <FloatingContact />
          {/* Lazy load chatbot to improve initial page load */}
          <AIChatbot />
        </Providers>
      </body>
    </html>
  );
}



