import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AVFireInfrastructurePageManagement } from "@/components/admin/av-fire-infrastructure-page-management";

export const metadata: Metadata = {
  title: "AV, Fire & Smart Infrastructure Page Content - Admin | D.G.Yard",
  description: "Manage content for the AV, Fire & Smart Infrastructure solutions page.",
};

export default async function AVFireInfrastructurePageContentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/page-content/av-fire-infrastructure");
  }

  return (
    <AdminLayout>
      <AVFireInfrastructurePageManagement />
    </AdminLayout>
  );
}











