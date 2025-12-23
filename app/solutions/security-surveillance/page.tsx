import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SolutionsCategoryPage } from "@/components/solutions/solutions-category-page";

export const metadata: Metadata = {
  title: "Security & Surveillance Solutions - D.G.Yard",
  description: "Professional CCTV installation, access control, and security systems for homes, offices, and industries.",
};

export default function SecuritySurveillancePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <SolutionsCategoryPage 
          category="security-surveillance"
          title="Security & Surveillance"
          subtitle="Reliable protection for homes, offices & industries"
        />
      </main>
      <Footer />
    </>
  );
}
























