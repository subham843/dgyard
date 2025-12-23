import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrustScorePage } from "@/components/technician/trust-score-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianTrustScorePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <TrustScorePage />
    </TechnicianLayoutNew>
  );
}





