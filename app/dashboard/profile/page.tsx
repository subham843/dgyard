import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProfileManagementWrapper } from "./profile-wrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile Settings - D.G.Yard",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; action?: string };
}) {
  // Check session on server side for logging
  const session = await getServerSession(authOptions);
  console.log(`[Profile Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}, Email: ${session?.user?.email}`);
  
  // Middleware already protects this route - if we reach here, user is authenticated
  // No need to check session here as middleware handles authentication
  // The ProfileManagement component uses useSession hook for client-side session data

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <ProfileManagementWrapper />
      </main>
      <Footer />
    </>
  );
}

