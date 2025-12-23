import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DisputedJobsPage } from "@/components/technician/disputed-jobs-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function DisputedJobsPageRoute() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <DisputedJobsPage />
    </TechnicianLayoutNew>
  );
}





