import { Metadata } from "next";
import { UserQuotations } from "@/components/dashboard/user-quotations";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Quotations - D.G.Yard",
  description: "View and manage your saved quotations",
};

export default async function QuotationsPage() {
  // Middleware already protects this route - if we reach here, user is authenticated
  // Check session for logging only, don't redirect (middleware handles auth)
  const session = await getServerSession(authOptions);
  console.log(`[Quotations Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}`);

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

