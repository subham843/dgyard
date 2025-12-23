import { Metadata } from "next";
import { CCTVEstimationForm } from "@/components/customer/cctv-estimation-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "CCTV Estimation & Quotation - D.G.Yard",
  description: "Get instant price estimation for CCTV installation with auto quotation",
};

export default function CCTVEstimationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <CCTVEstimationForm />
      </main>
      <Footer />
    </>
  );
}





