import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobDetailPage } from "@/components/technician/job-detail-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianJobDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  const { id } = await params;

  return (
    <TechnicianLayoutNew>
      <JobDetailPage jobId={id} />
    </TechnicianLayoutNew>
  );
}


