import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BankDetailsPage } from "@/components/technician/bank-details-page";
import { TechnicianLayoutNew } from "@/components/technician/technician-layout-new";

export default async function TechnicianBankDetailsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TECHNICIAN") {
    redirect("/");
  }

  return (
    <TechnicianLayoutNew>
      <BankDetailsPage />
    </TechnicianLayoutNew>
  );
}





