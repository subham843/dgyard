import { Metadata } from "next";
import { UserManagement } from "@/components/admin/user-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Management - Admin",
};

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
}

