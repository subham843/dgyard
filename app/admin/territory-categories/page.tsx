import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { TerritoryCategoryManagement } from "@/components/admin/territory-category-management";

export const metadata: Metadata = {
  title: "Territory Category Management - Admin | D.G.Yard",
  description: "Manage territory categories",
};

export default async function TerritoryCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <TerritoryCategoryManagement />
    </AdminLayout>
  );
}




















