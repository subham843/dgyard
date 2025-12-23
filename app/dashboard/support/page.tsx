import { Metadata } from "next";
import { SupportHelp } from "@/components/customer/support-help";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Support & Help - D.G.Yard",
  description: "Get help and support for your services",
};

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <SupportHelp />
      </main>
      <Footer />
    </>
  );
}





