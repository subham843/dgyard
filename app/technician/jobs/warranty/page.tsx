import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WarrantyJobsPage } from "@/components/technician/warranty-jobs-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function WarrantyJobsPageRoute() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <WarrantyJobsPage />
    </TechnicianLayoutNew>
  );
}





