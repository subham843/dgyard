import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryManagement } from "@/components/admin/category-management";

export const metadata: Metadata = {
  title: "Category Management - Admin | D.G.Yard",
  description: "Manage product categories",
};

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <CategoryManagement />
    </AdminLayout>
  );
}




















