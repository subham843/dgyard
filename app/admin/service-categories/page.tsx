import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ServiceCategoryManagement } from "@/components/admin/service-category-management";

export const metadata: Metadata = {
  title: "Service Categories - Admin | D.G.Yard",
  description: "Manage service categories",
};

export default async function ServiceCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <ServiceCategoryManagement />
    </AdminLayout>
  );
}

