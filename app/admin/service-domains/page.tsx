import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ServiceDomainManagement } from "@/components/admin/service-domain-management";

export const metadata: Metadata = {
  title: "Service Domains - Admin | D.G.Yard",
  description: "Manage service domains",
};

export default async function ServiceDomainsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <ServiceDomainManagement />
    </AdminLayout>
  );
}


