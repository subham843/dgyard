import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentsPage } from "@/components/technician/documents-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianDocumentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <DocumentsPage />
    </TechnicianLayoutNew>
  );
}





