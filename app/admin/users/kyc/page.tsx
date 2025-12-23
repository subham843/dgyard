import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/admin-layout";
import { KYCVerificationPanel } from "@/components/admin/kyc-verification-panel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "KYC & Verification - Admin | D.G.Yard",
  description: "Manage KYC verification and documents",
};

export default async function KYCPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/users/kyc");
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
      <KYCVerificationPanel />
    </AdminLayout>
  );
}

