import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AVFireInfrastructurePage } from "@/components/services/av-fire-infrastructure-page";

export const metadata: Metadata = {
  title: "AV, Fire & Smart Infrastructure - D.G.Yard",
  description: "Complete audio-visual solutions, fire safety systems, smart infrastructure, and home automation for institutions and industries.",
};

export default function AVFireInfrastructureService() {
  return (
    <>
      <Header />
      <AVFireInfrastructurePage />
      <Footer />
    </>
  );
}
