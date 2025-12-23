import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ECommerceAdminPanel } from "@/components/admin/ecommerce-admin-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "E-Commerce Admin - Admin | D.G.Yard",
  description: "Manage multi-seller products, orders, and inventory",
};

export default async function ECommerceAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/ecommerce/products");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/?error=admin-access-denied");
  }

  return (
    <AdminLayout>
      <ECommerceAdminPanel />
    </AdminLayout>
  );
}

