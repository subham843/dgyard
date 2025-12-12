import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NetworkingITPage } from "@/components/services/networking-it-page";

export const metadata: Metadata = {
  title: "Networking & IT Solutions - D.G.Yard",
  description: "Professional networking solutions, Wi-Fi planning, LAN cabling, enterprise network setup, and IT services for homes, offices, and institutions.",
};

export default function NetworkingITService() {
  return (
    <>
      <Header />
      <NetworkingITPage />
      <Footer />
    </>
  );
}
