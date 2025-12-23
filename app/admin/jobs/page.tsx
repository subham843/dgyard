import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ServiceJobManagement } from "@/components/admin/service-job-management";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Service Jobs - Admin | D.G.Yard",
  description: "Manage all service jobs",
};

export default async function ServiceJobsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/jobs");
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
      <ServiceJobManagement />
    </AdminLayout>
  );
}

