import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyJobsPage } from "@/components/technician/my-jobs-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function MyJobsPageRoute() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <MyJobsPage />
    </TechnicianLayoutNew>
  );
}





