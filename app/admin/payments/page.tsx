import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PaymentControlPanel } from "@/components/admin/payment-control-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payment Control - Admin | D.G.Yard",
  description: "Manage payments, wallets, and ledger entries",
};

export default async function PaymentControlPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/payments");
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

