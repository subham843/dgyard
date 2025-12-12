import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { BrandManagement } from "@/components/admin/brand-management";

export const metadata: Metadata = {
  title: "Brand Management - Admin | D.G.Yard",
  description: "Manage product brands",
};

export default async function BrandsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <BrandManagement />
    </AdminLayout>
  );
}




















