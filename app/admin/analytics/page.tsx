import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Analytics - Admin",
};

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <AnalyticsDashboard />
    </AdminLayout>
  );
}

