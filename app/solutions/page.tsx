import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ServicesPage } from "@/components/services/services-page";

export const metadata: Metadata = {
  title: "Solutions - Complete Solutions for Security, Connectivity & Growth | D.G.Yard",
  description: "Professional CCTV installation, networking solutions, digital marketing services, and industrial tech solutions. Complete solutions designed for smart spaces.",
};

export default function Solutions() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <ServicesPage />
      </main>
      <Footer />
    </>
  );
}












