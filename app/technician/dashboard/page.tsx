import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TechnicianDashboardComplete } from "@/components/technician/technician-dashboard-complete";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <TechnicianDashboardComplete />
    </TechnicianLayoutNew>
  );
}
