import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { RiskControl } from "@/components/admin/risk-control";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Risk Control - Admin | D.G.Yard",
  description: "Monitor and manage platform risks",
};

export default async function RiskControlPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/risk-control");
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
      <RiskControl />
    </AdminLayout>
  );
}

