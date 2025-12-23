import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { RatingManagement } from "@/components/admin/rating-management";

export const metadata: Metadata = {
  title: "Rating Management | Admin Panel",
  description: "Manage all ratings between customers, dealers, and technicians",
};

export default async function AdminRatingsPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect("/auth/signin?callbackUrl=/admin/ratings");
    }

    const user = await import("@/lib/prisma").then(m => m.prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { role: true },
    }));

    if (!user || user.role !== "ADMIN") {
      redirect("/?error=admin-access-denied");
    }

    return (
      <AdminLayout>
        <RatingManagement />
      </AdminLayout>
    );
  } catch (error: any) {
    console.error("Error in admin ratings page:", error);
    redirect("/?error=admin-error");
  }
}




