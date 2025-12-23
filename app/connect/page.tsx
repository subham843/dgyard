import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConnectPageContent } from "@/components/connect/connect-page-content";

export const metadata: Metadata = {
  title: "D.G.Yard Connect - Connect. Negotiate. Track. Complete.",
  description: "One platform to connect dealers, technicians & customers. Manage service jobs, negotiate price fairly, track technicians live, and complete work securely with OTP, AI support & warranty protection.",
};

export default function ConnectPage() {
  return (
    <>
      <Header />
      <ConnectPageContent />
      <Footer />
    </>
  );
}












