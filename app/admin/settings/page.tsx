import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SettingsManagement } from "@/components/admin/settings-management";

export const metadata: Metadata = {
  title: "Settings - Admin | D.G.Yard",
  description: "Manage website settings",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/settings");
  }

  return (
    <AdminLayout>
      <SettingsManagement />
    </AdminLayout>
  );
}

