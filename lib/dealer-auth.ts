import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Check if dealer is approved and return dealer info
 * If dealer is not approved, redirects to pending approval page
 * Returns null if user is not a dealer
 */
export async function checkDealerApproval() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  // Only check for dealers
  if (session.user.role !== "DEALER") {
    return null;
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
    select: { 
      id: true,
      accountStatus: true,
      businessName: true,
    },
  });

  // If dealer exists but is not approved, redirect to show pending approval
  if (dealer && dealer.accountStatus !== "APPROVED") {
    // Return dealer info so the page can show appropriate message
    return {
      isApproved: false,
      accountStatus: dealer.accountStatus,
      dealer,
    };
  }

  // Dealer is approved or doesn't exist yet
  return {
    isApproved: true,
    accountStatus: dealer?.accountStatus || null,
    dealer,
  };
}











