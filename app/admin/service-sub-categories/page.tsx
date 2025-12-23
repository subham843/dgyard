import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ServiceSubCategoryManagement } from "@/components/admin/service-subcategory-management";

export const metadata: Metadata = {
  title: "Service Sub Categories - Admin | D.G.Yard",
  description: "Manage service sub categories",
};

export default async function ServiceSubCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <ServiceSubCategoryManagement />
    </AdminLayout>
  );
}


