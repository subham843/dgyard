import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { FinanceReportsPanel } from "@/components/admin/finance-reports-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Finance Reports - Admin | D.G.Yard",
  description: "Generate and export financial reports",
};

export default async function FinanceReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/finance/reports");
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
      <FinanceReportsPanel />
    </AdminLayout>
  );
}

