import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SolutionsCategoryPage } from "@/components/solutions/solutions-category-page";

export const metadata: Metadata = {
  title: "Digital Marketing & Branding - D.G.Yard",
  description: "Professional digital marketing, branding, and social media management services for businesses and organizations.",
};

export default function DigitalMarketingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <SolutionsCategoryPage 
          category="digital-marketing"
          title="Digital Marketing & Branding"
          subtitle="Clear strategies. Real results. Strong brand identity"
        />
      </main>
      <Footer />
    </>
  );
}
























