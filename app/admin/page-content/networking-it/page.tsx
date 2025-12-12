import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { NetworkingITPageManagement } from "@/components/admin/networking-it-page-management";

export const metadata: Metadata = {
  title: "Networking & IT Page Content - Admin | D.G.Yard",
  description: "Manage content for the Networking & IT solutions page.",
};

export default async function NetworkingITPageContentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/page-content/networking-it");
  }

  return (
    <AdminLayout>
      <NetworkingITPageManagement />
    </AdminLayout>
  );
}












