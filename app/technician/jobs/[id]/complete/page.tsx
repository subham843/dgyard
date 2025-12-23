import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobCompletionPage } from "@/components/technician/job-completion-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function JobCompletionRoute({
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
      <JobCompletionPage jobId={id} />
    </TechnicianLayoutNew>
  );
}




