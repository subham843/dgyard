import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SolutionsCategoryPage } from "@/components/solutions/solutions-category-page";

export const metadata: Metadata = {
  title: "Networking & IT Solutions - D.G.Yard",
  description: "Professional networking solutions, IT infrastructure, and connectivity services for businesses and institutions.",
};

export default function NetworkingITPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <SolutionsCategoryPage 
          category="networking-it"
          title="Networking & IT Solutions"
          subtitle="Stable, fast and clutter-free connectivity"
        />
      </main>
      <Footer />
    </>
  );
}
























