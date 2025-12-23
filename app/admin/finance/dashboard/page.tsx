import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { FinanceDashboard } from "@/components/admin/finance-dashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Finance Dashboard - Admin | D.G.Yard",
  description: "Platform revenue and commission statistics",
};

export default async function FinanceDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/finance/dashboard");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Platform revenue and commission overview</p>
          </div>
        </div>
        <div className="px-8 py-8 max-w-[1920px] mx-auto">
          <FinanceDashboard />
        </div>
      </div>
    </AdminLayout>
  );
}

