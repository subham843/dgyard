import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { TechnicianPerformance } from "@/components/admin/technician-performance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Technician Performance - Admin | D.G.Yard",
  description: "View and analyze technician performance metrics",
};

export default async function TechnicianPerformancePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/performance/technicians");
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
      <TechnicianPerformance />
    </AdminLayout>
  );
}

