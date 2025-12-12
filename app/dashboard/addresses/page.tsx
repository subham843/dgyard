import { Metadata } from "next";
import { AddressManagement } from "@/components/dashboard/address-management";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Addresses - D.G.Yard",
};

export default async function AddressesPage() {
  // Middleware already protects this route - if we reach here, user is authenticated
  // Check session for logging only, don't redirect (middleware handles auth)
  const session = await getServerSession(authOptions);
  console.log(`[Addresses Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}`);

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

