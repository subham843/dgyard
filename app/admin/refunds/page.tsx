import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { RefundManagementPanel } from "@/components/admin/refund-management-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Refund Management - Admin | D.G.Yard",
  description: "Manage customer refunds, returns, and replacements",
};

export default async function RefundManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/refunds");
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
      <RefundManagementPanel />
    </AdminLayout>
  );
}

