import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { QuotationSettingsManagement } from "@/components/admin/quotation-settings-management";

export const metadata: Metadata = {
  title: "Quotation Settings - Admin | D.G.Yard",
  description: "Manage quotation settings",
};

export default async function QuotationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/quotation-settings");
  }

  return (
    <AdminLayout>
      <QuotationSettingsManagement />
    </AdminLayout>
  );
}

