import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CategoryNestedView } from "@/components/admin/category-nested-view";

export const metadata: Metadata = {
  title: "Categories (Nested View) - Admin | D.G.Yard",
  description: "View categories with subcategories and territory categories",
};

export default async function CategoriesNestedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <CategoryNestedView />
    </AdminLayout>
  );
}




















