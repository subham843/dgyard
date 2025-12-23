import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KYCPage } from "@/components/technician/kyc-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianKYCPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <KYCPage />
    </TechnicianLayoutNew>
  );
}





