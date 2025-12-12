import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { TechnicianManagement } from "@/components/admin/technician-management";

export default async function AdminTechniciansPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <TechnicianManagement />
    </AdminLayout>
  );
}
