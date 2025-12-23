import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DealerDashboardV2 } from "@/components/dealer/dealer-dashboard-v2";

export const metadata: Metadata = {
  title: "Dealer Dashboard - D.G.Yard",
  description: "Manage your services, products, technicians, and payments",
};

export default async function DealerDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/dealer/dashboard");
  }

  if (session.user.role !== "DEALER") {
    redirect("/dashboard");
  }

  return <DealerDashboardV2 />;
}



