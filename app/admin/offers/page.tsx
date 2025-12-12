import { Metadata } from "next";
import { OfferManagement } from "@/components/admin/offer-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Manage Offers - Admin - D.G.Yard",
  description: "Manage offers and promotions",
};

export default async function OffersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/offers");
  }

  return (
    <AdminLayout>
      <OfferManagement />
    </AdminLayout>
  );
}

