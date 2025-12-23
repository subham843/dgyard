import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PriceCalculatorAdmin } from "@/components/admin/price-calculator-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Price Calculator - Admin | D.G.Yard",
  description: "Manage CCTV price calculator settings and configurations",
};

export default async function PriceCalculatorPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/price-calculator");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/?error=admin-access-denied");
  }

  return (
    <AdminLayout>
      <PriceCalculatorAdmin />
    </AdminLayout>
  );
}

