import { Metadata } from "next";
import { AddressManagement } from "@/components/dashboard/address-management";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { checkDealerApproval } from "@/lib/dealer-auth";
import { DealerPendingApproval } from "@/components/dashboard/dealer-pending-approval";

export const metadata: Metadata = {
  title: "Addresses - D.G.Yard",
};

export default async function AddressesPage() {
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
        <AddressManagement />
      </main>
      <Footer />
    </>
  );
}

