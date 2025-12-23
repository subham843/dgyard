import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WalletManagementPanel } from "@/components/admin/wallet-management-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Wallet Management - Admin | D.G.Yard",
  description: "Manage user wallets and balances",
};

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/wallet");
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
      <WalletManagementPanel />
    </AdminLayout>
  );
}

