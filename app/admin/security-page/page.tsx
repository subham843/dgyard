import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SecurityPageManagement } from "@/components/admin/security-page-management";

export const metadata: Metadata = {
  title: "Security Page Management - Admin | D.G.Yard",
  description: "Manage Security & Surveillance page content",
};

export default async function SecurityPageAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/security-page");
  }

  return (
    <AdminLayout>
      <SecurityPageManagement />
    </AdminLayout>
  );
}












