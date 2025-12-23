import { Metadata } from "next";
import { CustomerDashboard } from "@/components/customer/customer-dashboard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { checkDealerApproval } from "@/lib/dealer-auth";
import { DealerPendingApproval } from "@/components/dashboard/dealer-pending-approval";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard - D.G.Yard",
  description: "Your account dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect technicians to their dedicated dashboard
  if (session?.user?.role === "TECHNICIAN") {
    redirect("/technician/dashboard");
  }

  // Redirect dealers to their dedicated dashboard
  if (session?.user?.role === "DEALER") {
    redirect("/dealer/dashboard");
  }

  // Check if dealer is approved
  const dealerCheck = await checkDealerApproval();

  // If dealer is not approved, show pending approval message
  if (dealerCheck && !dealerCheck.isApproved && dealerCheck.accountStatus) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-lavender-soft">
          <DealerPendingApproval accountStatus={dealerCheck.accountStatus} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <CustomerDashboard />
      </main>
      <Footer />
    </>
  );
}

