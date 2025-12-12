import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ServicesPage } from "@/components/services/services-page";

export const metadata: Metadata = {
  title: "SOLUTIONS — Everything You Need, One Smart Platform | D.G.Yard",
  description: "Technology should make life easier — safer homes, smarter offices, better communication, and stronger digital presence. D.G.Yard brings all solutions together under one roof, powered by expert engineering, clean installation, and our AI assistant Honey.",
};

export default function Services() {
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

