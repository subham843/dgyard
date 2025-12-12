import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SecuritySurveillancePage } from "@/components/services/security-surveillance-page";

export const metadata: Metadata = {
  title: "Security & Surveillance Solutions - D.G.Yard",
  description: "Professional CCTV installation, IP cameras, access control systems, and security solutions for homes, offices, and industries.",
};

export default function SecuritySurveillanceService() {
  return (
    <>
      <Header />
      <SecuritySurveillancePage />
      <Footer />
    </>
  );
}
