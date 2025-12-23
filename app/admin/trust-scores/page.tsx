import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { TrustScoreManagement } from "@/components/admin/trust-score-management";

export const metadata: Metadata = {
  title: "Trust Score Management | Admin Panel",
  description: "Manage trust scores for dealers and technicians",
};

export default async function AdminTrustScoresPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect("/auth/signin?callbackUrl=/admin/trust-scores");
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
        <TrustScoreManagement />
      </AdminLayout>
    );
  } catch (error: any) {
    console.error("Error in admin trust scores page:", error);
    redirect("/?error=admin-error");
  }
}




