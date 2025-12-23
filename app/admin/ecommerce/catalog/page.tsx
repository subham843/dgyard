import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { InventoryCatalogPanel } from "@/components/admin/inventory-catalog-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inventory & Catalog - Admin | D.G.Yard",
  description: "Manage inventory and catalog",
};

export default async function InventoryCatalogPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/ecommerce/catalog");
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
      <InventoryCatalogPanel />
    </AdminLayout>
  );
}

