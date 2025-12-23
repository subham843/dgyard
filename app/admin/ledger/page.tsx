import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PaymentControlPanel } from "@/components/admin/payment-control-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ledger Management - Admin | D.G.Yard",
  description: "Manage ledger entries and holds",
};

export default async function LedgerPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/ledger");
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
      <PaymentControlPanel />
    </AdminLayout>
  );
}

