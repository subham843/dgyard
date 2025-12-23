import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CommissionSettingsPanel } from "@/components/admin/commission-settings-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Platform Commission Settings - Admin | D.G.Yard",
  description: "Configure platform commission rules for services and products",
};

export default async function CommissionSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/finance/commission");
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
      <CommissionSettingsPanel />
    </AdminLayout>
  );
}

