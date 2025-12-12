import { Metadata } from "next";
import { ReviewManagement } from "@/components/admin/review-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Review Management - Admin",
};

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <ReviewManagement />
      </div>
    </AdminLayout>
  );
}

