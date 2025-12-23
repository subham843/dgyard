import { Metadata } from "next";
import { ServiceTrackingList } from "@/components/customer/service-tracking-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Services - D.G.Yard",
  description: "Track your service requests and bookings",
};

export default async function ServicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <ServiceTrackingList />
      </main>
      <Footer />
    </>
  );
}





