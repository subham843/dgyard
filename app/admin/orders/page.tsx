import { Metadata } from "next";
import { OrderManagement } from "@/components/admin/order-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Order Management - Admin",
};

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <OrderManagement />
    </AdminLayout>
  );
}

