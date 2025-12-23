import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SkillsManagement } from "@/components/admin/skills-management";

export const metadata: Metadata = {
  title: "Skills - Admin | D.G.Yard",
  description: "Manage skills",
};

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <AdminLayout>
      <SkillsManagement />
    </AdminLayout>
  );
}
