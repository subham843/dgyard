import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuotationPageNew } from "@/components/quotation/quotation-page-new";

export const metadata: Metadata = {
  title: "Get Your Custom CCTV Quotation - Quick & Accurate | D.G.Yard",
  description: "Get a personalized CCTV quotation in minutes. AI-assisted suggestions available via Honey. Quick, accurate, and designed for your space.",
};

export default function QuotationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <QuotationPageNew />
      </main>
      <Footer />
    </>
  );
}
