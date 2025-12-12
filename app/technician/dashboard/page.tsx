import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TechnicianDashboard } from "@/components/technician/technician-dashboard";

export default async function TechnicianDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechnicianDashboard />
    </div>
  );
}
