import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DigitalMarketingPage } from "@/components/services/digital-marketing-page";

export const metadata: Metadata = {
  title: "Digital Marketing & Branding - D.G.Yard",
  description: "Professional digital marketing services, social media management, SEO, Google Ads, brand strategy, and online growth solutions.",
};

export default function DigitalMarketingService() {
  return (
    <>
      <Header />
      <DigitalMarketingPage />
      <Footer />
    </>
  );
}
