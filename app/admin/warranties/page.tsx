import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { WarrantyDisputeManagement } from "@/components/admin/warranty-dispute-management";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Warranty & Disputes - Admin | D.G.Yard",
  description: "Manage warranties, complaints, and disputes",
};

export default async function WarrantyDisputePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/warranties");
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
      <WarrantyDisputeManagement />
    </AdminLayout>
  );
}

