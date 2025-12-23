import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SecurityPage } from "@/components/technician/security-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianSecurityPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <SecurityPage />
    </TechnicianLayoutNew>
  );
}





