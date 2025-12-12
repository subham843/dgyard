import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "About Us - The Story Behind D.G.Yard | Building Safer, Smarter Spaces",
  description: "Learn about D.G.Yard - building safer, smarter and more connected spaces with technology that makes life easier. Our story, values, and mission.",
};

export default function About() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <AboutPage />
      </main>
      <Footer />
    </>
  );
}













