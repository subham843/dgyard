import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { UserManagementPanel } from "@/components/admin/user-management-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Technicians Management - Admin | D.G.Yard",
  description: "Manage technicians and their accounts",
};

export default async function TechniciansPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/users/technicians");
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
      <UserManagementPanel type="technicians" />
    </AdminLayout>
  );
}





