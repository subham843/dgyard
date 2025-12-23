import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SellerSettlementPanel } from "@/components/admin/seller-settlement-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Seller Settlement - Admin | D.G.Yard",
  description: "Manage seller settlements and payouts",
};

export default async function SellerSettlementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/finance/settlement");
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
      <SellerSettlementPanel />
    </AdminLayout>
  );
}

