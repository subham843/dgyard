import { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard - D.G.Yard",
  description: "Admin panel for managing the platform",
};

export default async function AdminPage() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      redirect("/auth/signin?callbackUrl=/admin");
    }

    // Check role from database to ensure it's up to date
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: { role: true },
    });

    if (!user) {
      console.error("Admin access denied: User not found in database", {
        email: session.user?.email,
      });
      redirect("/?error=admin-access-denied&reason=user-not-found");
    }

    if (user.role !== "ADMIN") {
      console.error("Admin access denied: User is not ADMIN", {
        email: session.user?.email,
        role: user.role,
      });
      redirect("/?error=admin-access-denied&reason=not-admin&role=" + user.role);
    }

    return (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    );
  } catch (error: any) {
    console.error("Error in admin page:", error);
    redirect("/?error=admin-error&message=" + encodeURIComponent(error.message));
  }
}

