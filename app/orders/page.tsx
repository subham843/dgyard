import { Metadata } from "next";
import { EnhancedOrderManagement } from "@/components/customer/enhanced-order-management";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Orders - D.G.Yard",
  description: "Track and manage your product orders",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <EnhancedOrderManagement />
      </main>
      <Footer />
    </>
  );
}

