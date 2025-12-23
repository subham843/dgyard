import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobDiscoveryPage } from "@/components/technician/job-discovery-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function DiscoverJobsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <JobDiscoveryPage />
    </TechnicianLayoutNew>
  );
}





