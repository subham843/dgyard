import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompletedJobsPage } from "@/components/technician/completed-jobs-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function CompletedJobsPageRoute() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <CompletedJobsPage />
    </TechnicianLayoutNew>
  );
}





