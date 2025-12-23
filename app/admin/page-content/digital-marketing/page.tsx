import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { DigitalMarketingPageManagement } from "@/components/admin/digital-marketing-page-management";

export const metadata: Metadata = {
  title: "Digital Marketing Page Content - Admin | D.G.Yard",
  description: "Manage content for the Digital Marketing & Branding solutions page.",
};

export default async function DigitalMarketingPageContentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/page-content/digital-marketing");
  }

  return (
    <AdminLayout>
      <DigitalMarketingPageManagement />
    </AdminLayout>
  );
}
























