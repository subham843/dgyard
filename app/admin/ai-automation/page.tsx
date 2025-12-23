import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AIAutomationPanel } from "@/components/admin/ai-automation-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AI & Automation - Admin | D.G.Yard",
  description: "Manage AI rules and automation",
};

export default async function AIAutomationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/ai-automation");
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
      <AIAutomationPanel />
    </AdminLayout>
  );
}

