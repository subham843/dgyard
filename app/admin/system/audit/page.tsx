import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Audit Logs - Admin | D.G.Yard",
  description: "View complete audit trail",
};

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/system/audit");
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
      <AuditLogViewer />
    </AdminLayout>
  );
}

