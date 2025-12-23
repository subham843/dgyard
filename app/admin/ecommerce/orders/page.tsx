import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ECommerceOrdersPanel } from "@/components/admin/ecommerce-orders-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "E-Commerce Orders - Admin | D.G.Yard",
  description: "Manage e-commerce orders",
};

export default async function ECommerceOrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/ecommerce/orders");
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
      <ECommerceOrdersPanel />
    </AdminLayout>
  );
}

