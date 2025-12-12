import { Metadata } from "next";
import { ProductManagement } from "@/components/admin/product-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Product Management - Admin",
};

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <ProductManagement />
    </AdminLayout>
  );
}

