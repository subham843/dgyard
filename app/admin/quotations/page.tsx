import { Metadata } from "next";
import { AdminQuotations } from "@/components/admin/admin-quotations";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Quotations - Admin - D.G.Yard",
  description: "Manage all quotations",
};

export default async function AdminQuotationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <AdminQuotations />
    </AdminLayout>
  );
}

