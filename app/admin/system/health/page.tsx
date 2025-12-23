import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SystemHealthPanel } from "@/components/admin/system-health-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "System Health - Admin | D.G.Yard",
  description: "Monitor system health and status",
};

export default async function SystemHealthPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/system/health");
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
      <SystemHealthPanel />
    </AdminLayout>
  );
}

