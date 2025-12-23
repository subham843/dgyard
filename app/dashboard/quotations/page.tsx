import { Metadata } from "next";
import { UserQuotations } from "@/components/dashboard/user-quotations";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { checkDealerApproval } from "@/lib/dealer-auth";
import { DealerPendingApproval } from "@/components/dashboard/dealer-pending-approval";

export const metadata: Metadata = {
  title: "My Quotations - D.G.Yard",
  description: "View and manage your saved quotations",
};

export default async function QuotationsPage() {
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
      <main className="min-h-screen bg-lavender-soft">
        <UserQuotations />
      </main>
      <Footer />
    </>
  );
}

