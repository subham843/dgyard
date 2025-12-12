import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SolutionsCategoryPage } from "@/components/solutions/solutions-category-page";

export const metadata: Metadata = {
  title: "AV, Fire & Smart Infrastructure - D.G.Yard",
  description: "Complete audio-visual solutions, fire safety systems, and smart infrastructure for institutions and industries.",
};

export default function AVFireInfrastructurePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <SolutionsCategoryPage 
          category="av-fire-infrastructure"
          title="AV, Fire & Smart Infrastructure"
          subtitle="Modern communication, safety, and infrastructure solutions"
        />
      </main>
      <Footer />
    </>
  );
}












