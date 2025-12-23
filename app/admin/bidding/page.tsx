import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { BiddingManagement } from "@/components/admin/bidding-management";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bidding Management - Admin | D.G.Yard",
  description: "Manage bidding jobs and detect fraud",
};

export default async function BiddingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/bidding");
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
      <BiddingManagement />
    </AdminLayout>
  );
}

