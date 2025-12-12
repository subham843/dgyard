import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SubCategoryManagement } from "@/components/admin/subcategory-management";

export const metadata: Metadata = {
  title: "Sub Category Management - Admin | D.G.Yard",
  description: "Manage product subcategories",
};

export default async function SubCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <SubCategoryManagement />
    </AdminLayout>
  );
}




















